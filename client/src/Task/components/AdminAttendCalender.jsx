import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { FaDownload, FaArrowLeft, FaArrowRight, FaFilter, FaUsers, FaCalendarAlt, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import moment from "moment-timezone";

/* ─── Refined Status Configuration ─── */
const dayStatusConfig = {
  full: { label: "Full Day", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  half: { label: "Half Day", dot: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50" },
  leave: { label: "Leave", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
  absent: { label: "Absent", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
  "logged-in": { label: "Logged In", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  sunday: { label: "Sunday", dot: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50" },
  holiday: { label: "Holiday", dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
};

const AdminAttendCalendar = () => {
  const [monthAttend, setMonthAttend] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getDaysInMonth = (m, y) => new Date(y, m, 0).getDate();
  const formatDate = (d) => d.toString().padStart(2, "0");

  const handleMonthChange = (offset) => {
    const newDate = new Date(year, month - 1 + offset);
    setMonth(newDate.getMonth() + 1);
    setYear(newDate.getFullYear());
  };

  const groupAttendance = (rawData) => {
    const grouped = new Map();
    rawData.forEach((record) => {
      const uid = record.id;
      if (!grouped.has(uid)) {
        grouped.set(uid, {
          user_id: uid,
          name: record.full_name,
          attendance: {},
        });
      }
      const user = grouped.get(uid);
      user.attendance[record.attend_date] = record.day_status;
    });
    return Array.from(grouped.values());
  };

  const getMonthlyAttendance = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`https://sf.doaguru.com/api/getMonthlyAttendance/${month}/${year}`);
      setMonthAttend(groupAttendance(data));
    } catch (error) {
      console.error("Attendance Error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getHolidays = async () => {
    try {
      const { data } = await axios.get(`https://sf.doaguru.com/api/getAllHolidaysCurrentYear`);
      setHolidays(data.filter(h => h.holiday_status === "active").map(h => {
        const [y, m, d] = h.holiday_date.split("-");
        return {
          date: `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`,
          title: h.holiday_title,
        };
      }));
    } catch (error) { console.error("Holidays Error:", error.message); }
  };

  useEffect(() => {
    getMonthlyAttendance();
    getHolidays();
  }, [month, year]);

  const daysInMonth = getDaysInMonth(month, year);
  const uniqueNames = useMemo(() => [...new Set(monthAttend.map(u => u.name))].sort(), [monthAttend]);
  const filteredUsers = useMemo(() => {
    return monthAttend.filter(u => {
      const matchesName = selectedName === "" || u.name === selectedName;
      const matchesSearch = searchTerm === "" || 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.user_id.toString().toLowerCase().includes(searchTerm.toLowerCase());
      return matchesName && matchesSearch;
    });
  }, [monthAttend, selectedName, searchTerm]);

  const downloadReport = async () => {
    try {
      const response = await axios.get(`https://sf.doaguru.com/api/downloadMonthlyAttendanceReport/${month}/${year}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Attendance_Report_${month}-${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { console.error("Download failed:", error); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-5">
      <div className="max-w-[1750px] mx-auto space-y-4">

        {/* ═══ Compact Header ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col items-center justify-between gap-4 lg:flex-row">
          <div className="flex items-center gap-3 text-center lg:text-left">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
              <FaCalendarAlt size={18} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">Attendance Matrix</h1>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Team-wide monthly presence control</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            {/* Month Pagination */}
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 disabled:opacity-30"><FaArrowLeft size={10} /></button>
              <div className="px-5 font-bold text-slate-800 text-xs whitespace-nowrap min-w-[130px] text-center">
                {new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}
              </div>
              <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><FaArrowRight size={10} /></button>
            </div>

            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-xs shadow-sm"
              />
            </div>

            <div className="relative w-full sm:w-56">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <select
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-xs appearance-none cursor-pointer"
              >
                <option value="">All Personnel</option>
                {uniqueNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <button
              onClick={downloadReport}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95 text-xs"
            >
              <FaDownload size={12} /> Download Report
            </button>
          </div>
        </div>

        {/* ═══ Compressed Legend ═══ */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max px-2">
            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 border-r border-slate-200 pr-5 mr-1">Legend</span>
            {Object.entries(dayStatusConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all hover:bg-slate-50 cursor-default group">
                <div className={`w-3 h-3 rounded-md ${cfg.dot} shadow-sm transition-transform`}></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ High-Density Grid ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-auto max-h-[72vh] custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-40">
                <tr className="bg-slate-50/90 backdrop-blur-md">
                  <th className="sticky left-0 z-50 bg-slate-50/90 border-b border-slate-200 px-4 py-3 font-black text-slate-400 text-[9px] uppercase tracking-widest min-w-[200px]">
                    Personnel Identity
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <th key={i} className="border-b border-slate-200 px-1 py-3 font-black text-slate-500 text-[10px] text-center min-w-[32px]">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={daysInMonth + 1} className="py-20 text-center text-slate-300 font-bold italic animate-pulse tracking-tight">Synthesizing log...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={daysInMonth + 1} className="py-20 text-center text-slate-300 font-bold italic">No records initialized.</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id} className="group hover:bg-indigo-50/20 transition-colors duration-75">
                      <td className="sticky left-0 z-30 bg-white group-hover:bg-indigo-50/20 px-4 py-2 border-r border-slate-100 shadow-sm transition-colors">
                        <Link
                          to={`/task/admin/employee-attendance-admin/${user?.user_id}?month=${month}&year=${year}`}
                          className="flex flex-col group/name"
                        >
                          <span className="text-indigo-600 font-black text-[12.5px] tracking-tight group-hover/name:underline">{user.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-none mt-0.5">ID: {user.user_id}</span>
                        </Link>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const dateStr = `${formatDate(i + 1)}-${formatDate(month)}-${year}`;
                        const status = user.attendance[dateStr];
                        const jsDate = new Date(year, month - 1, i + 1);
                        const isSunday = jsDate.getDay() === 0;
                        const holiday = holidays.find(h => h.date === dateStr);

                        let indicator = null;
                        if (status) indicator = dayStatusConfig[status];
                        else if (holiday) indicator = dayStatusConfig.holiday;
                        else if (isSunday) indicator = dayStatusConfig.sunday;

                        return (
                          <td key={i} className="px-0.5 py-2 text-center border-r border-slate-50 relative group/cell hover:bg-indigo-100/50 transition-colors">
                            {indicator && (
                              <div className="flex items-center justify-center relative">
                                <div className={`w-3.5 h-3.5 rounded-full ${indicator.dot} shadow-sm border border-white relative z-10 scale-100 group-hover/cell:scale-125 transition-transform`}></div>

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 z-[100] hidden group-hover/cell:block">
                                  <div className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap animate-fade-in border border-slate-800">
                                    <div className="flex flex-col items-center">
                                      <span>{i + 1} {new Date(year, month - 1).toLocaleString('default', { month: 'short' })}</span>
                                      <span className="text-indigo-300 uppercase tracking-widest mt-0.5">{indicator.label}</span>
                                      {holiday && <span className="text-orange-300 italic truncate max-w-[100px] mt-0.5 underline">{holiday.title}</span>}
                                    </div>
                                  </div>
                                  <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAttendCalendar;

