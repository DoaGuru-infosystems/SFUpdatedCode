import React, { useState, useEffect } from "react";
import { useReminders } from "../context/ReminderContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function ReminderForm() {
  const { employees, createReminder, updateReminder } = useReminders();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    assignment_type: "self",
    employee_id: "",
    employee_ids: [],
    title: "",
    note: "",
    reminder_date: "",
    reminder_time: "",
    remind_before: "10_minutes",
    custom_remind_minutes: "",
    repeat_type: "none",
    delivery_method: "all_channels",
    message_template:
      "Hello {{employee_name}}, this is a reminder for {{title}} scheduled on {{date}} at {{time}}.",
    dnd_enabled: false,
    dnd_start_time: "22:00:00",
    dnd_end_time: "08:00:00",
    status: "pending",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [singleSearchQuery, setSingleSearchQuery] = useState("");
  const [isSingleDropdownOpen, setIsSingleDropdownOpen] = useState(false);
  const [multipleSearchQuery, setMultipleSearchQuery] = useState("");
  const singleDropdownRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        singleDropdownRef.current &&
        !singleDropdownRef.current.contains(event.target)
      ) {
        setIsSingleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCheckboxChange = (employeeId, checked) => {
    setFormData((prev) => {
      let updatedIds = [...prev.employee_ids];
      if (checked) {
        if (!updatedIds.includes(employeeId)) {
          updatedIds.push(employeeId);
        }
      } else {
        updatedIds = updatedIds.filter((id) => id !== employeeId);
      }
      return {
        ...prev,
        employee_ids: updatedIds,
      };
    });
  };

  const filteredEmployeesSingle = (employees || []).filter(
    (emp) =>
      (emp.name || "")
        .toLowerCase()
        .includes(singleSearchQuery.toLowerCase()) ||
      (emp.department || "")
        .toLowerCase()
        .includes(singleSearchQuery.toLowerCase()),
  );

  const filteredEmployeesMultiple = (employees || []).filter(
    (emp) =>
      (emp.name || "")
        .toLowerCase()
        .includes(multipleSearchQuery.toLowerCase()) ||
      (emp.department || "")
        .toLowerCase()
        .includes(multipleSearchQuery.toLowerCase()),
  );

  const handleSelectAllFiltered = () => {
    setFormData((prev) => {
      const currentFilteredIds = filteredEmployeesMultiple.map((emp) => emp.id);
      const newIds = Array.from(
        new Set([...prev.employee_ids, ...currentFilteredIds]),
      );
      return {
        ...prev,
        employee_ids: newIds,
      };
    });
  };

  const handleClearAllFiltered = () => {
    setFormData((prev) => {
      const currentFilteredIds = filteredEmployeesMultiple.map((emp) => emp.id);
      const newIds = prev.employee_ids.filter(
        (id) => !currentFilteredIds.includes(id),
      );
      return {
        ...prev,
        employee_ids: newIds,
      };
    });
  };

  const selectedEmployee = (employees || []).find(
    (emp) => String(emp.id) === String(formData.employee_id),
  );

  // If in edit mode, fetch existing reminder details
  useEffect(() => {
    if (isEdit) {
      const fetchReminder = async () => {
        try {
          const apiUrl =
            "https://sf.doaguru.com";
          const res = await axios.get(
            `${apiUrl}/api/scheduler/reminders/${id}`,
          );
          const data = res.data;

          // Format date and boolean flags
          const formattedDate = data.reminder_date
            ? data.reminder_date.split("T")[0]
            : "";

          setFormData({
            assignment_type: data.assignment_type || "self",
            employee_id: data.employee_id || "",
            employee_ids: data.assigned_employees
              ? data.assigned_employees.map((e) => e.id)
              : [],
            title: data.title || "",
            note: data.note || "",
            reminder_date: formattedDate,
            reminder_time: data.reminder_time || "",
            remind_before: data.remind_before || "10_minutes",
            custom_remind_minutes: data.custom_remind_minutes || "",
            repeat_type: data.repeat_type || "none",
            delivery_method: data.delivery_method || "inapp_only",
            message_template: data.message_template || "",
            dnd_enabled: !!data.dnd_enabled,
            dnd_start_time: data.dnd_start_time || "22:00:00",
            dnd_end_time: data.dnd_end_time || "08:00:00",
            status: data.status || "pending",
          });
        } catch (err) {
          console.error(err);
          setErrorMessage("Failed to load reminder details");
        }
      };
      fetchReminder();
    } else {
      // Set default date to today
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, reminder_date: today }));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMultipleEmployeeChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value));
      }
    }
    setFormData((prev) => ({
      ...prev,
      employee_ids: selectedValues,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    // Validation
    if (!formData.title.trim()) {
      setErrorMessage("Title is required");
      setSubmitting(false);
      return;
    }
    if (!formData.reminder_date || !formData.reminder_time) {
      setErrorMessage("Reminder date and time are required");
      setSubmitting(false);
      return;
    }

    if (formData.assignment_type === "single" && !formData.employee_id) {
      setErrorMessage("Please assign an employee");
      setSubmitting(false);
      return;
    }

    if (
      formData.assignment_type === "multiple" &&
      formData.employee_ids.length === 0
    ) {
      setErrorMessage("Please assign at least one employee");
      setSubmitting(false);
      return;
    }

    try {
      if (isEdit) {
        await updateReminder(id, formData);
      } else {
        await createReminder(formData);
      }
      navigate("/task/scheduler/");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || "An error occurred while saving the reminder",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{ padding: "12px 0", maxWidth: "1200px", margin: "0 auto" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
            }}
          >
            {isEdit ? "Configure Scheduler Rule" : "New Scheduler Rule"}
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.95rem",
              marginTop: "2px",
            }}
          >
            {isEdit
              ? "Edit scheduled delivery parameters, targets, and content triggers."
              : "Define target audiences, schedule models, and messaging parameters."}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.16)",
            borderRadius: "12px",
            padding: "16px 20px",
            color: "var(--danger)",
            marginBottom: "28px",
            fontSize: "0.925rem",
            fontWeight: 500,
          }}
        >
          <strong>Error details:</strong> {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        {/* SECTION 1: AUDIENCE & TEAM ASSIGNMENT (Horizontal Row Layout) */}
        <div
          className="glass-card"
          style={{
            padding: "28px",
            position: "relative",
            zIndex: isSingleDropdownOpen ? 10 : 1,
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--primary)",
              borderBottom: "1px solid var(--border-glass)",
              paddingBottom: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            1. Assignment & Distribution Scope
          </h3>

          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div
              className="form-group"
              style={{ flex: "1 1 280px", margin: 0 }}
            >
              <label className="form-label">Assignment Type</label>
              <select
                name="assignment_type"
                value={formData.assignment_type}
                onChange={handleChange}
                className="form-select"
                style={{ height: "46px" }}
              >
                <option value="self">Self Reminder (Creator)</option>
                <option value="single">Single Team Member</option>
                <option value="multiple">Multiple Team Members</option>
                <option value="team">Whole Team (Broadcast)</option>
              </select>
            </div>

            {/* Conditional input columns next to Assignment dropdown */}
            {formData.assignment_type === "single" && (
              <div
                className="form-group fade-in"
                style={{ flex: "2 1 400px", margin: 0, position: "relative" }}
                ref={singleDropdownRef}
              >
                <label className="form-label">Select Recipient</label>

                {/* Custom Searchable Dropdown */}
                <div style={{ position: "relative" }}>
                  <div
                    onClick={() =>
                      setIsSingleDropdownOpen(!isSingleDropdownOpen)
                    }
                    style={{
                      height: "46px",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "8px",
                      padding: "0 16px",
                      display: "flex",
                      alignItems: "center",
                      background: "var(--bg-glass)",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      color: selectedEmployee
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    }}
                  >
                    <span style={{ flexGrow: 1, textAlign: "left" }}>
                      {selectedEmployee
                        ? `${selectedEmployee.name} — ${selectedEmployee.department || "Staff"}`
                        : "-- Choose Team Member --"}
                    </span>
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: isSingleDropdownOpen
                          ? "rotate(180deg)"
                          : "none",
                        transition: "transform 0.2s",
                        marginLeft: "8px",
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {isSingleDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "52px",
                        left: 0,
                        right: 0,
                        background: "#ffffff",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "12px",
                        boxShadow:
                          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        zIndex: 100,
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search employee by name or department..."
                        value={singleSearchQuery}
                        onChange={(e) => setSingleSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when clicking inside input
                        style={{
                          height: "38px",
                          width: "100%",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "0 12px",
                          fontSize: "0.9rem",
                          outline: "none",
                          color: "#1e293b",
                        }}
                      />
                      <div
                        style={{
                          maxHeight: "200px",
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        {filteredEmployeesSingle.length > 0 ? (
                          filteredEmployeesSingle.map((emp) => (
                            <div
                              key={emp.id}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  employee_id: emp.id,
                                }));
                                setIsSingleDropdownOpen(false);
                                setSingleSearchQuery("");
                              }}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                color: "#334155",
                                background:
                                  String(formData.employee_id) ===
                                  String(emp.id)
                                    ? "#f1f5f9"
                                    : "transparent",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f8fafc")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  String(formData.employee_id) ===
                                  String(emp.id)
                                    ? "#f1f5f9"
                                    : "transparent")
                              }
                            >
                              <span>{emp.name}</span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  fontWeight: 600,
                                }}
                              >
                                {emp.department || "Staff"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontSize: "0.875rem",
                              color: "#94a3b8",
                            }}
                          >
                            No employees found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.assignment_type === "multiple" && (
              <div
                className="form-group fade-in"
                style={{ flex: "2 1 400px", margin: 0 }}
              >
                <label
                  className="form-label"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Select Recipients</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Selected: {formData.employee_ids.length}
                  </span>
                </label>

                {/* Search & Actions Header */}
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                >
                  <input
                    type="text"
                    placeholder="Search by name or department..."
                    value={multipleSearchQuery}
                    onChange={(e) => setMultipleSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      height: "38px",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "8px",
                      padding: "0 12px",
                      fontSize: "0.9rem",
                      background: "var(--bg-glass)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="btn btn-secondary"
                    style={{
                      padding: "0 12px",
                      height: "38px",
                      fontSize: "0.8rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllFiltered}
                    className="btn btn-secondary"
                    style={{
                      padding: "0 12px",
                      height: "38px",
                      fontSize: "0.8rem",
                      borderRadius: "8px",
                      color: "var(--danger)",
                      cursor: "pointer",
                    }}
                  >
                    Clear All
                  </button>
                </div>

                {/* Checkbox List Container */}
                <div
                  style={{
                    border: "1px solid var(--border-glass)",
                    borderRadius: "10px",
                    background: "var(--bg-glass)",
                    maxHeight: "180px",
                    overflowY: "auto",
                    padding: "8px",
                  }}
                >
                  {filteredEmployeesMultiple.length > 0 ? (
                    filteredEmployeesMultiple.map((emp) => {
                      const isChecked = formData.employee_ids.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            color: "var(--text-primary)",
                            background: isChecked
                              ? "rgba(79, 70, 229, 0.05)"
                              : "transparent",
                            margin: "2px 0",
                            userSelect: "none",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = isChecked
                              ? "rgba(79, 70, 229, 0.08)"
                              : "rgba(0, 0, 0, 0.02)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = isChecked
                              ? "rgba(79, 70, 229, 0.05)"
                              : "transparent")
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              handleCheckboxChange(emp.id, e.target.checked)
                            }
                            style={{
                              width: "16px",
                              height: "16px",
                              accentColor: "var(--primary)",
                              cursor: "pointer",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              width: "100%",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ textAlign: "left" }}>
                              {emp.name}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                fontWeight: 600,
                              }}
                            >
                              {emp.department || "Staff"}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      No employees match your search.
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.assignment_type === "team" && (
              <div
                style={{
                  flex: "2 1 400px",
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                  borderRadius: "10px",
                  padding: "14px 20px",
                  color: "var(--secondary)",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  margin: 0,
                }}
                className="fade-in"
              >
                <span>
                  📢 Broadcast rule: Trigger will automatically map and deliver
                  to <strong>all active employees</strong> (
                  {(employees || []).length} users).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: TRIGGER METRICS & TIMING (Horizontal Grid Row) */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--primary)",
              borderBottom: "1px solid var(--border-glass)",
              paddingBottom: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            2. Trigger Schedule Rules
          </h3>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {/* Title */}
            <div
              className="form-group"
              style={{ flex: "2 1 340px", margin: 0 }}
            >
              <label className="form-label">Reminder Goal Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Monthly Budget Verification Audit"
                className="form-input"
                style={{ height: "46px" }}
                required
              />
            </div>

            {/* Date */}
            <div
              className="form-group"
              style={{ flex: "1 1 150px", margin: 0 }}
            >
              <label className="form-label">Scheduled Date</label>
              <input
                type="date"
                name="reminder_date"
                value={formData.reminder_date}
                onChange={handleChange}
                className="form-input"
                style={{ height: "46px" }}
                required
              />
            </div>

            {/* Time */}
            <div
              className="form-group"
              style={{ flex: "1 1 130px", margin: 0 }}
            >
              <label className="form-label">Scheduled Time</label>
              <input
                type="time"
                name="reminder_time"
                value={formData.reminder_time}
                onChange={handleChange}
                className="form-input"
                style={{ height: "46px" }}
                step="60"
                required
              />
            </div>

            {/* Before Trigger */}
            <div
              className="form-group"
              style={{ flex: "1 1 180px", margin: 0 }}
            >
              <label className="form-label">Trigger Alert Before</label>
              <select
                name="remind_before"
                value={formData.remind_before}
                onChange={handleChange}
                className="form-select"
                style={{ height: "46px" }}
              >
                <option value="0_minutes">Exact Target Time</option>
                <option value="2_minutes">2 Minutes Before</option>
                <option value="10_minutes">10 Minutes Before</option>
                <option value="30_minutes">30 Minutes Before</option>
                <option value="1_hour">1 Hour Before</option>
                <option value="2_hours">2 Hours Before</option>
                <option value="custom">Custom Minutes</option>
              </select>
            </div>

            {/* Recurrence Repeat */}
            <div
              className="form-group"
              style={{ flex: "1 1 180px", margin: 0 }}
            >
              <label className="form-label">Recurrence Pattern</label>
              <select
                name="repeat_type"
                value={formData.repeat_type}
                onChange={handleChange}
                className="form-select"
                style={{ height: "46px" }}
              >
                <option value="none">One-time Trigger</option>
                <option value="hourly">Hourly Interval</option>
                <option value="daily">Daily Interval</option>
                <option value="alternate_days">Alternate Days</option>
                <option value="weekly">Weekly Sync</option>
                <option value="monthly">Monthly Routine</option>
                <option value="never_ends">Infinite (Daily Loop)</option>
              </select>
            </div>
          </div>

          {/* Conditional custom remind minutes display */}
          {formData.remind_before === "custom" && (
            <div
              className="form-group fade-in"
              style={{ marginTop: "20px", marginBottom: 0, maxWidth: "240px" }}
            >
              <label className="form-label">Custom offset (Minutes)</label>
              <input
                type="number"
                name="custom_remind_minutes"
                value={formData.custom_remind_minutes}
                onChange={handleChange}
                placeholder="Minutes count"
                className="form-input"
                style={{ height: "46px" }}
                min="1"
              />
            </div>
          )}
        </div>

        {/* SECTION 3: DELIVERY RULES & DND (Horizontal Configuration Layout) */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--primary)",
              borderBottom: "1px solid var(--border-glass)",
              paddingBottom: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            3. Delivery Configurations & Silent Window
          </h3>

          <div
            style={{
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            {/* Delivery Method */}
            <div
              className="form-group"
              style={{ flex: "1 1 280px", margin: 0 }}
            >
              <label className="form-label">Dispatch Channels</label>
              <select
                name="delivery_method"
                value={formData.delivery_method}
                onChange={handleChange}
                className="form-select"
                style={{ height: "46px" }}
              >
                <option value="whatsapp_email">
                  WhatsApp & Email Dual Dispatch
                </option>
                <option value="inapp_only">In-App Notification Feed</option>
                <option value="whatsapp_only">WhatsApp Integration Only</option>
                <option value="email_only">SMTP Email Routing Only</option>

                <option value="inapp_whatsapp">In-App & WhatsApp</option>
                <option value="inapp_email">In-App & Email</option>
                <option value="all_channels">
                  Omnichannel (WhatsApp, Email & In-App)
                </option>
              </select>
            </div>

            {/* DND Toggle Container */}
            <div
              style={{
                flex: "2 1 400px",
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                alignItems: "center",
                background: "#f8fafc",
                padding: "16px 20px",
                borderRadius: "12px",
                border: "1px solid var(--border-glass)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <input
                  type="checkbox"
                  name="dnd_enabled"
                  id="dnd_enabled"
                  checked={formData.dnd_enabled}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <label
                  htmlFor="dnd_enabled"
                  style={{
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                  }}
                >
                  Silence during DND Hours
                </label>
              </div>

              {formData.dnd_enabled && (
                <div
                  className="fade-in"
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                      }}
                    >
                      From
                    </span>
                    <input
                      type="time"
                      name="dnd_start_time"
                      value={formData.dnd_start_time}
                      onChange={handleChange}
                      className="form-input"
                      style={{
                        padding: "6px 12px",
                        width: "110px",
                        height: "36px",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                      }}
                    >
                      To
                    </span>
                    <input
                      type="time"
                      name="dnd_end_time"
                      value={formData.dnd_end_time}
                      onChange={handleChange}
                      className="form-input"
                      style={{
                        padding: "6px 12px",
                        width: "110px",
                        height: "36px",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Edit Mode Status Selector */}
            {isEdit && (
              <div
                className="form-group"
                style={{ flex: "1 1 180px", margin: 0 }}
              >
                <label className="form-label">Rule Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                  style={{ height: "46px" }}
                >
                  <option value="pending">Active / Pending</option>
                  <option value="completed">Completed Run</option>
                  <option value="cancelled">Disabled / Cancelled</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: NOTE & TEMPLATE (Full horizontal side-by-side or wrapped) */}
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {/* Note Input */}
          <div
            className="glass-card"
            style={{ padding: "28px", flex: "1 1 450px" }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--primary)",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Description & Task Details
            </h3>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Internal Operations Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Specify workflow coordinates, file references, or call credentials..."
                className="form-textarea"
                rows="4"
              />
            </div>
          </div>

          {/* Template editor */}
          <div
            className="glass-card"
            style={{ padding: "28px", flex: "1 1 450px" }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--primary)",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Payload Customizer Template
            </h3>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Message Payload Content</label>
              <textarea
                name="message_template"
                value={formData.message_template}
                onChange={handleChange}
                placeholder="Build dynamic trigger notification text template..."
                className="form-textarea"
                rows="2"
              />
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  background: "rgba(79, 70, 229, 0.03)",
                  borderRadius: "8px",
                  border: "1px dashed rgba(79, 70, 229, 0.15)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.725rem",
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Available Tags:
                </span>
                {[
                  "{{employee_name}}",
                  "{{title}}",
                  "{{note}}",
                  "{{date}}",
                  "{{time}}",
                ].map((tag) => (
                  <code
                    key={tag}
                    style={{
                      fontSize: "0.725rem",
                      background: "#ffffff",
                      color: "var(--primary)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-glass)",
                      fontWeight: 700,
                    }}
                  >
                    {tag}
                  </code>
                ))}
              </div>
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  lineHeight: "1.4",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                  background: "rgba(79, 70, 229, 0.02)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(79, 70, 229, 0.08)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{
                    color: "var(--primary)",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  For WhatsApp (<strong>sf_work_reminder</strong>), this payload
                  acts as the custom message/details field (
                  <strong>{"{{5}}"}</strong>). If left as default, your
                  Description/Task Details will be used instead.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION SUBMIT BUTTONS */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "flex-end",
            marginTop: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/task/scheduler/")}
            className="btn btn-secondary"
            disabled={submitting}
            style={{ padding: "12px 24px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: "180px", padding: "12px 24px" }}
          >
            {submitting ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg
                  className="animate-spin"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : isEdit ? (
              "Save Rule"
            ) : (
              "Commit Schedule Rule"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
