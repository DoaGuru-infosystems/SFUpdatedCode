import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCalendarAlt, FaPlus, FaDownload, FaTrash, FaCheck, FaTimes,
  FaFilter, FaSearch, FaHistory, FaUmbrellaBeach, FaExclamationCircle
} from "react-icons/fa";
import * as XLSX from "xlsx";
import moment from "moment";
import toast from "react-hot-toast";
import AddHolidayModal from "./AddHolidayModal";

const statusColors = {
  active: "bg-emerald-50 text-emerald-600 border-emerald-100",
  inactive: "bg-rose-50 text-rose-600 border-rose-100",
  pending: "bg-amber-50 text-amber-600 border-amber-100",
};

const HolidayManage = () => {
  const [holidayData, setHolidayData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHolidayData();
  }, [selectedYear]);

  const fetchHolidayData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `https://sf.doaguru.com/api/getAllHolidaysCurrentYear?year=${selectedYear}`
      );
      setHolidayData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch holiday data", error);
      toast.error("Error loading holiday list");
    } finally {
      setLoading(false);
    }
  };

  const updateHolidayStatus = async (id, status) => {
    if (!window.confirm(`Do you want to update status to ${status.toUpperCase()}?`)) return;
    try {
      await axios.put(`https://sf.doaguru.com/api/updateHolidayStatus/${id}`, { status });
      toast.success(`Holiday is now ${status}`);
      fetchHolidayData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const deleteHolidays = async (id) => {
    if (!window.confirm(`Confirm permanent deletion of this holiday?`)) return;
    try {
      await axios.delete(`https://sf.doaguru.com/api/deleteHoliday/${id}`);
      toast.success(`Holiday removed successfully`);
      fetchHolidayData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Deletion failed");
    }
  };

  const filteredHolidays = useMemo(() => {
    return holidayData.filter(h => {
      const date = moment(h.holiday_date, ["DD-MM-YYYY", "YYYY-MM-DD"]);
      const matchesMonth = selectedMonth === "all" || (date.month() + 1) === parseInt(selectedMonth);
      const matchesSearch = h.holiday_title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesMonth && matchesSearch;
    }).sort((a, b) => moment(a.holiday_date, ["DD-MM-YYYY", "YYYY-MM-DD"]).diff(moment(b.holiday_date, ["DD-MM-YYYY", "YYYY-MM-DD"])));
  }, [holidayData, selectedMonth, searchTerm]);

  const stats = useMemo(() => ({
    total: holidayData.length,
    active: holidayData.filter(h => h.holiday_status === "active").length,
    inactive: holidayData.filter(h => h.holiday_status === "inactive").length
  }), [holidayData]);

  const downloadExcel = () => {
    if (filteredHolidays.length === 0) {
      toast.error("No data available for export");
      return;
    }

    const worksheetData = filteredHolidays.map((item, index) => ({
      "S. No": index + 1,
      "Holiday Date": item.holiday_date,
      "Holiday Title": item.holiday_title,
      "Status": item.holiday_status?.toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Holidays");
    XLSX.writeFile(workbook, `Holiday_List_${selectedYear}${selectedMonth !== 'all' ? '_Month' + selectedMonth : ''}.xlsx`);
  };

  const months = [
    { v: "all", l: "All Months" }, { v: 1, l: "January" }, { v: 2, l: "February" }, { v: 3, l: "March" },
    { v: 4, l: "April" }, { v: 5, l: "May" }, { v: 6, l: "June" }, { v: 7, l: "July" },
    { v: 8, l: "August" }, { v: 9, l: "September" }, { v: 10, l: "October" }, { v: 11, l: "November" }, { v: 12, l: "December" }
  ];

  const years = [2024, 2025, 2026];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ═══ Header Section ═══ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 flex-shrink-0">
              <FaUmbrellaBeach size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Holiday Management</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Public Holidays & Observances • {selectedYear}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 text-xs"
              onClick={() => setOpenModal(true)}
            >
              <FaPlus /> ADD HOLIDAY
            </button>
            <button
              onClick={downloadExcel}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2 text-xs"
            >
              <FaDownload /> EXPORT
            </button>
          </div>
        </div>

        {/* ═══ Controls & Distribution ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Filters Sidebar/Section */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calendar Year</label>
                <div className="grid grid-cols-3 gap-2">
                  {years.map(y => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${selectedYear === y ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Month</label>
                <select
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quick Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                  <input
                    type="text"
                    placeholder="Diwali, Eid..."
                    className="w-full bg-slate-50 border-0 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-3xl text-white shadow-xl shadow-indigo-100">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Year Distribution</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Approved</span>
                  <span className="text-xl font-black">{stats.active}</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(stats.active / stats.total) * 100}%` }}></div>
                </div>
                <p className="text-[10px] font-medium opacity-60 italic leading-tight">Total {stats.total} holidays registered in {selectedYear} database.</p>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="lg:col-span-9 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <FaHistory className="text-indigo-600" size={14} /> Chronological Holiday Ledger
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-2.5">#</th>
                    <th className="px-6 py-2.5">Occasion Date</th>
                    <th className="px-6 py-2.5">Holiday Title</th>
                    <th className="px-6 py-2.5">Current Status</th>
                    <th className="px-6 py-2.5 text-right">Operational Logic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-bold italic animate-pulse">Syncing with remote database...</td></tr>
                    ) : filteredHolidays.length === 0 ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan="5" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-300">
                            <FaExclamationCircle size={30} />
                            <p className="font-bold italic text-sm">No holidays detected for this timeframe.</p>
                          </div>
                        </td>
                      </motion.tr>
                    ) : (
                      filteredHolidays.map((holiday, index) => (
                        <motion.tr
                          key={holiday.hid}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-2.5 text-[10px] font-black text-slate-300">{(index + 1).toString().padStart(2, '0')}</td>
                          <td className="px-6 py-2.5">
                            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs">
                              <FaCalendarAlt className="text-indigo-200" size={12} />
                              {moment(holiday.holiday_date, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("DD MMM, YYYY")}
                            </div>
                          </td>
                          <td className="px-6 py-2.5">
                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{holiday.holiday_title}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{moment(holiday.holiday_date, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("dddd")}</p>
                          </td>
                          <td className="px-6 py-2.5">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max border shadow-sm ${statusColors[holiday.holiday_status] || statusColors.pending}`}>
                              <div className={`w-1 h-1 rounded-full ${holiday.holiday_status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                              {holiday.holiday_status}
                            </span>
                          </td>
                          <td className="px-6 py-2.5 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                disabled={holiday.holiday_status === "active"}
                                onClick={() => updateHolidayStatus(holiday.hid, "active")}
                                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-30 disabled:grayscale"
                              >
                                <FaCheck size={12} />
                              </button>
                              <button
                                disabled={holiday.holiday_status === "inactive"}
                                onClick={() => updateHolidayStatus(holiday.hid, "inactive")}
                                className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-30 disabled:grayscale"
                              >
                                <FaTimes size={12} />
                              </button>
                              <button
                                onClick={() => deleteHolidays(holiday.hid)}
                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AddHolidayModal
        isOpen={openModal}
        onClose={() => { setOpenModal(false); fetchHolidayData(); }}
        fetchLeaveData={fetchHolidayData}
      />
    </div>
  );
};

export default HolidayManage;
