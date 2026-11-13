import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText,  
  Calendar,
  ChevronRight,
  TrendingUp,
  MoreVertical,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AdminHomePage = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reProjects, setReProjects] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchReProjects = async () => {
      try {
        const res = await axios.get((window.API_BASE || "") + "/api/re-projects", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data?.success && Array.isArray(res.data.data)) {
          setReProjects(res.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching RE projects:", err);
      }
    };

    fetchReProjects();

    const socket = window.adminSocket || io(window.API_BASE || process.env.REACT_APP_API_URL || "https://sf.doaguru.com", {
      transports: ["polling", "websocket"],
      withCredentials: true,
      secure: window.location.protocol === "https:",
    });

    if (socket) {
      if (typeof socket.emit === "function") {
        socket.emit("join_admin_room");
      }

      const handleProjectAssigned = (data) => {
        console.log("⚡ [adminHome] Live RE project received:", data);
        setReProjects((prev) => {
          const newEntry = {
            project_id: data.project_id,
            re_proforma_id: data.re_proforma_id,
            re_proforma_number: data.re_proforma_number || null,
            client_name: data.client_name,
            start_date: data.start_date,
            end_date: data.end_date,
            is_active: 1,
            total_tasks: data.tasks_created || 0,
            unassigned_tasks: data.tasks_created || 0,
            unassigned_tl_departments: data.unassigned_tl_departments || [],
            created_at: new Date().toISOString(),
          };
          const filtered = prev.filter((p) => p.project_id !== data.project_id);
          return [newEntry, ...filtered].slice(0, 3);
        });
      };

      const handleProjectUnarchived = ({ project_id }) => {
        setReProjects((prev) =>
          prev.map((p) => (Number(p.project_id) === Number(project_id) ? { ...p, is_active: 1 } : p))
        );
      };

      const handleProjectUpdated = () => {
        fetchReProjects();
      };

      socket.on("re:project_assigned", handleProjectAssigned);
      socket.on("re:project_updated", handleProjectUpdated);
      socket.on("re:project_unarchived", handleProjectUnarchived);

      return () => {
        socket.off("re:project_assigned", handleProjectAssigned);
        socket.off("re:project_updated", handleProjectUpdated);
        socket.off("re:project_unarchived", handleProjectUnarchived);
      };
    }
  }, []);

  const handleArchiveProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to archive this project? It will be marked inactive in Revenue Engine.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${window.API_BASE || process.env.REACT_APP_API_URL || "https://sf.doaguru.com"}/api/admin/re-project/${projectId}/mark-inactive`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.success) {
        toast.success("Project archived in Revenue Engine");
        setReProjects((prev) =>
          prev.map((p) => (p.project_id === projectId ? { ...p, is_active: 0 } : p))
        );
      } else {
        toast.error(res.data?.message || "Failed to archive project");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive project");
    }
  };

  const handleRestoreProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to restore this project to active?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${window.API_BASE || process.env.REACT_APP_API_URL || "https://sf.doaguru.com"}/api/admin/re-project/${projectId}/mark-active`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.success) {
        toast.success("Project restored to active");
        setReProjects((prev) =>
          prev.map((p) => (p.project_id === projectId ? { ...p, is_active: 1 } : p))
        );
      } else {
        toast.error(res.data?.message || "Failed to restore project");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore project");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        const [usersRes, projectsRes, leavesRes, attendanceRes, notificationsRes] = await Promise.all([
          axios.get(window.API_BASE + "/api/users"),
          axios.get(window.API_BASE + "/api/projects"),
          axios.get(window.API_BASE + "/api/getAllLeaveDataForAdmin"),
          axios.get(`${window.API_BASE}/api/getMonthlyAttendance/${month}/${year}`),
          axios.get(window.API_BASE + "/api/admin-notifications"),
        ]);

        setUsers(usersRes.data || []);
        setProjects(projectsRes.data || []);
        setLeaves(leavesRes.data || []);
        setAttendance(attendanceRes.data || []);
        setNotifications(notificationsRes.data?.notifications || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process data for charts
  const attendanceChartData = useMemo(() => {
    // Group attendance by date for the last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }).reverse();

    return last7Days.map(date => {
      const count = attendance.filter(a => a.attend_date === date).length;
      return { name: date.split("-").slice(0, 2).join("/"), value: count };
    });
  }, [attendance]);

  const projectStatusData = useMemo(() => {
    const active = projects.length;
    const completed = 12; // Placeholder
    const pending = 5; // Placeholder
    return [
      { name: "Active", value: active, color: "#3b82f6" },
      { name: "Completed", value: completed, color: "#10b981" },
      { name: "Pending", value: pending, color: "#f59e0b" },
    ];
  }, [projects]);

  const stats = [
    {
      title: "Employees",
      value: users.length,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      link: "/task/employee-show-register-page",
    },
    {
      title: "Projects",
      value: projects.length,
      icon: Briefcase,
      color: "bg-emerald-100 text-emerald-600",
      link: "/task/project-add",
    },
    {
      title: "Pending Leaves",
      value: leaves.filter(l => l.leave_status === "pending").length,
      icon: Clock,
      color: "bg-amber-100 text-amber-600",
      link: "/task/admin/employee-leave-report",
    },
    {
      title: "Attendance",
      value: attendance.filter(a => {
        const todayStr = new Date().toLocaleDateString("en-GB").split("/").join("-");
        return a.attend_date === todayStr;
      }).length,
      icon: CheckCircle,
      color: "bg-purple-100 text-purple-600",
      link: "/task/admin/employee-attendance-report",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-500 text-xs font-bold animate-pulse uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Daily Overview & Insights</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 shadow-sm self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-bold text-xs uppercase">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Sunday Login Governance Quick Banner */}
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-3.5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2 backdrop-blur-md">
            <Clock className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <span>Sunday Login Approval System</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                {new Date().getDay() === 0 ? "☀️ Today is Sunday" : "Mode 1 & Mode 2"}
              </span>
            </h4>
            <p className="text-xs text-amber-100/90 font-medium">
              Manage real-time Sunday login approval requests and schedule pre-approved employees with custom time windows.
            </p>
          </div>
        </div>
        <Link
          to="/task/admin/sunday-approvals"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-black text-slate-900 shadow hover:bg-amber-50 transition active:scale-95"
        >
          <span>Open Sunday Approvals</span>
          <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((stat, index) => (
          <Link key={index} to={stat.link} className="block group">
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group-hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-0.5 text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>2.4%</span>
                </div>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">{stat.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Attendance Chart */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Attendance Trends</h3>
              </div>
              <select className="bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 rounded-lg px-2 py-1 outline-none cursor-pointer uppercase hover:bg-slate-100">
                <option>7 Days</option>
                <option>30 Days</option>
              </select>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceChartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    dy={5}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px' }}
                    itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Link to="/task/employee-show-register-page" className="flex flex-col items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 group">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-none">Add Employee</span>
            </Link>
            <Link to="/task/project-add" className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 p-3 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all text-slate-700 shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-none">New Project</span>
            </Link>
            <Link to="/task/Employee-report" className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 p-3 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all text-slate-700 shadow-sm">
              <FileText className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-none">Reports</span>
            </Link>
          </div>

          {/* Pending Approvals Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Pending Leaves</h3>
              </div>
              <Link to="/task/admin/employee-leave-report" className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-700 transition-colors bg-blue-50 px-2 py-1 rounded-lg">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.filter(l => l.leave_status === "pending").slice(0, 3).map((leave, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600">
                            {leave.full_name?.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-700 text-xs">{leave.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500">{leave.leave_date}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link to="/task/admin/employee-leave-report" className="inline-flex items-center gap-1 text-blue-600 font-black text-[9px] uppercase tracking-tighter">
                          REVIEW <ChevronRight className="w-2.5 h-2.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {leaves.filter(l => l.leave_status === "pending").length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center">
                        <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest">No pending requests</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-4">
          {/* Project Distribution */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Project Health</h3>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {projectStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Feed</h3>
              <MoreVertical className="w-3.5 h-3.5 text-slate-300 cursor-pointer hover:text-slate-500" />
            </div>
            <div className="relative">
              <div className="absolute left-0.5 top-0 bottom-0 w-px bg-slate-100"></div>
              <div className="space-y-4 relative">
                {notifications.slice(0, 4).map((notif, idx) => (
                  <div key={idx} className="flex gap-3 relative pl-4">
                    <div className={`absolute left-[-2px] mt-1.5 w-1.5 h-1.5 rounded-full z-10 ${notif.is_read ? 'bg-slate-200' : 'bg-blue-500'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-600 font-bold leading-tight truncate">
                        <span className="text-slate-900 font-black">{notif.user_name}</span> {notif.message}
                      </p>
                      <p className="text-[9px] font-black text-slate-300 uppercase mt-1 tracking-tighter">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-4 flex flex-col items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-100" />
                    <p className="text-[9px] font-black text-slate-300 uppercase">Clear Feed</p>
                  </div>
                )}
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all border border-slate-50">
              Show More
            </button>
          </div>
        </div>
      </div>

      {/* ── New from Revenue Engine Live Queue (TASK 3) ─────────────── */}
      <div className="mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              New from Revenue Engine
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Live Push Active • Top 3 Recent
          </span>
        </div>

        {reProjects.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-wider border border-dashed border-slate-200 rounded-xl">
            No projects from Revenue Engine yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {reProjects.map((p) => (
              <div
                key={p.project_id || p.re_proforma_id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {p.re_proforma_number ? p.re_proforma_number : `Proforma #${p.re_proforma_id}`}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      ID #{p.project_id}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight truncate">
                    {p.client_name}
                  </h4>
                  <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                    <div>
                      <span className="font-bold text-slate-700">Tasks:</span>{" "}
                      {p.total_tasks} total ({p.unassigned_tasks} unassigned)
                    </div>
                    {(p.start_date || p.end_date) && (
                      <div className="text-[10px] text-slate-400">
                        {p.start_date || "N/A"} → {p.end_date || "N/A"}
                      </div>
                    )}
                    {p.unassigned_tl_departments && p.unassigned_tl_departments.length > 0 && (
                      <div className="mt-2 text-[10px] bg-rose-50 text-rose-800 px-2 py-1 rounded-md border border-rose-200 flex items-center font-bold">
                        <span className="mr-1">⚠️</span>
                        <span>TL not assigned for {p.unassigned_tl_departments.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className={`inline-flex items-center gap-1 font-bold ${p.is_active === 0 ? "text-slate-400" : "text-emerald-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.is_active === 0 ? "bg-slate-400" : "bg-emerald-500"}`}></span>
                    {p.is_active === 0 ? "Archived" : "Live"}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.is_active !== 0 ? (
                      <button
                        onClick={() => handleArchiveProject(p.project_id)}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-0.5 rounded bg-rose-50 border border-rose-100 transition-all"
                      >
                        Archive Project
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestoreProject(p.project_id)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 transition-all"
                      >
                        Restore Project
                      </button>
                    )}
                    <span className="text-slate-400 font-medium">
                      {p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHomePage;
