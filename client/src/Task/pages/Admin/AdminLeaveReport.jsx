import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaCheck,
  FaTimes,
  FaSearch,
  FaDownload,
  FaCalendarPlus,
  FaArrowLeft,
  FaArrowRight,
  FaFilter,
  FaUser,
  FaHistory,
  FaCalendarAlt
} from "react-icons/fa";
import * as XLSX from "xlsx";
import AdminLeaveReverseModal from "./AdminLeaveReverseModal";
import { useNavigate } from "react-router-dom";
import moment from "moment-timezone";

const AdminLeaveReport = () => {
  const navigate = useNavigate();
  const [leaveData, setLeaveData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(moment().format("YYYY"));
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        window.API_BASE + "/api/getAllLeaveDataForAdmin"
      );
      setLeaveData(data);
    } catch (error) {
      console.error("Failed to fetch leave data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeaveStatus = async (id, status) => {
    try {
      const confirm = window.confirm(`Update status to ${status.toUpperCase()}?`);
      if (confirm) {
        await axios.put(`${window.API_BASE}/api/approveRejectLeaves/${id}`, { status });
        fetchLeaveData();
        alert(`Leave Status Updated to ${status}`);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong.");
    }
  };

  const availableYears = useMemo(() => {
    if (!Array.isArray(leaveData)) return [moment().format("YYYY")];
    const years = leaveData.map(item => {
      const d = moment(item.leave_date, ["DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601]);
      return d.isValid() ? d.format("YYYY") : null;
    }).filter(Boolean);
    return ["All", ...new Set(years)].sort((a, b) => b - a);
  }, [leaveData]);

  const processedData = useMemo(() => {
    if (!Array.isArray(leaveData)) return [];
    let filtered = leaveData;
    if (selectedYear !== "All") {
      filtered = filtered.filter(item => {
        const d = moment(item.leave_date, ["DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601]);
        return d.isValid() && d.format("YYYY") === selectedYear;
      });
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.full_name?.toLowerCase().includes(s) ||
        item.id?.toString().includes(s)
      );
    }
    return [...filtered].sort((a, b) => {
      const dateA = moment(a.leave_date, ["DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601]);
      const dateB = moment(b.leave_date, ["DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601]);
      if (dateA.isAfter(dateB)) return -1;
      if (dateB.isAfter(dateA)) return 1;
      if (a.leave_status === "pending" && b.leave_status !== "pending") return -1;
      if (a.leave_status !== "pending" && b.leave_status === "pending") return 1;
      return 0;
    });
  }, [leaveData, searchTerm, selectedYear]);

  const stats = useMemo(() => {
    const dataForStats = selectedYear === "All" ? leaveData : leaveData.filter(l => {
      const d = moment(l.leave_date, ["DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601]);
      return d.isValid() && d.format("YYYY") === selectedYear;
    });
    return {
      total: dataForStats.length,
      pending: dataForStats.filter(l => l.leave_status === "pending").length,
      approved: dataForStats.filter(l => l.leave_status === "approved").length,
      rejected: dataForStats.filter(l => l.leave_status === "rejected").length
    };
  }, [leaveData, selectedYear]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const downloadExcel = () => {
    if (processedData.length === 0) return alert("No data to export");
    const worksheetData = processedData.map((item, index) => ({
      "S. No": index + 1,
      "User ID": item.id,
      "Name": item.full_name,
      "Leave Date": item.leave_date,
      "Duration": item.leave_duration,
      "Type": item.leave_type,
      "Reason": item.leave_reason,
      "Status": item.leave_status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Report");
    XLSX.writeFile(workbook, `Admin_Leave_Report_${moment().format("DDMMYYYY")}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-5">
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* ═══ Compact Header ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-between gap-4 lg:flex-row">
          <div className="flex items-center gap-3 text-center lg:text-left">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
              <FaHistory size={18} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">Leave Analytics</h1>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Personnel Request Control Dashboard</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-36">
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-xs" />
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-slate-700 appearance-none cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year === "All" ? "Every Year" : year}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-48">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Find member ID or name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-slate-700 shadow-sm"
              />
            </div>

            <button
              onClick={() => setOpenModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 text-xs"
            >
              <FaCalendarPlus size={14} /> New Request
            </button>
            <button
              onClick={downloadExcel}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 text-xs shadow-sm"
            >
              <FaDownload size={12} /> Export
            </button>
          </div>
        </div>

        {/* ═══ Compressed Stats ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Pending Requests", val: stats.pending, color: "text-amber-600", bg: "bg-amber-50", icon: <FaHistory /> },
            { label: "Approved Leaves", val: stats.approved, color: "text-emerald-600", bg: "bg-emerald-50", icon: <FaCheck /> },
            { label: "Rejected Requests", val: stats.rejected, color: "text-rose-600", bg: "bg-rose-50", icon: <FaTimes /> },
            { label: "Global Log", val: stats.total, color: "text-indigo-600", bg: "bg-indigo-50", icon: <FaFilter /> }
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
              <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center text-lg shadow-inner flex-shrink-0`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5 truncate">{s.label}</p>
                <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Personnel Matrix ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-100">#</th>
                  <th className="px-3 py-3 border-b border-slate-100">Requestor</th>
                  <th className="px-3 py-3 border-b border-slate-100 text-center">Applied Date</th>
                  <th className="px-3 py-3 border-b border-slate-100 italic">Timeline</th>
                  <th className="px-3 py-3 border-b border-slate-100">Member Reason</th>
                  <th className="px-3 py-3 border-b border-slate-100 text-center">Outcome</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-right">Control Suite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan="7" className="py-20 text-center text-slate-300 font-bold italic animate-pulse">Synthesizing log...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan="7" className="py-20 text-center text-slate-300 font-bold italic">No records initialized for {selectedYear}</td></tr>
                ) : (
                  paginatedData.map((leave, index) => {
                    const isToday = leave.leave_date === moment().format("DD-MM-YYYY");
                    return (
                      <tr key={index} className={`group transition-all duration-150 ${isToday ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'hover:bg-slate-50/70'}`}>
                        <td className="px-4 py-2.5 text-slate-400 font-black text-[10px]">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${isToday ? 'bg-indigo-100/50 text-indigo-600' : 'bg-slate-100 text-slate-500'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <FaUser size={12} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`font-black text-[13px] tracking-tight ${isToday ? 'text-indigo-900' : 'text-slate-800'}`}>{leave.full_name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none mt-0.5">ID: {leave.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-black text-[12px] tracking-tighter ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{leave.leave_date}</span>
                            {isToday && <span className="text-[8px] text-indigo-500 font-black uppercase tracking-widest leading-none mt-0.5">Today</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter leading-none">{leave.leave_type}</span>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 leading-none">{leave.leave_duration}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="max-w-[180px] truncate text-slate-400 font-medium italic text-[11px]" title={leave.leave_reason}>{leave.leave_reason}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-widest border shadow-sm ${leave.leave_status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            leave.leave_status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-100" :
                              "bg-amber-50 text-amber-700 border-amber-100"
                            }`}>
                            {leave.leave_status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {leave.leave_status === "pending" ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => updateLeaveStatus(leave.leave_id, "approved")}
                                className="w-8 h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm flex items-center justify-center active:scale-90"
                                title="Approve Request"
                              >
                                <FaCheck size={10} />
                              </button>
                              <button
                                onClick={() => updateLeaveStatus(leave.leave_id, "rejected")}
                                className="w-8 h-8 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm flex items-center justify-center active:scale-90"
                                title="Deny Request"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] uppercase tracking-widest font-black text-slate-300 italic px-2">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ═══ Compressed Pagination ═══ */}
          {totalPages > 1 && (
            <div className="bg-slate-50/50 px-5 py-3 flex items-center justify-between gap-4 border-t border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                {processedData.length} Requests Total
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => c - 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 flex items-center justify-center transition-all"
                >
                  <FaArrowLeft size={10} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg font-black text-[10px] transition-all ${currentPage === i + 1
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(c => c + 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 flex items-center justify-center transition-all"
                >
                  <FaArrowRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      <AdminLeaveReverseModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        fetchLeaveData={fetchLeaveData}
      />
    </div>
  );
};

export default AdminLeaveReport;
