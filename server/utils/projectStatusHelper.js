/**
 * projectStatusHelper.js
 * Shared helpers for RE Project Status and Category-Department matching.
 */

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
 * Project Status Derivation Rule:
 * - If ALL task_owners rows for the project have status = 'completed' → 'completed'
 * - Else if ANY task_owners row has a deadline in the past AND status is NOT 'completed' → 'blocked'
 * - Else if ANY task_owners row has status IN ('in_progress','review') → 'in_progress'
 * - Else (all still 'pending', no overdue) → 'assigned'
 */
function deriveProjectStatus(taskRows) {
  if (!taskRows || taskRows.length === 0) return "assigned";

  const allCompleted = taskRows.every((t) => t.status === "completed");
  if (allCompleted) return "completed";

  const todayStr = new Date().toISOString().split("T")[0];
  const hasBlocked = taskRows.some((t) => {
    if (!t.deadline) return false;
    const dStr =
      typeof t.deadline === "string"
        ? t.deadline.substring(0, 10)
        : new Date(t.deadline).toISOString().split("T")[0];
    return dStr < todayStr && t.status !== "completed";
  });
  if (hasBlocked) return "blocked";

  const hasInProgress = taskRows.some(
    (t) => t.status === "in_progress" || t.status === "review"
  );
  if (hasInProgress) return "in_progress";

  return "assigned";
}

module.exports = {
  matchesCategoryAndDepartment,
  deriveProjectStatus,
};

