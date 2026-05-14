import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { 
  FaDownload, 
  FaFileExcel, 
  FaHistory, 
  FaSearch, 
  FaFilter, 
  FaSyncAlt, 
  FaArrowLeft, 
  FaArrowRight,
  FaProjectDiagram,
  FaClock,
  FaCheckCircle,
  FaUserCog,
  FaCalendarAlt,
  FaChevronDown
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment-timezone";
import * as XLSX from "xlsx";

/* ─── Compact Pagination Component ─── */
const Pagination = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = [];
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);
  if (page <= 3) {
    start = 1;
    end = Math.min(5, totalPages);
  } else if (page > totalPages - 3) {
    start = Math.max(1, totalPages - 4);
    end = totalPages;
  }
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl">
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 flex items-center justify-center transition-all"
        >
          <FaArrowLeft size={10} />
        </button>
        <div className="flex items-center gap-1">
          {pageNumbers.map(num => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`w-7 h-7 rounded-lg font-black text-[10px] transition-all ${
                page === num
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 flex items-center justify-center transition-all"
        >
          <FaArrowRight size={10} />
        </button>
      </div>
    </div>
  );
};

const TaskReportDownload = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [graphicsPage, setGraphicsPage] = useState(1);
  const [commonPage, setCommonPage] = useState(1);
  const [defaulter, setDefaulter] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const rowsPerPage = 10;
  const [isLoading, setIsLoading] = useState(false);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  useEffect(() => {
    axios
      .get("https://sf.doaguru.com/api/users")
      .then((response) => setUsers(response.data))
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      setIsLoading(true);
      let url = `https://sf.doaguru.com/api/getUserTasks/${selectedUserId}`;
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      if (year) params.append("year", year);
      if (dateRange.startDate && dateRange.endDate) {
        params.append("startDate", dateRange.startDate);
        params.append("endDate", dateRange.endDate);
      }
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      axios
        .get(url)
        .then((response) => setTasks(response.data))
        .catch((error) => console.error("Error fetching tasks:", error))
        .finally(() => setIsLoading(false));
    }
  }, [selectedUserId, month, year, dateRange]);

  const graphicsTasksRaw = useMemo(() => {
    return tasks
      .filter(task => ["Other Graphic Design", "POST Create ", "Video Edittor"].includes(task.SubCategory))
      .slice().reverse();
  }, [tasks]);

  const commonTasksRaw = useMemo(() => {
    return tasks
      .filter(task => !["Other Graphic Design", "POST Create ", "Video Edittor"].includes(task.SubCategory))
      .slice().reverse();
  }, [tasks]);

  const graphicsPaginated = graphicsTasksRaw.slice((graphicsPage - 1) * rowsPerPage, graphicsPage * rowsPerPage);
  const commonPaginated = commonTasksRaw.slice((commonPage - 1) * rowsPerPage, commonPage * rowsPerPage);

  const graphicsTotalPages = Math.ceil(graphicsTasksRaw.length / rowsPerPage);
  const commonTotalPages = Math.ceil(commonTasksRaw.length / rowsPerPage);

  const stats = useMemo(() => {
    const totalTime = tasks.reduce((sum, t) => sum + (parseInt(t.ConsumingTimeInMin) || 0), 0);
    return {
      total: tasks.length,
      graphics: graphicsTasksRaw.length,
      common: commonTasksRaw.length,
      totalTime: totalTime >= 60 ? `${(totalTime / 60).toFixed(1)} hrs` : `${totalTime} mins`
    };
  }, [tasks, graphicsTasksRaw, commonTasksRaw]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      u.id?.toString().includes(userSearchTerm)
    );
  }, [users, userSearchTerm]);

  const handleUserChange = (e) => {
    setSelectedUserId(e.target.value);
    setGraphicsPage(1);
    setCommonPage(1);
  };
  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    setGraphicsPage(1);
    setCommonPage(1);
  };
  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    setGraphicsPage(1);
    setCommonPage(1);
  };

  const handleDownload = () => {
    if (!selectedUserId) return alert('Select a user first');
    let downloadUrl = `https://sf.doaguru.com/api/downloadUserTasks/${selectedUserId}`;
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (dateRange.startDate && dateRange.endDate) {
      params.append("startDate", dateRange.startDate);
      params.append("endDate", dateRange.endDate);
    }
    const queryString = params.toString();
    if (queryString) downloadUrl += `?${queryString}`;
    window.location.href = downloadUrl;
  };

  const handleResetFilters = () => {
    setMonth("");
    setYear("");
    setSelectedUserId("");
    setUserSearchTerm("");
    setDateRange({ startDate: "", endDate: "" });
    setTasks([]);
    setGraphicsPage(1);
    setCommonPage(1);
  };

  const currentFormattedDate = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");
  useEffect(() => { 
    axios.get(`https://sf.doaguru.com/api/checkNoTaskEmployee/${currentFormattedDate}`)
      .then(res => setDefaulter(res.data))
      .catch(e => console.log(e));
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const downloadDefaulterExcel = () => {
    if (!defaulter?.missingEmployees) return alert("No data!");
    const dataWithDate = defaulter.missingEmployees.map(emp => ({
      Date: defaulter.date,
      "Full Name": emp.full_name,
      "Email ID": emp.email_id,
      Designation: emp.designation,
      Department: emp.department,
    }));
    const ws = XLSX.utils.json_to_sheet(dataWithDate);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
    XLSX.writeFile(wb, `Defaulters_${defaulter.date}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-5">
      <div className="max-w-[1700px] mx-auto space-y-4">
        
        {/* ═══ Compact Header ═══ */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
              <FaHistory size={20} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-800 leading-tight">Admin Task Control</h1>
              <p className="text-slate-500 font-medium text-[10px] uppercase tracking-tighter">Personnel Performance Monitoring Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
                onClick={downloadDefaulterExcel}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-xs"
            >
                <FaCheckCircle size={14} /> Defaulters
            </button>
            <button
              onClick={handleDownload}
              disabled={!selectedUserId}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-30 active:scale-95 text-xs"
            >
              <FaFileExcel size={14} /> Export
            </button>
          </div>
        </div>

        {/* ═══ Slim Filters ═══ */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="relative" ref={dropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block px-1">Discover Member</label>
              <div 
                className={`relative group transition-all duration-200 ${isUserDropdownOpen ? 'ring-2 ring-indigo-500/10' : ''}`}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FaSearch size={10} />
                </div>
                <input
                  type="text"
                  placeholder="Type name or ID to search..."
                  value={userSearchTerm}
                  onFocus={() => setIsUserDropdownOpen(true)}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    if (!isUserDropdownOpen) setIsUserDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 text-xs shadow-sm"
                />
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FaChevronDown size={10} className={`transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-[100] mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-indigo-100/50 overflow-hidden max-h-64 flex flex-col"
                  >
                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
                      <button
                        onClick={() => {
                          setSelectedUserId("all");
                          setUserSearchTerm("Global Analytics");
                          setIsUserDropdownOpen(false);
                          setGraphicsPage(1);
                          setCommonPage(1);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                          selectedUserId === "all" ? "bg-indigo-600 text-white" : "hover:bg-slate-50 text-indigo-600 italic"
                        }`}
                      >
                        Global Analytics
                      </button>
                      
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setUserSearchTerm(u.full_name);
                              setIsUserDropdownOpen(false);
                              setGraphicsPage(1);
                              setCommonPage(1);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              selectedUserId === u.id ? "bg-indigo-600 text-white" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                                <span>{u.full_name}</span>
                                <span className={`text-[9px] ${selectedUserId === u.id ? 'text-indigo-200' : 'text-slate-400'} font-black px-1.5 py-0.5 rounded-md border ${selectedUserId === u.id ? 'border-indigo-400' : 'border-slate-100'}`}>ID: {u.id}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-slate-400 text-xs italic font-bold">No members found.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block px-1">Calendar Period</label>
              <div className="flex gap-2">
                <select
                  onChange={(e) => setYear(e.target.value)}
                  value={year}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 text-xs cursor-pointer"
                >
                  <option value="">Year...</option>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  onChange={handleMonthChange}
                  value={month}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 text-xs cursor-pointer"
                >
                  <option value="">Month...</option>
                  {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                    <option key={m} value={m}>{moment(m, "MM").format("MMMM")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block px-1">From</label>
                    <input type="date" name="startDate" onChange={handleDateChange} value={dateRange.startDate} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs" />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block px-1">To</label>
                    <input type="date" name="endDate" onChange={handleDateChange} value={dateRange.endDate} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs" />
                </div>
            </div>

            <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black px-4 py-2.5 rounded-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest"
              >
                <FaSyncAlt size={10} /> Reset
            </button>
          </div>
        </div>

        {/* ═══ Compressed Stats ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Aggregate Tasks", val: stats.total, color: "text-indigo-600", bg: "bg-indigo-50", icon: <FaHistory/> },
            { label: "Time Invested", val: stats.totalTime, color: "text-emerald-600", bg: "bg-emerald-50", icon: <FaClock/> },
            { label: "Creative Work", val: stats.graphics, color: "text-amber-600", bg: "bg-amber-50", icon: <FaProjectDiagram/> },
            { label: "Common Tasks", val: stats.common, color: "text-rose-600", bg: "bg-rose-50", icon: <FaCheckCircle/> }
          ].map((s, i) => (
            <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center text-lg shadow-inner flex-shrink-0`}>
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
        <div className="space-y-6">
            {graphicsTasksRaw.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/50">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                            <FaProjectDiagram size={14} />
                        </div>
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-tight italic">Graphics Performance Matrix</h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-50/50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                                <tr>
                                    <th className="px-4 py-3 border-b">#</th>
                                    <th className="px-3 py-3 border-b">Member Activity</th>
                                    <th className="px-3 py-3 border-b italic">Classification</th>
                                    <th className="px-3 py-3 border-b text-center">Media Units</th>
                                    <th className="px-3 py-3 border-b">Progress</th>
                                    <th className="px-3 py-3 border-b text-center">Dur</th>
                                    <th className="px-4 py-3 border-b text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {graphicsPaginated.map((task, index) => (
                                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-2 text-slate-400 font-black text-[10px]">{(graphicsPage-1)*rowsPerPage + index + 1}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-black text-[12.5px] tracking-tight truncate max-w-[200px]">{task.ProjectOrClientName}</span>
                                                <span className="text-[9px] text-slate-400 max-w-[250px] truncate">{task.TaskDescription}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-indigo-600 font-black text-[9px] uppercase tracking-tighter leading-none">{task.Category}</span>
                                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1 leading-none">{task.SubCategory}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {task.postCount > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase">P: {task.postCount}</span>}
                                                {task.videoCount > 0 && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase">V: {task.videoCount}</span>}
                                                {task.other_graphics_count > 0 && <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase">O: {task.other_graphics_count}</span>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-col gap-0.5">
                                                {task.post_creative_status && <span className={`text-[8px] font-black uppercase px-1.5 rounded-md w-fit ${task.post_creative_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{task.post_creative_status}</span>}
                                                {task.video_status && <span className={`text-[8px] font-black uppercase px-1.5 rounded-md w-fit ${task.video_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{task.video_status}</span>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 text-[10px] font-black">{task.ConsumingTimeInMin}m</span>
                                        </td>
                                        <td className="px-4 py-2 text-right text-slate-500 font-black text-[10px] italic">{task.task_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={graphicsPage} totalPages={graphicsTotalPages} setPage={setGraphicsPage} />
                </div>
            )}

            {commonTasksRaw.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/50">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                            <FaCheckCircle size={14} />
                        </div>
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-tight italic">Operational Task Log</h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-50/50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                                <tr>
                                    <th className="px-4 py-3 border-b">#</th>
                                    <th className="px-3 py-3 border-b">Task Context</th>
                                    <th className="px-3 py-3 border-b italic">Department</th>
                                    <th className="px-3 py-3 border-b">Activity Detail</th>
                                    <th className="px-3 py-3 border-b text-center">Dur</th>
                                    <th className="px-4 py-3 border-b text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {commonPaginated.map((task, index) => (
                                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors group">
                                        <td className="px-4 py-2.5 text-slate-400 font-black text-[10px]">{(commonPage-1)*rowsPerPage + index + 1}</td>
                                        <td className="px-3 py-2.5 font-black text-slate-800 tracking-tight text-[12.5px] uppercase">{task.ProjectOrClientName}</td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="text-indigo-600 font-black text-[9px] uppercase tracking-tighter leading-none">{task.Category}</span>
                                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1 leading-none">{task.SubCategory}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 min-w-[350px] whitespace-normal">
                                            <p className="text-slate-500 text-[11.5px] font-medium leading-relaxed italic">{task.TaskDescription}</p>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">{task.ConsumingTimeInMin}m</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-600 font-bold text-[10px] italic">{task.task_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={commonPage} totalPages={commonTotalPages} setPage={setCommonPage} />
                </div>
            )}

            {!isLoading && tasks.length === 0 && (
                <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-200 border-dashed flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                        <FaSearch size={24} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">Initialize Personnel Log</h3>
                    <p className="text-slate-400 max-w-xs font-medium leading-relaxed text-[11px] uppercase tracking-tighter italic">Select an employee and period to synthesize report.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskReportDownload;
