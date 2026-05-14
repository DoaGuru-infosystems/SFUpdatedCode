import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import moment from "moment-timezone";
import {
  FaDownload,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSun,
  FaUmbrellaBeach,
  FaInfoCircle,
  FaHistory,
  FaPlusCircle,
  FaArrowLeft,
  FaArrowRight
} from "react-icons/fa";
import * as XLSX from "xlsx";
import BackdatedAttendModal from "./BackdatedAttendModal";
import BackEmpAttendModal from "./BackEmpAttendModal";

/* ─────────────────── helpers ─────────────────── */
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_CONFIG = {
  full: { label: "Full Day", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "✓" },
  half: { label: "Half Day", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: "½" },
  absent: { label: "Absent", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "✗" },
  sunday: { label: "Sunday", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "☀" },
  holiday: { label: "Holiday", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "🎉" },
  leave: { label: "Leave", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: "🌴" },
  future: { label: "—", bg: "bg-gray-50", text: "text-gray-400", border: "border-gray-100", icon: "·" },
};

const EmployeeAttendReport = () => {
  const storedUser = localStorage.getItem("user");
  const user = JSON.parse(storedUser);

  const [attendData, setAttendData] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [requestData, setRequestData] = useState([]);
  
  const [openModal, setOpenModal] = useState(false);
  const [attendModal, setAttendModal] = useState(false);
  const [selected, setSelected] = useState([]);

  const fetchData = async () => {
    try {
      const [a, h, l] = await Promise.all([
        axios.get(`https://sf.doaguru.com/api/getCheckInByUserIdOnly/${user?.id}/${month}/${year}`),
        axios.get(`https://sf.doaguru.com/api/getHolidaysByMonthYear/${month}/${year}`),
        axios.get(`https://sf.doaguru.com/api/getMonthlyEmployeeLeavesByUserId/${user?.id}/${month}/${year}`)
      ]);
      setAttendData(Array.isArray(a.data) ? a.data : []);
      setHolidays(h.data?.data || []);
      setLeavesData(Array.isArray(l.data) ? l.data : []);
    } catch (e) { console.error(e); }
  };

  const getAllBackDateReq = async () => {
    try {
      const { data } = await axios.get(`https://sf.doaguru.com/api/getAllBackDateRequestBYId/${user?.id}`);
      setRequestData(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, [month, year]);
  useEffect(() => { getAllBackDateReq(); }, []);

  const handleMonthChange = (offset) => {
    const d = new Date(year, month - 1 + offset);
    setMonth(d.getMonth() + 1); setYear(d.getFullYear());
  };

  const calendarData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const attendMap = {};
    attendData.forEach(r => attendMap[moment(r.attend_date, ["DD-MM-YYYY","YYYY-MM-DD"]).format("YYYY-MM-DD")] = r);
    const holidayMap = {};
    holidays.forEach(h => holidayMap[moment(h.holiday_date, ["DD-MM-YYYY","YYYY-MM-DD"]).format("YYYY-MM-DD")] = h);
    const leaveMap = {};
    leavesData.forEach(l => { if(l.leave_status === "approved") leaveMap[moment(l.leave_date, ["DD-MM-YYYY","YYYY-MM-DD"]).format("YYYY-MM-DD")] = l; });

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dateStr = moment(dateObj).format("YYYY-MM-DD");
      const isSunday = dateObj.getDay() === 0;
      const attend = attendMap[dateStr]; const holiday = holidayMap[dateStr]; const leave = leaveMap[dateStr];
      let status = dateObj > today ? "future" : isSunday ? "sunday" : holiday ? "holiday" : leave ? "leave" : (attend?.login_time ? (attend.day_status === "half" ? "half" : "full") : "absent");
      days.push({ day: d, dateStr, isSunday, isFuture: dateObj > today, attend, holiday, leave, status });
    }
    return days;
  }, [attendData, holidays, leavesData, month, year]);

  const stats = useMemo(() => ({
    present: calendarData.filter(d => d.status === "full" || d.status === "half").length,
    absent: calendarData.filter(d => d.status === "absent").length,
    sunday: calendarData.filter(d => d.status === "sunday").length,
    holiday: calendarData.filter(d => d.status === "holiday").length,
    leave: calendarData.filter(d => d.status === "leave").length
  }), [calendarData]);

  const downloadExcel = () => {
    const rows = calendarData.map(d => ({ "Date": d.dateStr, "Status": STATUS_CONFIG[d.status].label, "Login": d.attend?.login_time || "—", "Logout": d.attend?.logout_time || "—", "Work Min": d.attend?.work_minutes || "—" }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `My_Attendance_${month}_${year}.xlsx`);
  };

  const deleteBackDateRequest = async (id) => {
    if (window.confirm("Delete request?")) {
      try { await axios.delete(`https://sf.doaguru.com/api/deleteBackDateRequest/${id}`); alert("Deleted"); getAllBackDateReq(); }
      catch (e) { alert("Error"); }
    }
  };

  const openAttendModalAction = (data) => {
    setSelected(data);
    setAttendModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-5">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* ═══ Compact Header ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
              <FaCalendarAlt size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">My Attendance</h1>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">Personal presence & request dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><FaArrowLeft size={12}/></button>
            <div className="px-5 text-center min-w-[130px]">
              <p className="font-bold text-slate-800 text-xs">{new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}</p>
            </div>
            <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><FaArrowRight size={12}/></button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <button onClick={() => setOpenModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl shadow-sm text-xs transition-all active:scale-95">+ Backdate Request</button>
             <button onClick={downloadExcel} className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black px-5 py-2.5 rounded-xl shadow-sm text-xs transition-all active:scale-95"><FaDownload size={12}/> Export</button>
          </div>
        </div>

        {/* ═══ Compressed Stats ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Present", val: stats.present, icon: <FaCheckCircle/>, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Absent", val: stats.absent, icon: <FaTimesCircle/>, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
            { label: "Sundays", val: stats.sundays, icon: <FaSun/>, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "Holidays", val: stats.holiday, icon: "🎉", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { label: "Leaves", val: stats.leave, icon: "🌴", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" }
          ].map((s, i) => (
            <div key={i} className={`p-3 rounded-2xl bg-white border ${s.border} shadow-sm flex items-center gap-3 transition-all hover:shadow-md`}>
              <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center text-lg shadow-inner`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">{s.label}</p>
                <p className={`text-lg font-black leading-none ${s.color}`}>{s.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Personnel Logs ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight italic">
              <FaHistory className="text-indigo-500" size={14} /> Personnel Activity Logs
            </h2>
            <div className="flex gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Presence</span>
              <span className="flex items-center gap-1 ml-2"><span className="w-2 h-2 rounded-full bg-red-400"></span> Void</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-4 py-3 border-b">Timeline</th>
                  <th className="px-3 py-3 border-b">Check-In Event</th>
                  <th className="px-3 py-3 border-b">Check-Out Event</th>
                  <th className="px-3 py-3 border-b text-center">Duration</th>
                  <th className="px-4 py-3 border-b">Status Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {calendarData.map((d, idx) => {
                  const cfg = STATUS_CONFIG[d.status];
                  return (
                    <tr key={idx} className={`group transition-all duration-75 ${d.isSunday ? 'bg-blue-50/30' : 'hover:bg-slate-50/70'}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-black text-[13px] tracking-tight">{moment(d.dateStr).format("DD MMM YYYY")}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-none mt-0.5">{moment(d.dateStr).format("dddd")}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {d.attend?.login_time ? (
                          <div className="flex items-center gap-2">
                            <img src={`https://sf.doaguru.com/${d.attend.login_selfie_url}`} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-sm" alt=""/>
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-black text-[11px]">{d.attend.login_time.slice(0, 5)}</span>
                              <span className="text-[8px] text-slate-400 font-bold uppercase leading-none mt-1">LAT: {d.attend.login_latitude}</span>
                            </div>
                          </div>
                        ) : <span className="text-slate-200 italic font-medium px-2">No check-in</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {d.attend?.logout_time ? (
                          <div className="flex items-center gap-2">
                            <img src={`https://sf.doaguru.com/${d.attend.logout_selfie_url}`} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-sm" alt=""/>
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-black text-[11px]">{d.attend.logout_time.slice(0, 5)}</span>
                              <span className="text-[8px] text-slate-400 font-bold uppercase leading-none mt-1">LNG: {d.attend.logout_longitude}</span>
                            </div>
                          </div>
                        ) : <span className="text-slate-200 italic font-medium px-2">No check-out</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${d.attend?.work_minutes ? 'bg-slate-100 text-slate-600' : 'text-slate-300'}`}>
                          {d.attend?.work_minutes || "0"} <span className="text-[8px] ml-0.5 uppercase">Min</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1.5 w-max">
                          {(d.isSunday || d.holiday || d.leave) && (() => {
                            const type = d.isSunday ? "sunday" : d.holiday ? "holiday" : "leave";
                            const typeCfg = STATUS_CONFIG[type];
                            return (
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border shadow-sm ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}>
                                {typeCfg.label === "Leave" ? d.leave?.leave_type || "Leave" : typeCfg.label}
                              </span>
                            );
                          })()}
                          {d.attend?.day_status && STATUS_CONFIG[d.attend.day_status] && (
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border shadow-sm ${STATUS_CONFIG[d.attend.day_status].bg} ${STATUS_CONFIG[d.attend.day_status].text} ${STATUS_CONFIG[d.attend.day_status].border}`}>
                              {STATUS_CONFIG[d.attend.day_status].label}
                            </span>
                          )}
                          {!d.isSunday && !d.holiday && !d.leave && !d.attend && !d.isFuture && (
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border shadow-sm ${STATUS_CONFIG.absent.bg} ${STATUS_CONFIG.absent.text} ${STATUS_CONFIG.absent.border}`}>ABSENT</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ Compressed Backdate Requests ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight italic">
              <FaHistory className="text-indigo-500" size={14}/> Backdate Reconciliation History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100/50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-4 py-3">Req Date</th>
                  <th className="px-3 py-3">Rationale</th>
                  <th className="px-3 py-3 text-center">Outcome</th>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Utility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requestData.length > 0 ? (
                  requestData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 text-slate-900 font-black text-[12px] tracking-tight">{row.request_date}</td>
                      <td className="px-3 py-2 text-slate-400 italic max-w-[200px] truncate" title={row.abr_reason}>
                        <FaInfoCircle className="inline mr-1 text-slate-200" size={10} /> {row.abr_reason}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest shadow-sm ${
                          row.abr_status === "approved" ? "bg-emerald-50 text-emerald-700" :
                          row.abr_status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {row.abr_status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 font-bold text-[9px] uppercase">{row.requested_at}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            disabled={row.abr_status === "approved"}
                            className={`px-2 py-1 rounded-md font-black text-[9px] uppercase tracking-wider transition-all ${
                              row.abr_status === "approved" ? "invisible" : "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                            }`}
                            onClick={() => deleteBackDateRequest(row?.request_id)}
                          >
                            Purge
                          </button>
                          {row.abr_status === "approved" && (
                            <button
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md font-black text-[9px] uppercase tracking-wider shadow-sm active:scale-90 transition-all"
                              onClick={() => openAttendModalAction(row)}
                            >
                              Finalize Log
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-300 font-bold italic">No reconciled records detected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <BackdatedAttendModal isOpen={openModal} onClose={() => setOpenModal(false)} userId={user?.id} getAllBackDateReq={getAllBackDateReq} />
      <BackEmpAttendModal isOpen={attendModal} onClose={() => setAttendModal(false)} userId={user?.id} getAllBackDateReq={getAllBackDateReq} selected={selected} />
    </div>
  );
};

export default EmployeeAttendReport;
