import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCalendarCheck, FaClock, FaUser, FaInfoCircle, FaCheck, FaTimes,
  FaTrash, FaHistory, FaFilter, FaSearch, FaExclamationCircle,
  FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import moment from "moment";
import toast from "react-hot-toast";

const getApiBaseUrl = () => ("https://sf.doaguru.com") + "/api";

const BackdateAttendRequest = () => {
  const API_BASE_URL = getApiBaseUrl();
  const [requestData, setRequestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const user = JSON.parse(localStorage.getItem("user"));

  const getAllBackDateReq = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/getAllBackDateRequest`);
      setRequestData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const deleteBackDateRequest = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this request?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/deleteBackDateRequest/${id}`);
      toast.success("Request purged successfully");
      getAllBackDateReq();
    } catch (error) {
      toast.error(error.response?.data?.message || "Deletion failed");
    }
  };

  const updateBackDateRequest = async (id, status) => {
    const actionText = status === "approved" ? "approve" : "reject";
    if (!window.confirm(`Do you want to ${actionText} this request?`)) return;

    try {
      await axios.put(`${API_BASE_URL}/updateBackDateRequestStatus/${id}`, {
        status,
        reviewBy: user?.id
      });
      toast.success(`Request ${status} successfully`);
      getAllBackDateReq();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  useEffect(() => {
    getAllBackDateReq();
  }, []);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    let data = [...requestData];

    // 1. Newest First Sorting (based on requested_at)
    data.sort((a, b) => {
      const dateA = moment(a.requested_at, "DD-MM-YYYY HH:mm:ss");
      const dateB = moment(b.requested_at, "DD-MM-YYYY HH:mm:ss");
      return dateB.diff(dateA);
    });

    // 2. Apply Filters
    return data.filter(item => {
      const matchesSearch = item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee_id?.toString().includes(searchTerm);
      const matchesStatus = filterStatus === "all" || item.abr_status === filterStatus;

      const reqDate = moment(item.request_date, ["DD-MM-YYYY", "YYYY-MM-DD"]);
      const matchesMonth = selectedMonth === "all" || (reqDate.month() + 1) === parseInt(selectedMonth);
      const matchesYear = selectedYear === "all" || reqDate.year() === parseInt(selectedYear);

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });
  }, [requestData, searchTerm, filterStatus, selectedMonth, selectedYear]);

  // Pagination Logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Stats calculation
  const stats = useMemo(() => ({
    pending: requestData.filter(r => r.abr_status === "pending").length,
    approved: requestData.filter(r => r.abr_status === "approved").length,
    rejected: requestData.filter(r => r.abr_status === "rejected").length,
    total: requestData.length
  }), [requestData]);

  const months = [
    { v: "all", l: "All Months" }, { v: 1, l: "January" }, { v: 2, l: "February" }, { v: 3, l: "March" },
    { v: 4, l: "April" }, { v: 5, l: "May" }, { v: 6, l: "June" }, { v: 7, l: "July" },
    { v: 8, l: "August" }, { v: 9, l: "September" }, { v: 10, l: "October" }, { v: 11, l: "November" }, { v: 12, l: "December" }
  ];

  const years = ["all", 2024, 2025, 2026];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ═══ Header Section ═══ */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 flex-shrink-0">
              <FaCalendarCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Attendance Requests</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Backdate Reconciliation Management</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none w-full sm:w-56 shadow-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Status Filter */}
            <select
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm outline-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Month Filter */}
            <select
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm outline-none cursor-pointer"
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
            >
              {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>

            {/* Year Filter */}
            <select
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm outline-none cursor-pointer"
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
            >
              {years.map(y => <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>)}
            </select>
          </div>
        </div>

        {/* ═══ Stats Cards ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50", icon: <FaExclamationCircle /> },
            { label: "Approved", value: stats.approved, color: "text-emerald-600", bg: "bg-emerald-50", icon: <FaCheck /> },
            { label: "Rejected", value: stats.rejected, color: "text-rose-600", bg: "bg-rose-50", icon: <FaTimes /> },
            { label: "Total Load", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50", icon: <FaHistory /> },
          ].map((s, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center text-lg shadow-inner`}>
                {s.icon}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══ Main Table Section ═══ */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-2.5">Employee Identity</th>
                  <th className="px-6 py-2.5">Requested Date</th>
                  <th className="px-6 py-2.5">Rationale / Reason</th>
                  <th className="px-6 py-2.5">Submission Meta</th>
                  <th className="px-6 py-2.5">Status Outcome</th>
                  <th className="px-6 py-2.5 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11px]">
                <AnimatePresence mode="popLayout">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((row) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={row.request_id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black ring-2 ring-white shadow-sm">
                              {row.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 leading-none">{row.full_name}</p>
                              <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-tighter">ID: #{row.employee_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2.5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-indigo-600 font-black">
                              <FaClock size={12} className="text-indigo-300" />
                              {row.request_date}
                            </div>
                            {row.request_type === 'edit' ? (
                              <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter w-max">Time Edit</span>
                            ) : (
                              <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter w-max">Backdate</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-2.5 max-w-[250px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-start gap-2">
                              <FaInfoCircle className="text-slate-200 mt-0.5 flex-shrink-0" size={12} />
                              <p className="text-slate-500 font-medium leading-relaxed italic line-clamp-2" title={row.abr_reason}>
                                {row.abr_reason || "None provided"}
                              </p>
                            </div>
                            {row.request_type === 'edit' && row.requested_login_time && (
                              <div className="text-[9px] font-bold text-amber-700 bg-amber-50/50 border border-amber-100 rounded-md p-1.5 flex flex-col gap-0.5 w-max">
                                <span>Requested Times:</span>
                                <span className="font-extrabold text-[10px] text-slate-700">Login: {row.requested_login_time.slice(0, 5)} | Logout: {row.requested_logout_time.slice(0, 5)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-2.5">
                          <p className="text-slate-400 font-bold uppercase leading-none tracking-tighter">{moment(row.requested_at, "DD-MM-YYYY HH:mm:ss").format("MMM Do, YYYY")}</p>
                          <p className="text-[9px] text-slate-300 mt-1 font-medium">{moment(row.requested_at, "DD-MM-YYYY HH:mm:ss").format("hh:mm A")}</p>
                        </td>
                        <td className="px-6 py-2.5">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max border shadow-sm ${row.abr_status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            row.abr_status === "rejected" ? "bg-rose-50 text-rose-600 border-rose-100" :
                              "bg-amber-50 text-amber-600 border-amber-100"
                            }`}>
                            <div className={`w-1 h-1 rounded-full ${row.abr_status === "approved" ? "bg-emerald-600" :
                              row.abr_status === "rejected" ? "bg-rose-600" : "bg-amber-600"
                              }`} />
                            {row.abr_status}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          <div className="flex justify-end gap-2">
                            {row.abr_status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateBackDateRequest(row.request_id, "approved")}
                                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                  title="Approve Request"
                                >
                                  <FaCheck size={12} />
                                </button>
                                <button
                                  onClick={() => updateBackDateRequest(row.request_id, "rejected")}
                                  className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                  title="Reject Request"
                                >
                                  <FaTimes size={12} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteBackDateRequest(row.request_id)}
                              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Delete Record"
                              disabled={row.abr_status === "approved"}
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td colSpan="6" className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center">
                            <FaCalendarCheck size={32} />
                          </div>
                          <p className="text-sm text-slate-300 font-bold italic">No attendance reconciliation requests detected for this filter.</p>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* ═══ Pagination Controls ═══ */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-slate-50 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400">
                Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="text-slate-800">{filteredData.length}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                >
                  <FaChevronLeft size={12} />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackdateAttendRequest;
