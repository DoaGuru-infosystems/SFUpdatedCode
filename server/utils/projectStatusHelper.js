/**
 * projectStatusHelper.js
 * Shared helpers for RE Project Status and Category-Department matching.
 */

// In-memory cache for department strict_deadline_tracking flags
let cachedDepartments = [];

/**
 * Updates in-memory department cache with an array of department objects:
 * [{ name: string, strict_deadline_tracking: boolean|number }, ...]
 */
function setDepartmentCache(departments) {
  if (Array.isArray(departments)) {
    cachedDepartments = departments.map((d) => ({
      name: String(d.name || "").trim(),
      strict_deadline_tracking: Boolean(
        d.strict_deadline_tracking === 1 ||
        d.strict_deadline_tracking === true ||
        d.strict_deadline_tracking === "1"
      ),
    }));
  }
}

/**
 * Loads or refreshes the in-memory department cache directly from the database.
 */
function loadDepartmentCache(callback) {
  try {
    const { db } = require("../config/db");
    if (!db || typeof db.query !== "function") {
      if (typeof callback === "function") callback(null, cachedDepartments);
      return;
    }
    db.query(
      "SELECT name, strict_deadline_tracking FROM departments",
      (err, rows) => {
        if (!err && Array.isArray(rows)) {
          setDepartmentCache(rows);
        }
        if (typeof callback === "function") callback(err, cachedDepartments);
      }
    );
  } catch (e) {
    if (typeof callback === "function") callback(e, cachedDepartments);
  }
}

// Auto-populate cache on load
loadDepartmentCache();

/**
 * Case-insensitive partial matching between RE service item category and SF user department.
 * Handles known acronyms like 'DM' <-> 'Digital Marketing', 'Dev' <-> 'Development', 'SEO' <-> 'seo'.
 */
function matchesCategoryAndDepartment(category, department) {
  if (!category || !department) return false;
  const cat = String(category).trim().toLowerCase();
  const dept = String(department).trim().toLowerCase();

  // Exact match (case-insensitive)
  if (cat === dept) return true;

  // Direct substring match
  if (dept.includes(cat) || cat.includes(dept)) return true;

  // Digital Marketing / DM
  if (
    (cat === "dm" || cat.includes("marketing") || cat.includes("digital") || cat.includes("social") || cat.includes("media")) &&
    (dept.includes("digital") || dept.includes("marketing") || dept === "dm")
  ) {
    return true;
  }

  // Development / Dev / Web / IT
  if (
    (cat === "dev" || cat.includes("develop") || cat.includes("web") || cat.includes("ui") || cat.includes("software") || cat.includes("testing") || cat.includes("code")) &&
    (dept.includes("develop") || dept.includes("dev") || dept === "it")
  ) {
    return true;
  }

  // SEO
  if (cat.includes("seo") && dept.includes("seo")) {
    return true;
  }

  // Sales
  if (cat.includes("sale") && dept.includes("sale")) {
    return true;
  }

  return false;
}

/**
 * Determines whether a task belongs to a department with strict deadline tracking.
 * Checks explicit task properties, passed departmentsList, and cached departments.
 * Defaults to true if unknown.
 */
function isStrictDepartment(task, departmentsList) {
  if (!task) return true;

  // 1. Direct property override on task
  if (task.strict_deadline_tracking !== undefined && task.strict_deadline_tracking !== null) {
    return Boolean(
      task.strict_deadline_tracking === 1 ||
      task.strict_deadline_tracking === true ||
      task.strict_deadline_tracking === "1"
    );
  }

  const catOrDept = task.category || task.department || "";

  // 2. Check passed departmentsList
  if (Array.isArray(departmentsList) && departmentsList.length > 0) {
    const matched = departmentsList.find((d) =>
      matchesCategoryAndDepartment(catOrDept, d.name)
    );
    if (matched && matched.strict_deadline_tracking !== undefined && matched.strict_deadline_tracking !== null) {
      return Boolean(
        matched.strict_deadline_tracking === 1 ||
        matched.strict_deadline_tracking === true ||
        matched.strict_deadline_tracking === "1"
      );
    }
  }

  // 3. Check in-memory cached departments
  if (cachedDepartments.length > 0) {
    const matchedCache = cachedDepartments.find((d) =>
      matchesCategoryAndDepartment(catOrDept, d.name)
    );
    if (matchedCache) {
      return matchedCache.strict_deadline_tracking;
    }
  }

  // Default fallback: strict = true
  return true;
}

/**
 * Project Status Derivation Rule (Department-Aware):
 * 1. Completed: ALL tasks (har department) status = 'completed' -> 'completed'
 * 2. Blocked: Sirf un tasks ko consider karo jinka department strict_deadline_tracking = TRUE hai
 *    - agar inme se koi overdue (deadline nikal gaya, incomplete) hai -> 'blocked'
 * 3. In Progress:
 *    - Koi task 'in_progress'/'review' hai, YA
 *    - Koi strict_deadline_tracking = FALSE wale department ka task abhi bhi incomplete hai
 *      (chahe uski deadline nikal chuki ho) -> 'in_progress'
 * 4. Assigned: Baki sab pending hain, koi "Blocked"-eligible task overdue nahi -> 'assigned'
 *
 * @param {Array<object>} taskRows - List of task_owners rows for the project
 * @param {Array<object>} [departments] - Optional list of department objects with strict_deadline_tracking
 * @returns {"completed"|"blocked"|"in_progress"|"assigned"}
 */
function deriveProjectStatus(taskRows, departments = null) {
  if (!taskRows || taskRows.length === 0) return "assigned";

  // 1. All tasks completed
  const allCompleted = taskRows.every((t) => t.status === "completed");
  if (allCompleted) return "completed";

  const todayStr = new Date().toISOString().split("T")[0];

  function isOverdue(t) {
    if (!t.deadline) return false;
    const dStr =
      typeof t.deadline === "string"
        ? t.deadline.substring(0, 10)
        : new Date(t.deadline).toISOString().split("T")[0];
    return dStr < todayStr && t.status !== "completed";
  }

  // 2. Blocked: Sirf strict deadline tracking wale tasks me se koi overdue hai
  const hasStrictBlocked = taskRows.some((t) => {
    const isStrict = isStrictDepartment(t, departments);
    return isStrict && isOverdue(t);
  });
  if (hasStrictBlocked) return "blocked";

  // 3. In Progress:
  // - Any task is 'in_progress' or 'review'
  // - OR any non-strict task is overdue & incomplete (flexible deadline cross, does not block project)
  const hasInProgress = taskRows.some((t) => {
    if (t.status === "in_progress" || t.status === "review") {
      return true;
    }
    const isStrict = isStrictDepartment(t, departments);
    if (!isStrict && isOverdue(t)) {
      return true;
    }
    return false;
  });
  if (hasInProgress) return "in_progress";

  // 4. Default: Assigned
  return "assigned";
}

module.exports = {
  matchesCategoryAndDepartment,
  deriveProjectStatus,
  isStrictDepartment,
  loadDepartmentCache,
  refreshDepartmentCache: loadDepartmentCache,
  setDepartmentCache,
};
