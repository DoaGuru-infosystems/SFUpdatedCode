import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import moment from "moment-timezone";
import {
  FaArrowLeft,
  FaDownload,
  FaRupeeSign,
  FaCalendarAlt,
  FaTable,
  FaUniversity,
  FaCheckCircle,
  FaTimesCircle,
  FaSun,
  FaUmbrellaBeach,
} from "react-icons/fa";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminAddAttendanceModal from "./AdminAddAttendanceModal";
import AdminUpdateAttendanceModal from "./AdminUpdateAttendanceModal";
import SalaryManagement from "../pages/Admin/SalaryManagement";

/* ─────────────────── helpers ─────────────────── */
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_CONFIG = {
  full: { label: "Full Day", bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", border: "border-emerald-300", icon: "✓" },
  half: { label: "Half Day", bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500", border: "border-cyan-300", icon: "½" },
  absent: { label: "Absent", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500", border: "border-red-300", icon: "✗" },
  sunday: { label: "Sunday", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-400", border: "border-blue-200", icon: "☀" },
  holiday: { label: "Holiday", bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500", border: "border-amber-300", icon: "🎉" },
  leave: { label: "Leave", bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500", border: "border-purple-300", icon: "🌴" },
  future: { label: "—", bg: "bg-gray-50", text: "text-gray-400", dot: "bg-gray-300", border: "border-gray-100", icon: "·" },
};

const LEAVE_TYPE_COLORS = {
  "Sick Leave": "bg-rose-100 text-rose-700",
  "Casual Leave": "bg-violet-100 text-violet-700",
  "Paid Leave": "bg-green-100 text-green-700",
  "Unpaid Leave": "bg-orange-100 text-orange-700",
  "Maternity Leave": "bg-pink-100 text-pink-700",
  default: "bg-purple-100 text-purple-700",
};

/* ─────────────────── main component ─────────────────── */
const EmployeeAttendanceAdmin = ({ userRole }) => {
  const navigate = useNavigate();
  const { uid } = useParams();
  const [params] = useSearchParams();

  const currentMonth = params.get("month");
  const currentYear = params.get("year");

  const [attendData, setAttendData] = useState([]);
  const [month, setMonth] = useState(currentMonth ? parseInt(currentMonth) : new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear ? parseInt(currentYear) : new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [selectedData, setSelectedData] = useState();
  const [result, setResult] = useState(null);
  const [salaryData, setSalaryData] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [empDetails, setEmpDetails] = useState(null);
  const [view, setView] = useState("calendar");
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcType, setCalcType] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    setResult(null);
  }, [calcType, customStart, customEnd]);

  const fetchData = async () => {
    try {
      const [h, l, a] = await Promise.all([
        axios.get(`${window.API_BASE}/api/getHolidaysByMonthYear/${month}/${year}`),
        axios.get(`${window.API_BASE}/api/getMonthlyEmployeeLeavesByUserId/${uid}/${month}/${year}`),
        axios.get(`${window.API_BASE}/api/getCheckInByUserIdOnly/${uid}/${month}/${year}`)
      ]);
      setHolidays(h.data?.data || []);
      setLeavesData(Array.isArray(l.data) ? l.data : []);
      setAttendData(a.data);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { fetchData(); }, [month, year]);
  useEffect(() => {
    axios.get(`${window.API_BASE}/api/getEmployeeSalary/${uid}`).then(res => setSalaryData(res.data));
    axios.get(`${window.API_BASE}/api/UserDataById/${uid}`).then(res => setEmpDetails(res.data[0]));
  }, [uid]);

  const handleMonthChange = (offset) => {
    const d = new Date(year, month - 1 + offset);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
    setResult(null);
  };

  const calendarData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const attendMap = {};
    attendData.forEach(r => attendMap[moment(r.attend_date, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")] = r);
    const holidayMap = {};
    holidays.forEach(h => holidayMap[moment(h.holiday_date, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")] = h);
    const leaveMap = {};
    leavesData.forEach(l => { if (l.leave_status === "approved") leaveMap[moment(l.leave_date, ["DD-MM-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")] = l; });

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isSunday = dateObj.getDay() === 0;
      const attend = attendMap[dateStr];
      const holiday = holidayMap[dateStr];
      const leave = leaveMap[dateStr];
      let status = dateObj > today ? "future" : isSunday ? "sunday" : holiday ? "holiday" : leave ? "leave" : (attend?.login_time ? (attend.day_status === "half" ? "half" : "full") : "absent");
      days.push({ day: d, dateStr, isSunday, isFuture: dateObj > today, attend, holiday, leave, status, dayOfWeek: dateObj.getDay() });
    }
    return days;
  }, [attendData, holidays, leavesData, month, year]);

  const stats = useMemo(() => ({
    present: calendarData.filter(d => d.status === "full" || d.status === "half").length,
    absent: calendarData.filter(d => d.status === "absent").length,
    sunday: calendarData.filter(d => d.status === "sunday").length,
    holiday: calendarData.filter(d => d.status === "holiday").length,
    leave: calendarData.filter(d => d.status === "leave").length,
  }), [calendarData]);

  const calculateSalary = async () => {
    setCalcLoading(true);
    try {
      const payload = {
        monthlySalary: salaryData[0]?.salary_amount,
        paidLeaves: 1,
      };
      if (calcType === "custom") {
        if (!customStart || !customEnd) {
          alert("Please select both start and end dates.");
          setCalcLoading(false);
          return;
        }
        payload.startDate = customStart;
        payload.endDate = customEnd;
      } else {
        payload.selectedMonth = month;
        payload.selectedYear = year;
      }

      // Pointed back to local server to check with local database
      const { data } = await axios.post(`${window.API_BASE}/api/SalaryCalculatorsByUser/${uid}`, payload);
      setResult(data);
    } catch (e) {
      console.log(e);
      alert(e.response?.data?.message || "Error calculating salary.");
    } finally { setCalcLoading(false); }
  };

  const downloadExcel = () => {
    const rows = attendData.map(r => ({ "Work Date": r.attend_date, "Login": r.login_time, "Logout": r.logout_time, "Min": r.work_minutes, "Status": r.day_status }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${empDetails?.full_name}_Attendance_${month}_${year}.xlsx`);
  };

  const empName = empDetails?.full_name || "Employee";
  const leadingBlanks = calendarData[0]?.dayOfWeek || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ═══ Compact Header ═══ */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-all text-xs">
            <FaArrowLeft size={10} /> Back
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="leading-tight">
            <h1 className="text-sm font-black text-slate-800">{empName} <span className="text-slate-400 font-medium ml-1">DOAG{uid}</span></h1>
            <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest">Attendance Lifecycle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition-all shadow-sm">+ ADD LOG</button>
          <button onClick={downloadExcel} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black px-3 py-1.5 rounded-lg transition-all shadow-sm">
            <FaDownload size={10} /> EXPORT
          </button>
        </div>
      </div>

      <div className="px-4 py-3 max-w-[1600px] mx-auto space-y-3">
        {/* ═══ Info Strip ═══ */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg font-black border border-indigo-100 shadow-inner">
              {empName.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">{empName}</h2>
              <div className="flex gap-2 mt-0.5">
                <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">{empDetails?.designation || "Member"}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${empDetails?.employment_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{empDetails?.employment_status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
            <button onClick={() => handleMonthChange(-1)} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-300 rounded-md hover:bg-slate-100 text-slate-600 text-sm font-black transition-all">‹</button>
            <div className="text-center min-w-[100px]">
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-tight">{new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}</p>
            </div>
            <button onClick={() => handleMonthChange(1)} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-300 rounded-md hover:bg-slate-100 text-slate-600 text-sm font-black transition-all">›</button>
          </div>
        </div>

        {/* ═══ Stats Cards ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {[
            { label: "Present", val: stats.present, color: "text-emerald-700", bg: "bg-emerald-50", icon: <FaCheckCircle /> },
            { label: "Absent", val: stats.absent, color: "text-rose-700", bg: "bg-rose-50", icon: <FaTimesCircle /> },
            { label: "Sundays", val: stats.sunday, color: "text-blue-700", bg: "bg-blue-50", icon: <FaSun /> },
            { label: "Holidays", val: stats.holiday, color: "text-amber-700", bg: "bg-amber-50", icon: "🎉" },
            { label: "Leaves", val: stats.leave, color: "text-purple-700", bg: "bg-purple-50", icon: <FaUmbrellaBeach /> }
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border border-slate-200/50 rounded-xl p-2.5 flex items-center gap-3 shadow-sm transition-all hover:shadow-md`}>
              <div className={`text-sm ${s.color}`}>{s.icon}</div>
              <div>
                <p className={`text-lg font-black leading-none ${s.color}`}>{s.val}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8 space-y-3">
            {/* View Toggle */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <button onClick={() => setView("calendar")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === "calendar" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600"}`}><FaCalendarAlt size={10} /> Calendar</button>
                <button onClick={() => setView("table")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === "table" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600"}`}><FaTable size={10} /> Detail</button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[["bg-emerald-400", "P"], ["bg-cyan-400", "H"], ["bg-red-400", "A"], ["bg-blue-400", "S"], ["bg-amber-400", "H"], ["bg-purple-400", "L"]].map(([dot, lbl]) => (
                  <div key={lbl} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${dot}`}></span><span className="text-[9px] text-slate-400 font-bold">{lbl}</span></div>
                ))}
              </div>
            </div>

            {/* Calendar View */}
            {view === "calendar" && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="grid grid-cols-7 mb-1">
                  {DAY_LABELS.map(d => <div key={d} className={`text-center text-[9px] font-black uppercase tracking-widest py-1.5 ${d === "Sun" ? "text-blue-500" : "text-slate-400"}`}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: leadingBlanks }).map((_, i) => <div key={i} />)}
                  {calendarData.map(d => {
                    const cfg = STATUS_CONFIG[d.status];
                    return (
                      <div key={d.dateStr} className={`relative rounded-lg border ${cfg.border} ${cfg.bg} p-1 min-h-[48px] flex flex-col items-center justify-center cursor-default transition-all group overflow-hidden`}>
                        <span className={`text-[10px] font-black ${d.isSunday ? "text-blue-600" : "text-slate-700"}`}>{d.day}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs leading-none">{cfg.icon}</span>
                          {(d.isSunday || d.holiday) && d.attend?.login_time && (
                            <span className="text-[10px] leading-none text-emerald-600 font-black bg-white/80 rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-[0_0_2px_rgba(0,0,0,0.1)] border border-emerald-200">
                              {d.attend.day_status === "half" ? "½" : "✓"}
                            </span>
                          )}
                        </div>
                        {(d.leave || d.holiday) && <span className="text-[7px] font-black uppercase mt-0.5 truncate w-full text-center px-1">{d.leave?.leave_type || d.holiday?.holiday_title}</span>}
                        {!d.isFuture && (
                          <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col bg-slate-900 text-white text-[9px] rounded-lg px-2 py-1 shadow-xl whitespace-nowrap min-w-[80px]">
                            <span className="font-bold border-b border-white/10 pb-1 mb-1">{d.dateStr}</span>
                            {d.attend?.login_time && <span>🕐 {d.attend.login_time.slice(0, 5)}-{d.attend.logout_time?.slice(0, 5) || '--:--'}</span>}
                            {d.attend?.work_minutes && <span>⏱ {d.attend.work_minutes}m</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Table View */}
            {view === "table" && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-800 text-white font-black uppercase tracking-wider">
                      <tr>{["Date", "Log In", "Log Out", "Dur", "Status", "Action"].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {calendarData.map((row, idx) => (
                        <tr key={idx} className={`transition-colors ${row.isSunday ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                          <td className="px-3 py-1.5"><span className="font-black text-slate-800">{moment(row.dateStr).format("DD MMM")}</span> <span className="text-[9px] text-slate-400 font-bold uppercase">{moment(row.dateStr).format("ddd")}</span></td>
                          <td className="px-3 py-1.5 font-bold text-slate-600">
                            {row.attend?.login_time ? (
                              <div className="flex items-center gap-2">
                                {row.attend.login_selfie_url && (
                                  <img
                                    src={`${window.API_BASE}/${row.attend.login_selfie_url}`}
                                    className="w-8 h-8 rounded object-cover border border-slate-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                    alt="Login Selfie"
                                    onClick={() => window.open(`${window.API_BASE}/${row.attend.login_selfie_url}`, '_blank')}
                                    title="Click to view full selfie"
                                  />
                                )}
                                <span>{row.attend.login_time.slice(0, 5)}</span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-1.5 font-bold text-slate-600">
                            {row.attend?.logout_time ? (
                              <div className="flex items-center gap-2">
                                {row.attend.logout_selfie_url && (
                                  <img
                                    src={`${window.API_BASE}/${row.attend.logout_selfie_url}`}
                                    className="w-8 h-8 rounded object-cover border border-slate-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                    alt="Logout Selfie"
                                    onClick={() => window.open(`${window.API_BASE}/${row.attend.logout_selfie_url}`, '_blank')}
                                    title="Click to view full selfie"
                                  />
                                )}
                                <span>{row.attend.logout_time.slice(0, 5)}</span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-slate-700 font-bold">{row.attend?.work_minutes || "—"}m</td>
                          <td className="px-3 py-1.5">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${STATUS_CONFIG[row.status].bg} ${STATUS_CONFIG[row.status].text} ${STATUS_CONFIG[row.status].border}`}>
                              {STATUS_CONFIG[row.status].label}
                            </span>
                          </td>
                          <td className="px-3 py-1.5">
                            {!row.isFuture && (
                              <button onClick={() => { if (row.attend) { setSelectedData(row.attend); setUpdateModal(true); } else { setIsModalOpen(true); } }} className={`text-[9px] font-black px-2 py-0.5 rounded border transition-all ${row.attend ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                {row.attend ? 'EDIT' : 'ADD'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Salary Management Section */}
            {userRole === "admin" && (
              <SalaryManagement employeeId={uid} baseSalary={salaryData[0]?.salary_amount} />
            )}
          </div>

          <div className="xl:col-span-4 space-y-3">
            {/* Salary Calculation */}
            {userRole === "admin" && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payroll Estimator</h3>

                {/* Mode Selector */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setCalcType("month")}
                    className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${calcType === "month" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setCalcType("custom")}
                    className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${calcType === "custom" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Custom Range
                  </button>
                </div>

                {calcType === "custom" && (
                  <div className="space-y-2 border border-slate-200/50 p-2.5 rounded-xl bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-slate-400 font-black uppercase block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-400 font-black uppercase block mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Stipulated Salary</p>
                  <p className="text-xl font-black text-slate-800 flex items-center gap-1.5"><FaRupeeSign size={14} /> {salaryData[0]?.salary_amount?.toLocaleString() || "N/A"}</p>
                </div>
                <button onClick={calculateSalary} disabled={calcLoading || !salaryData[0]} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-2 rounded-lg text-xs transition-all shadow-sm">
                  {calcLoading ? "CALCULATING..." : "RUN ESTIMATE"}
                </button>
                {result && (() => {
                  const workedHolidaysCount = calendarData.filter(d => d.holiday && d.attend?.login_time).length;
                  const holidayBonus = workedHolidaysCount * parseFloat(result.dailySalary || 0);
                  const maxExpectedSalary = parseFloat(result.dailySalary || 0) * result.totalDaysInMonth;
                  const deductions = (maxExpectedSalary - parseFloat(result.totalSalary || 0) + holidayBonus).toFixed(2);

                  return (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[8px] text-slate-400 font-black uppercase">Worked Days</p>
                          <p className="text-xs font-black text-slate-700">{parseFloat(result.fullDays) + parseFloat(result.halfDays) * 0.5} <span className="text-[9px] text-slate-400 font-medium">/ {result.totalDaysInMonth}</span></p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[8px] text-slate-400 font-black uppercase">Sundays (Tot/Wrk)</p>
                          <p className="text-xs font-black text-slate-700">{result.totalSundays} <span className="text-[9px] text-slate-400 font-medium">/ {result.workedSundaysFull + result.workedSundaysHalf}</span></p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[8px] text-slate-400 font-black uppercase">Daily Rate</p>
                          <p className="text-xs font-black text-slate-700">₹{parseFloat(result.dailySalary || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                          <p className="text-[8px] text-rose-400 font-black uppercase">Deductions</p>
                          <p className="text-xs font-black text-rose-700">- ₹{deductions}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 px-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Monthly CTC</span>
                          <span>₹{salaryData[0]?.salary_amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Earned Base Pay</span>
                          <span>₹{result.basePay}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Sunday Pay (Fixed)</span>
                          <span>₹{result.sundayFixedPay}</span>
                        </div>
                        {result.originalAbsentDays > 0 && (
                          <div className="flex flex-col gap-1 mt-2 mb-2 p-2 bg-amber-50/50 rounded-lg border border-amber-100">
                            <span className="text-[9px] font-black uppercase text-amber-700 tracking-widest">Leave & Comp-Off Adjustments</span>
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>Total Leaves (Absent Days)</span>
                              <span>{result.originalAbsentDays} Day(s)</span>
                            </div>
                            {result.compOffsAdjustedThisMonth > 0 && (
                              <div className="flex justify-between text-[10px] font-bold text-emerald-600">
                                <span>Waived by Comp-Offs (Sundays Worked)</span>
                                <span>- {result.compOffsAdjustedThisMonth} Day(s)</span>
                              </div>
                            )}
                            <div className="flex justify-between text-[10px] font-black text-amber-800 border-t border-amber-200/50 pt-1 mt-1">
                              <span>Net Payable Deducted Leaves</span>
                              <span>{result.absentDays} Day(s)</span>
                            </div>
                            {result.remainingCompOffBalance > 0 && (
                              <div className="flex justify-between text-[10px] font-bold text-indigo-600 mt-1">
                                <span>Remaining Comp-Off Balance to carry forward</span>
                                <span>{result.remainingCompOffBalance} Day(s)</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Holiday Pay (Fixed)</span>
                          <span>₹{result.paidHolidayPay}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Paid Leave (1 Day)</span>
                          <span>₹{result.paidLeaveAmount}</span>
                        </div>
                        {holidayBonus > 0 && (
                          <div className="flex justify-between text-[10px] font-black text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-md">
                            <span>Holiday Working Bonus</span>
                            <span>+ ₹{holidayBonus.toFixed(2)}</span>
                          </div>
                        )}
                        {(maxExpectedSalary - parseFloat(result.totalSalary || 0)) > 0 && (
                          <div className="flex justify-between text-[10px] font-black text-rose-500 bg-rose-50/50 px-2 py-1 rounded-md">
                            <span>Estimated Deductions</span>
                            <span>- ₹{(maxExpectedSalary - parseFloat(result.totalSalary || 0)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between font-black text-emerald-700 bg-emerald-50 p-2.5 rounded-xl mt-2 text-[13px] shadow-sm border border-emerald-100">
                        <div className="flex flex-col leading-tight">
                          <span>Final Salary</span>
                          <span className="text-[8px] font-bold text-emerald-600/70 uppercase tracking-tighter italic leading-none">Net Payout after adjustments</span>
                        </div>
                        <span className="text-lg">₹{parseFloat(result.totalSalary || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Bank Credentials */}
            {empDetails && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FaUniversity size={14} />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Account</h3>
                </div>

                <div className="space-y-3">
                  <div className="group">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">Account Number</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">{empDetails.bank_account_number || "Not Configured"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">IFSC Code</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight uppercase">{empDetails.bank_ifsc_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">UPI Handle</p>
                      <p className="text-[11px] font-black text-slate-700 tracking-tight lowercase">{empDetails.bank_upi_id || "N/A"}</p>
                    </div>
                  </div>

                  {empDetails.bank_barcode && (
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <FaRupeeSign size={9} /> Instant Pay QR
                      </p>
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 inline-block shadow-inner group transition-all hover:scale-105">
                        <img
                          src={`${window.API_BASE}/${empDetails.bank_barcode}`}
                          alt="Payment QR"
                          className="w-32 h-32 object-contain contrast-125 mix-blend-multiply"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Holidays List */}
            {holidays.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Holidays in {new Date(year, month - 1).toLocaleString('default', { month: 'short' })}</h3>
                <div className="space-y-1.5">
                  {holidays.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 bg-amber-50 rounded-lg border border-amber-100">
                      <span className="text-xs">🎉</span>
                      <div className="min-w-0"><p className="font-black text-slate-700 text-[10px] truncate">{h.holiday_title}</p><p className="text-[8px] text-amber-600 font-bold">{h.holiday_date}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminAddAttendanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} fetchAttendance={fetchData} userId={uid} />
      <AdminUpdateAttendanceModal isOpen={updateModal} onClose={() => setUpdateModal(false)} fetchAttendance={fetchData} initialData={selectedData} />
    </div>
  );
};

export default EmployeeAttendanceAdmin;
