import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2,
  UserCheck,
  UserX,
  Clock,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

const getApiBase = () => {
  return window.API_BASE || process.env.REACT_APP_API_URL || "https://sf.doaguru.com";
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${getApiBase()}/api/admin/departments`, {
        headers: getAuthHeaders(),
      });
      if (response.data && response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      const msg = error.response?.data?.message || "Failed to load departments";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleToggleDeadlineTracking = async (dept) => {
    if (togglingId) return; // Prevent concurrent toggles
    const newStatus = !dept.strict_deadline_tracking;
    setTogglingId(dept.id);

    // Optimistic UI update
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === dept.id ? { ...d, strict_deadline_tracking: newStatus } : d
      )
    );

    try {
      const response = await axios.patch(
        `${getApiBase()}/api/admin/department/${dept.id}/deadline-tracking`,
        { strict_deadline_tracking: newStatus },
        { headers: getAuthHeaders() }
      );

      if (response.data && response.data.success) {
        toast.success(
          `Deadline tracking for "${dept.name}" set to ${
            newStatus ? "Strict (ON)" : "Flexible (OFF)"
          }`
        );
      }
    } catch (error) {
      console.error("Error toggling deadline tracking:", error);
      // Revert optimistic update on failure
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === dept.id ? { ...d, strict_deadline_tracking: !newStatus } : d
        )
      );
      const msg =
        error.response?.data?.message || "Failed to update deadline tracking";
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const term = searchTerm.toLowerCase();
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        (d.tl_name && d.tl_name.toLowerCase().includes(term))
    );
  }, [departments, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Top Header ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                  Departments
                  <span className="text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    {departments.length} Configured
                  </span>
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  Manage department structure, designated Team Leads, and strict deadline enforcement.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={fetchDepartments}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
              title="Refresh list"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Information Card ──────────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl p-4 border border-blue-100/80 flex items-start gap-3.5">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900/80 space-y-1">
            <p className="font-semibold">
              About Strict Deadline Tracking
            </p>
            <p>
              When <span className="font-bold text-blue-950">Strict Deadline Tracking</span> is <strong>ON</strong>, tasks under this department trigger automatic daily escalation digests and D-4 deadline reminders. If turned <strong>OFF</strong>, daily work logging remains available without strict automated escalation alerts.
            </p>
          </div>
        </div>

        {/* ── Filter / Search Bar ────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <Search size={18} className="text-slate-400 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search departments or Team Leads..."
            className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Table Card ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Department Name</th>
                  <th className="py-4 px-6">Current Team Lead</th>
                  <th className="py-4 px-6 text-center">Strict Deadline Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading && departments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-indigo-500" />
                        <p>Loading departments...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400 font-medium">
                      No departments found matching "{searchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => {
                    const isStrict = dept.strict_deadline_tracking;
                    const isToggling = togglingId === dept.id;

                    return (
                      <tr
                        key={dept.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Department Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                              {dept.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">
                                {dept.name}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400">
                                ID #{dept.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Current TL */}
                        <td className="py-4 px-6">
                          {dept.tl_name ? (
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                <UserCheck size={16} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">
                                  {dept.tl_name}
                                </p>
                                {dept.tl_email && (
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    {dept.tl_email}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <UserX size={13} />
                              <span>TL Unassigned</span>
                            </div>
                          )}
                        </td>

                        {/* Strict Deadline Tracking Toggle */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleDeadlineTracking(dept)}
                              disabled={isToggling}
                              role="switch"
                              aria-checked={isStrict}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                                isStrict ? "bg-emerald-600" : "bg-slate-300"
                              } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isStrict ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-bold w-20 text-left select-none ${
                                isStrict ? "text-emerald-700" : "text-slate-500"
                              }`}
                            >
                              {isStrict ? "Strict (ON)" : "Flexible (OFF)"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

