import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  FaUsers,
  FaTasks,
  FaChartBar,
  FaCalendarAlt,
  FaSearch,
  FaUserPlus,
  FaClock,
  FaPaperPlane,
  FaCheckCircle,
  FaFolder,
  FaPlus,
  FaUser
} from "react-icons/fa";

const LeaderDashboard = () => {
  const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8080" : "http://localhost:3000";

  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "dashboard";
  }, [location.search]);

  const setActiveTab = (tab) => {
    navigate(`/task/TeamLeaderDashboard?tab=${tab}`);
  };

  const [leader, setLeader] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and Selection States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState({ devTasks: [], targetTasks: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [memberFilter, setMemberFilter] = useState("All");
  const [assignedTaskMemberFilter, setAssignedTaskMemberFilter] = useState("All");

  // Assignment Form State
  const [assignForm, setAssignForm] = useState({
    employeeId: "",
    projectId: "",
    taskDescription: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    targetPost: "",
    targetVideo: "",
    targetShoot: "",
    taskDate: new Date().toISOString().split("T")[0],
    note: ""
  });
  const [assignLoading, setAssignLoading] = useState(false);

  // Load Leader Session
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      const isTeamLead =
        parsed.role === "team_lead" ||
        parsed.role === "admin" ||
        parsed.id === 62 ||
        parsed.designation?.toLowerCase().includes("lead");

      if (!isTeamLead) {
        setLeader(null);
        setLoading(false);
        return;
      }
      if (parsed.role !== "team_lead" && parsed.id === 62) {
        parsed.role = "team_lead";
        localStorage.setItem("user", JSON.stringify(parsed));
      }
      setLeader(parsed);
      fetchInitialData(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = async (leaderId) => {
    setLoading(true);
    try {
      const [membersRes, projectsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/team-lead/members?leaderId=${leaderId}`),
        axios.get(`${API_BASE}/api/projects`)
      ]);
      setTeamMembers(membersRes.data.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error("Error fetching initial dashboard data:", error);
      toast.error("Failed to load team metadata.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily tasks
  useEffect(() => {
    if (leader) {
      fetchDailyTasks();
      fetchAssignedTasks();
    }
  }, [leader, selectedDate]);

  // Real-time socket listeners
  useEffect(() => {
    if (!leader) return;

    const socket = io(window.location.host === 'localhost:3000' ? "http://localhost:8080" : "/", {
      transports: ["polling", "websocket"],
      withCredentials: true
    });

    socket.on("task-updated", () => {
      console.log("⚡ Real-time Task update received!");
      fetchDailyTasks();
      fetchAssignedTasks();
    });

    socket.on("target-updated", () => {
      console.log("⚡ Real-time Target update received!");
      fetchDailyTasks();
      fetchAssignedTasks();
    });

    socket.on("assigned-project-updated", () => {
      console.log("⚡ Real-time Project assignment update received!");
      fetchDailyTasks();
      fetchAssignedTasks();
    });

    return () => {
      socket.disconnect();
    };
  }, [leader, selectedDate]);

  const fetchDailyTasks = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/team-lead/daily-tasks?leaderId=${leader.id}&date=${selectedDate}`
      );
      setDailyTasks(res.data.data || []);
    } catch (error) {
      console.error("Error fetching daily tasks:", error);
    }
  };

  const fetchAssignedTasks = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/team-lead/assigned-tasks?leaderId=${leader.id}`
      );
      setAssignedTasks({
        devTasks: res.data.devTasks || [],
        targetTasks: res.data.targetTasks || []
      });
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
    }
  };

  const allAssignedTasks = useMemo(() => {
    const devs = (assignedTasks.devTasks || []).map(t => ({
      ...t,
      userId: t.user_id,
      normalizedStatus: t.status || 'Pending'
    }));
    const tgts = (assignedTasks.targetTasks || []).map(t => ({
      ...t,
      userId: t.employeeId,
      normalizedStatus: t.status || 'Pending'
    }));
    return [...devs, ...tgts];
  }, [assignedTasks]);

  // Calculations for Stats (Overview Page)
  const stats = useMemo(() => {
    let myTasks = 0;
    let completed = 0;
    let inProgress = 0;

    allAssignedTasks.forEach((t) => {
      if (String(t.userId) === String(leader?.id)) myTasks++;
      if (t.normalizedStatus.toLowerCase() === "completed" || t.normalizedStatus.toLowerCase() === "done") {
        completed++;
      } else {
        inProgress++;
      }
    });

    return {
      total: allAssignedTasks.length,
      myTasks,
      completed,
      inProgress
    };
  }, [allAssignedTasks, leader]);

  // Chart Data: Completed vs Active per member
  const barChartData = useMemo(() => {
    return teamMembers.map((m) => {
      const mTasks = allAssignedTasks.filter((t) => String(t.userId) === String(m.id));
      const completed = mTasks.filter((t) => t.normalizedStatus.toLowerCase() === "completed" || t.normalizedStatus.toLowerCase() === "done").length;
      const active = mTasks.length - completed;
      return {
        name: m.full_name.split(" ")[0],
        Completed: completed,
        Active: active
      };
    });
  }, [teamMembers, allAssignedTasks]);

  // Donut Chart Data
  const donutChartData = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let inPipeline = 0;
    let hold = 0;
    let pending = 0;

    allAssignedTasks.forEach((t) => {
      const status = t.normalizedStatus.toLowerCase();
      if (status === "completed" || status === "done") {
        completed++;
      } else if (status === "in progress" || status === "working") {
        inProgress++;
      } else if (status === "in pipeline") {
        inPipeline++;
      } else if (status === "hold") {
        hold++;
      } else {
        pending++;
      }
    });

    return [
      { name: "Completed", value: completed, color: "#10B981" },
      { name: "In Progress", value: inProgress, color: "#6366F1" },
      { name: "In Pipeline", value: inPipeline, color: "#3B82F6" },
      { name: "Hold", value: hold, color: "#F59E0B" },
      { name: "Pending", value: pending, color: "#94A3B8" }
    ];
  }, [allAssignedTasks]);

  // Filter Tasks list
  const filteredTasks = useMemo(() => {
    return dailyTasks.filter((t) => {
      const matchesSearch = t.TaskDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMember = memberFilter === "All" || String(t.user_id) === String(memberFilter);

      const st = t.status?.toLowerCase() || "";
      let matchesStatus = true;
      if (statusFilter === "Completed") {
        matchesStatus = st === "completed" || st === "done";
      } else if (statusFilter === "In Progress") {
        matchesStatus = st === "in progress" || st === "working";
      } else if (statusFilter === "To Do") {
        matchesStatus = st !== "completed" && st !== "done" && st !== "in progress" && st !== "working";
      }

      return matchesSearch && matchesMember && matchesStatus;
    });
  }, [dailyTasks, searchTerm, memberFilter, statusFilter]);

  const filteredAssignedDevTasks = useMemo(() => {
    if (!assignedTasks.devTasks) return [];
    if (assignedTaskMemberFilter === "All") return assignedTasks.devTasks;
    return assignedTasks.devTasks.filter(t => String(t.user_id) === String(assignedTaskMemberFilter));
  }, [assignedTasks.devTasks, assignedTaskMemberFilter]);

  const filteredAssignedTargetTasks = useMemo(() => {
    if (!assignedTasks.targetTasks) return [];
    if (assignedTaskMemberFilter === "All") return assignedTasks.targetTasks;
    return assignedTasks.targetTasks.filter(t => String(t.employeeId) === String(assignedTaskMemberFilter));
  }, [assignedTasks.targetTasks, assignedTaskMemberFilter]);

  // Calculate task completion details for Team tab
  const membersWithTaskStats = useMemo(() => {
    return teamMembers.map((m) => {
      const mTasks = dailyTasks.filter((t) => t.user_id === m.id);
      const done = mTasks.filter((t) => t.status?.toLowerCase() === "completed" || t.status === "done").length;
      const active = mTasks.length - done;
      const total = mTasks.length;
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

      const initials = m.full_name
        ? m.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "EM";

      return {
        ...m,
        initials,
        total,
        active,
        done,
        completionRate
      };
    });
  }, [teamMembers, dailyTasks]);

  const renderAvatar = (imgUrl, initials, sizeClass = "w-12 h-12", textClass = "text-sm") => {
    let src = null;
    if (imgUrl && typeof imgUrl === "string" && imgUrl.trim() !== "" && imgUrl !== "null" && imgUrl !== "undefined") {
      if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
        src = imgUrl;
      } else if (imgUrl.startsWith("/")) {
        src = `${API_BASE}${imgUrl}`;
      } else {
        src = `${API_BASE}/${imgUrl}`;
      }
    }

    return (
      <div className={`${sizeClass} rounded-xl shrink-0 relative overflow-hidden bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold ${textClass} shadow-sm border border-indigo-100/50`}>
        <span>{initials}</span>
        {src && (
          <img
            src={src}
            alt={initials}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
      </div>
    );
  };

  const handleFormChange = (e) => {
    setAssignForm({
      ...assignForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.employeeId) return toast.error("Please select a team member.");
    setAssignLoading(true);

    try {
      const isDev = leader.department?.toLowerCase() === "development";
      const payload = {
        leaderId: leader.id,
        employeeId: assignForm.employeeId,
        department: leader.department,
        projectId: assignForm.projectId,
        ProjectOrClientName: projects.find((p) => p.id == assignForm.projectId)?.name || "Task Assignment",
        note: assignForm.note
      };

      if (isDev) {
        payload.TaskDescription = assignForm.taskDescription;
        payload.task_date = assignForm.taskDate;
        payload.Category = "Development";
        payload.subCategory = "Task Assignment";
      } else {
        payload.month = assignForm.month;
        payload.year = assignForm.year;
        payload.targetPost = assignForm.targetPost || 0;
        payload.targetVideo = assignForm.targetVideo || 0;
        payload.targetShoot = assignForm.targetShoot || 0;
      }

      await axios.post(`${API_BASE}/api/team-lead/assign-task`, payload);
      toast.success("Task/Target assigned successfully!");

      setAssignForm({
        employeeId: "",
        projectId: "",
        taskDescription: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        targetPost: "",
        targetVideo: "",
        targetShoot: "",
        taskDate: new Date().toISOString().split("T")[0],
        note: ""
      });
      fetchDailyTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign task.");
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">Syncing Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">!</div>
          <h2 className="text-xl font-bold text-slate-800">Session not found</h2>
          <p className="text-slate-500 text-sm">Please log out and log in again with correct credentials.</p>
        </div>
      </div>
    );
  }

  const isDevLeader = leader.department?.toLowerCase() === "development";

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Breadcrumb Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>TeamFlow</span>
              <span>&gt;</span>
              <span className="text-indigo-600 capitalize">
                {activeTab.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Team Dashboard</h1>
            <p className="text-slate-500 text-xs">
              Welcome back, {leader.full_name}. Monitor efforts, view tasks, and assign targets.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" size={12} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setActiveTab("assign")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all duration-200"
            >
              <FaPlus size={10} /> New Task
            </button>
          </div>
        </div>

        {/* Tab View Contents */}
        <AnimatePresence mode="wait">

          {/* TAB 1: OVERVIEW INDEX */}
          {activeTab === "dashboard" && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Tasks</p>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.total}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Across all members</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm">
                    <FaFolder />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">My Tasks</p>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.myTasks}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Assigned to you</p>
                  </div>
                  <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center text-sm">
                    <FaUser />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Completed</p>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.completed}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-sm">
                    <FaCheckCircle />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">In Progress</p>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.inProgress}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Active right now</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-sm">
                    <FaClock />
                  </div>
                </div>
              </div>

              {/* Graphs Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Team Task Progress</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Completed vs. active tasks per member</p>
                  </div>

                  <div className="h-64">
                    {barChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No chart data available.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} barGap={4}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }} />
                          <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Active" fill="#6366F1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Task Distribution</h3>
                    <p className="text-slate-400 text-xs mt-0.5">By status</p>
                  </div>

                  <div className="h-44 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutChartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {donutChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Donut Legend */}
                  <div className="space-y-2">
                    {donutChartData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                          <span>{d.name}</span>
                        </div>
                        <span>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Tasks List */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm">Recent Tasks</h3>
                  <button onClick={() => setActiveTab("team_tasks")} className="text-xs font-black text-indigo-600 hover:text-indigo-700">View All</button>
                </div>

                <div className="divide-y divide-slate-100">
                  {dailyTasks.slice(0, 4).map((t) => {
                    const initials = t.full_name
                      ? t.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "EM";
                    const isCompleted = t.status?.toLowerCase() === "completed" || t.status === "Done";

                    return (
                      <div key={t.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {renderAvatar(t.profileIMG || teamMembers.find((m) => m.id === t.user_id)?.profileIMG, initials, "w-8 h-8", "text-xs")}
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{t.ProjectOrClientName}</h4>
                            <p className="text-[10px] text-slate-400 font-bold">{t.full_name} • {t.Category}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-100">
                            High
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${isCompleted
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-indigo-50 text-indigo-600 border-indigo-100"
                            }`}>
                            {t.status || "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: TEAM DAILY TASKS (LIST FORMAT) */}
          {activeTab === "team_tasks" && (
            <motion.div
              key="tab-team-tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search Filters Row */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="All">All Members</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Table List View of Tasks */}
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
                  <p className="text-slate-400 font-bold text-xs">No tasks found matching your filters.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="p-4 pl-6">Member</th>
                          <th className="p-4">Project & Task</th>
                          <th className="p-4">Tags</th>
                          <th className="p-4 text-center">Metrics</th>
                          <th className="p-4 text-center">Time</th>
                          <th className="p-4 text-center pr-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTasks.map((t) => {
                          const initials = t.full_name
                            ? t.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                            : "EM";
                          const isCompleted = t.status?.toLowerCase() === "completed" || t.status === "done";

                          return (
                            <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                              {/* Member */}
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                  {renderAvatar(t.profileIMG || teamMembers.find((m) => m.id === t.user_id)?.profileIMG, initials, "w-8 h-8", "text-xs")}
                                  <span className="text-xs font-bold text-slate-700">{t.full_name}</span>
                                </div>
                              </td>

                              {/* Project & Task */}
                              <td className="p-4 max-w-[350px]">
                                <h3 className="font-bold text-slate-800 text-xs truncate" title={t.ProjectOrClientName}>
                                  {t.ProjectOrClientName}
                                </h3>
                                <p className="text-slate-500 text-[10px] mt-0.5 line-clamp-2" title={t.TaskDescription}>
                                  {t.TaskDescription}
                                </p>
                              </td>

                              {/* Tags */}
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-2 py-0.5 rounded border border-rose-100">
                                    High
                                  </span>
                                  {t.Category && (
                                    <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded border border-blue-100 uppercase truncate max-w-[100px]" title={t.Category}>
                                      {t.Category}
                                    </span>
                                  )}
                                  {t.SubCategory && (
                                    <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded border border-slate-200 uppercase truncate max-w-[100px]" title={t.SubCategory}>
                                      {t.SubCategory}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Metrics */}
                              <td className="p-4 text-center">
                                {(t.postCount !== undefined || t.videoCount !== undefined || t.shootCount !== undefined) ? (
                                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
                                    <span title="Posts">P: <strong className="text-slate-700">{t.postCount || 0}</strong></span>
                                    <span title="Videos">V: <strong className="text-slate-700">{t.videoCount || 0}</strong></span>
                                    <span title="Shoots">S: <strong className="text-slate-700">{t.shootCount || 0}</strong></span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400">-</span>
                                )}
                              </td>

                              {/* Time */}
                              <td className="p-4 text-center">
                                <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                                  {t.ConsumingTimeInMin || 0} Mins
                                </span>
                              </td>

                              {/* Status */}
                              <td className="p-4 text-center pr-6">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${isCompleted
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                  }`}>
                                  {t.status || "Pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: TEAM MEMBERS (HIGH-FIDELITY LIST FORMAT VIEW) */}
          {activeTab === "team" && (
            <motion.div
              key="tab-team-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Team Members</h2>
                  <p className="text-slate-500 text-xs mt-0.5">{teamMembers.length} active department members</p>
                </div>
              </div>

              {/* Data Table List View */}
              {membersWithTaskStats.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
                  <p className="text-slate-400 font-bold text-xs">No team members registered.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="p-4 pl-6">Member</th>
                          <th className="p-4">Designation & Department</th>
                          <th className="p-4">Task Completion</th>
                          <th className="p-4 text-center">Total</th>
                          <th className="p-4 text-center">Active</th>
                          <th className="p-4 text-center">Done</th>
                          <th className="p-4 text-center pr-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {membersWithTaskStats.map((member) => {
                          const isSelf = member.id === leader?.id;
                          return (
                            <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                              {/* Avatar and Name */}
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-4">
                                  {renderAvatar(member.profileIMG, member.initials, "w-14 h-14", "text-base")}
                                  <div>
                                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                      {member.full_name}
                                      {isSelf && (
                                        <span className="bg-sky-100 text-sky-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                          Lead
                                        </span>
                                      )}
                                    </span>
                                    <p className="text-[10px] text-slate-400 font-bold">{member.email_id}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Designation & Dept */}
                              <td className="p-4">
                                <div className="text-xs font-bold text-slate-700">{member.designation}</div>
                                <div className="text-[10px] text-slate-400 font-bold capitalize">{member.department}</div>
                              </td>

                              {/* Completion progress bar */}
                              <td className="p-4 min-w-[200px]">
                                <div className="flex items-center gap-3">
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${member.completionRate}%` }}
                                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                    ></div>
                                  </div>
                                  <span className="text-xs font-black text-slate-600 shrink-0 w-8 text-right">
                                    {member.completionRate}%
                                  </span>
                                </div>
                              </td>

                              {/* Total Tasks */}
                              <td className="p-4 text-center text-xs font-extrabold text-slate-700">
                                {member.total}
                              </td>

                              {/* Active Tasks */}
                              <td className="p-4 text-center text-xs font-extrabold text-slate-700">
                                {member.active}
                              </td>

                              {/* Done Tasks */}
                              <td className="p-4 text-center text-xs font-extrabold text-indigo-600">
                                {member.done}
                              </td>

                              {/* Status Badge */}
                              <td className="p-4 text-center pr-6">
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-100">
                                  Active
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: ASSIGN TASK FORM */}
          {activeTab === "assign" && (
            <motion.div
              key="tab-assign"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
                <div className="mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg">
                    <FaPlus />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Assign New Task</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Deploy goals and specific guidelines to team members.</p>
                  </div>
                </div>

                <form onSubmit={handleAssignSubmit} className="space-y-5">

                  {/* Select Team Member */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Select Team Member
                    </label>
                    <select
                      name="employeeId"
                      value={assignForm.employeeId}
                      onChange={handleFormChange}
                      required
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="">Choose Employee...</option>
                      {teamMembers
                        .filter((m) => m.id !== leader?.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} ({m.designation})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Select Project */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Choose Project / Client
                    </label>
                    <select
                      name="projectId"
                      value={assignForm.projectId}
                      onChange={handleFormChange}
                      required
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="">Choose Project...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Fields */}
                  {isDevLeader ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Task Description / Deliverables
                        </label>
                        <textarea
                          name="taskDescription"
                          value={assignForm.taskDescription}
                          onChange={handleFormChange}
                          required
                          rows="4"
                          placeholder="Provide guidelines, links, or expectations..."
                          className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm placeholder:text-slate-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Deadline / Target Date
                        </label>
                        <input
                          type="date"
                          name="taskDate"
                          value={assignForm.taskDate}
                          onChange={handleFormChange}
                          required
                          className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm cursor-pointer"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Target Month
                          </label>
                          <select
                            name="month"
                            value={assignForm.month}
                            onChange={handleFormChange}
                            required
                            className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm appearance-none cursor-pointer"
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString("default", { month: "long" })}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Target Year
                          </label>
                          <select
                            name="year"
                            value={assignForm.year}
                            onChange={handleFormChange}
                            required
                            className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm appearance-none cursor-pointer"
                          >
                            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 tracking-wider ml-1">
                            Posts Target
                          </label>
                          <input
                            type="number"
                            name="targetPost"
                            placeholder="0"
                            min="0"
                            value={assignForm.targetPost}
                            onChange={handleFormChange}
                            className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 tracking-wider ml-1">
                            Videos Target
                          </label>
                          <input
                            type="number"
                            name="targetVideo"
                            placeholder="0"
                            min="0"
                            value={assignForm.targetVideo}
                            onChange={handleFormChange}
                            className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 tracking-wider ml-1">
                            Shoots Target
                          </label>
                          <input
                            type="number"
                            name="targetShoot"
                            placeholder="0"
                            min="0"
                            value={assignForm.targetShoot}
                            onChange={handleFormChange}
                            className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 mt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Remarks / Assignment Guidelines
                        </label>
                        <textarea
                          name="note"
                          value={assignForm.note}
                          onChange={handleFormChange}
                          rows="3"
                          placeholder="Provide guidelines, expectations, or note..."
                          className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 shadow-sm placeholder:text-slate-400"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={assignLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaPaperPlane size={12} /> {assignLoading ? "Deploying Task..." : "Assign Task"}
                  </button>

                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 5: ASSIGNED TASKS */}
          {activeTab === "assigned_tasks" && (
            <motion.div
              key="tab-assigned-tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Assigned Tasks Overview</h2>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Tasks & targets you've assigned to your team</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto shrink-0">
                    <select
                      value={assignedTaskMemberFilter}
                      onChange={(e) => setAssignedTaskMemberFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                    >
                      <option value="All">All Members</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Development Tasks */}
                  {filteredAssignedDevTasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-indigo-700 mb-3 border-b border-indigo-100 pb-2">Development Tasks</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project/Task</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAssignedDevTasks.map((t, idx) => (
                              <tr key={`dev-${t.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 text-xs font-bold text-slate-800">{t.employeeName}</td>
                                <td className="px-4 py-3">
                                  <div className="text-xs font-bold text-slate-800">{t.project_or_client_name}</div>
                                  <div className="text-[10px] text-slate-500 truncate max-w-xs">{t.task_description}</div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                                  {new Date(t.task_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    t.status?.toLowerCase() === 'completed' || t.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 
                                    t.status?.toLowerCase() === 'in progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {t.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 italic max-w-xs truncate">
                                  {t.status_note || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Target Tasks */}
                  {filteredAssignedTargetTasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-indigo-700 mb-3 border-b border-indigo-100 pb-2">Target Tasks (Marketing/SEO)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Month/Year</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Targets (P/V/S)</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Update Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAssignedTargetTasks.map((t, idx) => (
                              <tr key={`tgt-${t.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 text-xs font-bold text-slate-800">{t.employeeName}</td>
                                <td className="px-4 py-3 text-xs font-bold text-slate-800">{t.projectName || 'Marketing Project'}</td>
                                <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                                  {t.month}/{t.year}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600">
                                  Post: <span className="font-bold">{t.targetPost || 0}</span> | 
                                  Video: <span className="font-bold">{t.targetVideo || 0}</span> | 
                                  Shoot: <span className="font-bold">{t.targetShoot || 0}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    t.status?.toLowerCase() === 'completed' || t.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 
                                    t.status?.toLowerCase() === 'in progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {t.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 italic max-w-xs truncate">
                                  {t.status_note || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {filteredAssignedDevTasks.length === 0 && filteredAssignedTargetTasks.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-slate-400 text-sm font-medium">No tasks have been assigned to your team yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default LeaderDashboard;
