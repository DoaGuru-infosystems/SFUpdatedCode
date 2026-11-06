import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { io } from "socket.io-client";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Briefcase,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  Search,
  RefreshCw,
  Folder,
  Layers,
  User,
  Eye,
  X,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileText,
  RotateCcw,
  Building,
  UserPlus,
  Zap,
  Edit3,
} from "lucide-react";

const localizer = momentLocalizer(moment);

const getApiBase = () => {
  return window.API_BASE || process.env.REACT_APP_API_URL || "https://sf.doaguru.com";
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-300",
    dot: "bg-emerald-500",
    calColor: "#10b981",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
    dot: "bg-blue-500",
    calColor: "#3b82f6",
  },
  blocked: {
    label: "Blocked",
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-300",
    dot: "bg-rose-500",
    calColor: "#ef4444",
  },
  assigned: {
    label: "Assigned",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-400",
    calColor: "#64748b",
  },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default function RevenueEngineProjects() {
  const navigate = useNavigate();

  // Primary data state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'calendar'

  // Per-project drilldown
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [projectSubTab, setProjectSubTab] = useState("tasks"); // 'tasks' (default) | 'calendar'
  const [expandedTaskMap, setExpandedTaskMap] = useState({});

  const toggleTaskExpand = (taskOwnersId) => {
    setExpandedTaskMap((prev) => ({
      ...prev,
      [taskOwnersId]: !prev[taskOwnersId],
    }));
  };

  // Work log drilldown
  const [selectedTask, setSelectedTask] = useState(null);
  const [workLogs, setWorkLogs] = useState([]);
  const [loadingWorkLogs, setLoadingWorkLogs] = useState(false);

  // Popover for global calendar bar click
  const [popoverProject, setPopoverProject] = useState(null);

  // Full image preview modal
  const [previewImage, setPreviewImage] = useState(null);

  // Live socket status
  const [socketConnected, setSocketConnected] = useState(false);

  // Phase G Direct Assignment State (GM / MD)
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);

  // Modal 1: Assign Departments
  const [deptModalProject, setDeptModalProject] = useState(null);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [savingDept, setSavingDept] = useState(false);

  // Modal 2: Direct Assign PO
  const [poModalProject, setPoModalProject] = useState(null);
  const [selectedPoEmpId, setSelectedPoEmpId] = useState("");
  const [savingPo, setSavingPo] = useState(false);

  // Modal 3: Direct Assign / Reassign Task Owner
  const [taskModalTask, setTaskModalTask] = useState(null);
  const [taskModalProjectId, setTaskModalProjectId] = useState(null);
  const [selectedTaskEmpId, setSelectedTaskEmpId] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  // Fetch departments & active employees on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [dRes, eRes] = await Promise.all([
          axios.get(`${getApiBase()}/api/admin/departments`, { headers: getAuthHeaders() }),
          axios.get(`${getApiBase()}/api/users`, { headers: getAuthHeaders() }),
        ]);
        if (dRes.data && dRes.data.success) {
          setAvailableDepartments(dRes.data.data || []);
        }
        if (Array.isArray(eRes.data)) {
          setAvailableEmployees(eRes.data.filter((u) => u.employment_status !== "inactive"));
        }
      } catch (err) {
        console.error("Error fetching depts/users metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  const handleOpenDeptModal = (proj) => {
    setDeptModalProject(proj);
    const existing = (proj.assigned_departments || []).map((d) => d.department_id);
    setSelectedDeptIds(existing);
  };

  const handleToggleDeptId = (id) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleSaveDepartments = async () => {
    if (!deptModalProject) return;
    if (selectedDeptIds.length === 0) {
      toast.error("Please select at least one department");
      return;
    }
    try {
      setSavingDept(true);
      const res = await axios.post(
        `${getApiBase()}/api/admin/re-project/${deptModalProject.project_id}/assign-departments`,
        { department_ids: selectedDeptIds },
        { headers: getAuthHeaders() }
      );
      if (res.data && res.data.success) {
        toast.success("Departments assigned successfully! TLs notified.");
        setDeptModalProject(null);
        fetchProjects();
        if (selectedProject && selectedProject.project_id === deptModalProject.project_id) {
          fetchProjectTasks(deptModalProject.project_id);
        }
      }
    } catch (err) {
      console.error("Error assigning departments:", err);
      toast.error(err.response?.data?.message || "Failed to assign departments");
    } finally {
      setSavingDept(false);
    }
  };

  const handleOpenPoModal = (proj) => {
    setPoModalProject(proj);
    setSelectedPoEmpId(proj.project_owner?.employee_id ? String(proj.project_owner.employee_id) : "");
  };

  const handleSavePo = async () => {
    if (!poModalProject || !selectedPoEmpId) {
      toast.error("Please select an employee to be Project Owner");
      return;
    }
    try {
      setSavingPo(true);
      const res = await axios.post(
        `${getApiBase()}/api/admin/re-project/${poModalProject.project_id}/direct-assign-po`,
        { employee_id: Number(selectedPoEmpId) },
        { headers: getAuthHeaders() }
      );
      if (res.data && res.data.success) {
        toast.success("Project Owner directly assigned! PO notified via WhatsApp.");
        setPoModalProject(null);
        fetchProjects();
        if (selectedProject && selectedProject.project_id === poModalProject.project_id) {
          fetchProjectTasks(poModalProject.project_id);
        }
      }
    } catch (err) {
      console.error("Error assigning PO:", err);
      toast.error(err.response?.data?.message || "Failed to assign Project Owner");
    } finally {
      setSavingPo(false);
    }
  };

  const handleOpenTaskModal = (task, projectId, defaultDeadline) => {
    setTaskModalTask(task);
    setTaskModalProjectId(projectId);
    setSelectedTaskEmpId(task.employee_id ? String(task.employee_id) : "");
    setTaskDeadline(task.deadline ? String(task.deadline).substring(0, 10) : (defaultDeadline || ""));
    setTaskDescription(task.description || "");
  };

  const handleSaveTask = async () => {
    if (!taskModalTask || !taskModalProjectId || !selectedTaskEmpId) {
      toast.error("Please select an employee for this task");
      return;
    }
    try {
      setSavingTask(true);
      const res = await axios.post(
        `${getApiBase()}/api/admin/re-project/${taskModalProjectId}/direct-assign-task-owner`,
        {
          task_id: taskModalTask.task_owners_id,
          employee_id: Number(selectedTaskEmpId),
          deadline: taskDeadline || null,
          description: taskDescription || null,
        },
        { headers: getAuthHeaders() }
      );
      if (res.data && res.data.success) {
        toast.success("Task Owner assigned directly! Task owner notified.");
        setTaskModalTask(null);
        setTaskDescription("");
        fetchProjectTasks(taskModalProjectId);
        fetchProjects();
      }
    } catch (err) {
      console.error("Error assigning task:", err);
      toast.error(err.response?.data?.message || "Failed to assign task");
    } finally {
      setSavingTask(false);
    }
  };

  // 1. Auth Guard (Admin / GM Only)
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/task/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin" && user.role !== "gm") {
        navigate("/task/UserHome");
      }
    } catch (e) {
      navigate("/task/login");
    }
  }, [navigate]);

  // 2. Fetch Projects List (always fetches full list so metrics include true archived counts)
  const fetchProjects = useCallback(async (showToast = false) => {
    try {
      if (!showToast) setLoading(true);
      const url = `${getApiBase()}/api/admin/re-projects?include_archived=true`;
      const res = await axios.get(url, { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        setProjects(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch RE projects:", err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        toast.error("Access denied. Admin or GM role required.");
        navigate("/task/login");
      } else {
        toast.error("Could not load RE projects");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 3. Fetch Tasks for Selected Project
  const fetchProjectTasks = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      setLoadingTasks(true);
      const res = await axios.get(`${getApiBase()}/api/admin/re-project/${projectId}/tasks`, {
        headers: getAuthHeaders(),
      });
      if (res.data && res.data.success) {
        setProjectTasks(res.data.data.tasks || []);
        setSelectedProject((prev) => (prev ? { ...prev, ...res.data.data } : res.data.data));
      }
    } catch (err) {
      console.error("Failed to fetch project tasks:", err);
      toast.error("Could not load tasks for project");
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // 4. Fetch Work Logs for Selected Task
  const fetchWorkLogs = useCallback(async (taskOwnersId) => {
    if (!taskOwnersId) return;
    try {
      setLoadingWorkLogs(true);
      const res = await axios.get(`${getApiBase()}/api/admin/re-task/${taskOwnersId}/work-log`, {
        headers: getAuthHeaders(),
      });
      if (res.data && res.data.success) {
        setWorkLogs(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch work log:", err);
      toast.error("Could not load work log");
    } finally {
      setLoadingWorkLogs(false);
    }
  }, []);

  // 5. Socket.io Live Sync
  useEffect(() => {
    const socket = window.adminSocket || io(getApiBase(), {
      transports: ["polling", "websocket"],
      withCredentials: true,
      secure: window.location.protocol === "https:",
    });

    socket.emit("join_admin_room");
    setSocketConnected(true);

    let syncDebounceTimer = null;
    const handleLiveSync = (payload) => {
      console.log("[Live Socket Sync] Received event in admin_room:", payload);
      if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
      syncDebounceTimer = setTimeout(() => {
        toast.success("Live Update received from Revenue Engine", {
          id: "re-live-update",
          icon: "⚡",
          duration: 3500,
        });

        fetchProjects(true);

        if (selectedProject?.project_id) {
          fetchProjectTasks(selectedProject.project_id);
        }

        if (selectedTask?.task_owners_id) {
          fetchWorkLogs(selectedTask.task_owners_id);
        }
      }, 300);
    };

    socket.on("re:task_status_changed", handleLiveSync);
    socket.on("re:project_assigned", handleLiveSync);
    socket.on("re:task_assigned", handleLiveSync);
    socket.on("re:task_unassigned", handleLiveSync);
    socket.on("re:project_archived", handleLiveSync);
    socket.on("re:project_unarchived", handleLiveSync);

    return () => {
      if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
      socket.off("re:task_status_changed", handleLiveSync);
      socket.off("re:project_assigned", handleLiveSync);
      socket.off("re:task_assigned", handleLiveSync);
      socket.off("re:task_unassigned", handleLiveSync);
      socket.off("re:project_archived", handleLiveSync);
      socket.off("re:project_unarchived", handleLiveSync);
    };
  }, [fetchProjects, selectedProject?.project_id, fetchProjectTasks, selectedTask?.task_owners_id, fetchWorkLogs]);

  // Open Project Drilldown
  const handleOpenProject = (project) => {
    setPopoverProject(null);
    setSelectedProject(project);
    setProjectSubTab("tasks");
    setExpandedTaskMap({});
    fetchProjectTasks(project.project_id);
  };

  // Open Work Log Drilldown
  const handleOpenWorkLog = (task) => {
    setSelectedTask(task);
    fetchWorkLogs(task.task_owners_id);
  };

  // Mark Project Inactive
  const handleMarkInactive = async (projectId, clientName) => {
    if (!window.confirm(`Are you sure you want to mark project "${clientName}" as inactive / archived?`)) {
      return;
    }
    try {
      const res = await axios.post(
        `${getApiBase()}/api/admin/re-project/${projectId}/mark-inactive`,
        {},
        { headers: getAuthHeaders() }
      );
      if (res.data?.success) {
        toast.success(`Project "${clientName}" marked inactive`);
        fetchProjects();
        if (selectedProject?.project_id === projectId) {
          setSelectedProject((prev) => (prev ? { ...prev, is_active: false } : null));
        }
      }
    } catch (err) {
      console.error("Error marking project inactive:", err);
      toast.error(err.response?.data?.message || "Failed to mark project inactive");
    }
  };

  // Mark Project Active / Restore
  const handleMarkActive = async (projectId, clientName) => {
    if (!window.confirm(`Are you sure you want to restore project "${clientName}" to active?`)) {
      return;
    }
    try {
      const res = await axios.post(
        `${getApiBase()}/api/admin/re-project/${projectId}/mark-active`,
        {},
        { headers: getAuthHeaders() }
      );
      if (res.data?.success) {
        toast.success(`Project "${clientName}" restored to active`);
        fetchProjects();
        if (selectedProject?.project_id === projectId) {
          setSelectedProject((prev) => (prev ? { ...prev, is_active: true } : null));
        }
      }
    } catch (err) {
      console.error("Error restoring project:", err);
      toast.error(err.response?.data?.message || "Failed to restore project");
    }
  };

  // Filtered Projects for List and Calendar
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        (p.client_name && p.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.re_proforma_number && p.re_proforma_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.re_proforma_id && String(p.re_proforma_id).includes(searchQuery.trim())) ||
        (p.project_id && String(p.project_id).includes(searchQuery.trim()));

      if (!matchesSearch) return false;

      // When "Archived Only" is selected: strictly show only inactive projects
      if (statusFilter === "archived") {
        return !p.is_active;
      }

      // When a specific active status is selected
      if (statusFilter !== "all" && p.current_status !== statusFilter) {
        return false;
      }

      // If user is viewing active projects without checking "Include Inactive / Archived", hide inactive
      if (!includeArchived && !p.is_active) {
        return false;
      }

      return true;
    });
  }, [projects, searchQuery, statusFilter, includeArchived]);

  // Global Calendar Events
  const globalCalendarEvents = useMemo(() => {
    return filteredProjects.map((p) => {
      const start = p.start_date
        ? moment(p.start_date, "YYYY-MM-DD").startOf("day").toDate()
        : new Date();
      const end = p.end_date
        ? moment(p.end_date, "YYYY-MM-DD").endOf("day").toDate()
        : moment(start).add(1, "day").toDate();

      return {
        id: p.project_id,
        title: `${p.client_name} • ${p.current_status?.toUpperCase()} (${p.completed_tasks}/${p.total_tasks})`,
        start,
        end,
        allDay: true,
        resource: p,
      };
    });
  }, [filteredProjects]);

  // Per-Project Calendar Events (Task Deadlines as Point Events)
  const perProjectCalendarEvents = useMemo(() => {
    return projectTasks.map((t) => {
      const d = t.deadline
        ? moment(t.deadline, "YYYY-MM-DD").startOf("day").toDate()
        : new Date();
      return {
        id: t.task_owners_id,
        title: `[${t.category || "Task"}] ${t.task_name} (${t.assignee_name || "Unassigned"})`,
        start: d,
        end: d,
        allDay: true,
        resource: t,
      };
    });
  }, [projectTasks]);

  // Event Prop Getters for Styling
  const projectEventPropGetter = (event) => {
    const status = event.resource?.current_status || "assigned";
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
    return {
      style: {
        backgroundColor: cfg.calColor,
        color: "#ffffff",
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "0.825rem",
        fontWeight: "600",
        border: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        cursor: "pointer",
      },
    };
  };

  const taskEventPropGetter = (event) => {
    const status = event.resource?.status || "assigned";
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
    return {
      style: {
        backgroundColor: cfg.calColor,
        color: "#ffffff",
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "0.825rem",
        fontWeight: "600",
        border: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        cursor: "pointer",
      },
    };
  };

  // Metrics Summary
  const metrics = useMemo(() => {
    const activeProjects = projects.filter((p) => p.is_active);
    const total = activeProjects.length;
    const completed = activeProjects.filter((p) => p.current_status === "completed").length;
    const inProgress = activeProjects.filter((p) => p.current_status === "in_progress").length;
    const blocked = activeProjects.filter((p) => p.current_status === "blocked").length;
    const archived = projects.filter((p) => !p.is_active).length;
    return { total, completed, inProgress, blocked, archived };
  }, [projects]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link to="/task/Admin-Home-page" className="hover:text-blue-600 flex items-center">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-medium">RE Projects</span>
              </div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                  <Layers className="w-6 h-6 mr-2 text-blue-600" />
                  Revenue Engine Projects
                </h1>
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {metrics.total} Synced
                </span>
                {socketConnected && (
                  <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                    Live Sync
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full executive visibility across all departments and task lifecycles.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 self-start md:self-auto">
              <button
                onClick={() => setActiveTab("list")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center ${
                  activeTab === "list"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Briefcase className="w-4 h-4 mr-1.5" />
                Projects List
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center ${
                  activeTab === "calendar"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <CalendarIcon className="w-4 h-4 mr-1.5" />
                Global Monthly Calendar
              </button>
              <button
                onClick={() => fetchProjects(true)}
                title="Refresh Projects"
                className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div
            onClick={() => {
              setStatusFilter("all");
              setIncludeArchived(false);
            }}
            className={`bg-white p-4 rounded-xl border shadow-xs cursor-pointer hover:border-blue-400 transition-all ${
              statusFilter === "all" && !includeArchived ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Synced</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active projects</div>
          </div>

          <div
            onClick={() => {
              setStatusFilter("in_progress");
              setIncludeArchived(false);
            }}
            className={`bg-white p-4 rounded-xl border shadow-xs cursor-pointer hover:border-blue-400 transition-all ${
              statusFilter === "in_progress" ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>In Progress</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-2">{metrics.inProgress}</div>
            <div className="text-[11px] text-blue-500 mt-0.5">Active execution</div>
          </div>

          <div
            onClick={() => {
              setStatusFilter("completed");
              setIncludeArchived(false);
            }}
            className={`bg-white p-4 rounded-xl border shadow-xs cursor-pointer hover:border-emerald-400 transition-all ${
              statusFilter === "completed" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Completed</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">{metrics.completed}</div>
            <div className="text-[11px] text-emerald-500 mt-0.5">All tasks finished</div>
          </div>

          <div
            onClick={() => {
              setStatusFilter("blocked");
              setIncludeArchived(false);
            }}
            className={`bg-white p-4 rounded-xl border shadow-xs cursor-pointer hover:border-rose-400 transition-all ${
              statusFilter === "blocked" ? "ring-2 ring-rose-500 border-rose-500" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Blocked</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-2">{metrics.blocked}</div>
            <div className="text-[11px] text-rose-500 mt-0.5">Needs intervention</div>
          </div>

          <div
            onClick={() => {
              setStatusFilter("archived");
              setIncludeArchived(true);
            }}
            className={`bg-white p-4 rounded-xl border shadow-xs cursor-pointer hover:border-slate-400 transition-all ${
              statusFilter === "archived" ? "ring-2 ring-slate-600 border-slate-600" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Archived</span>
              <Archive className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-600 mt-2">{metrics.archived}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Inactive projects</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, proforma ID, or project ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  if (val === "archived") {
                    setIncludeArchived(true);
                  }
                }}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Active Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="archived">Archived Only</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>Include Inactive / Archived</span>
            </label>
          </div>
        </div>

        {/* ─── TAB 1: PROJECTS LIST VIEW ─── */}
        {activeTab === "list" && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-blue-500" />
                <p className="text-sm font-medium">Loading Revenue Engine projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                <Folder className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No Projects Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters or search query."
                    : "No projects have been synced from Revenue Engine yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((p) => {
                  const progressPct =
                    p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0;

                  return (
                    <div
                      key={p.project_id}
                      className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between group ${
                        p.is_active ? "border-slate-200 hover:border-blue-300" : "border-slate-200 bg-slate-50/70 opacity-80"
                      }`}
                    >
                      <div
                        className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-t-xl"
                        onClick={() => handleOpenProject(p)}
                        title="Click card to open task list drill-down"
                      >
                        {/* Header: Client & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate" title={p.client_name}>
                              {p.client_name}
                            </h3>
                            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                              <span>{p.re_proforma_number ? p.re_proforma_number : `Proforma #${p.re_proforma_id}`}</span>
                              <span>•</span>
                              <span>SF #{p.project_id}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <StatusBadge status={p.current_status} />
                            {!p.is_active && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                Archived
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <div className="flex items-center space-x-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {p.start_date || "N/A"} → {p.end_date || "N/A"}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {p.end_date && moment(p.end_date).isBefore(moment(), "day") && p.current_status !== "completed" ? (
                              <span className="text-rose-600 font-semibold">Overdue</span>
                            ) : (
                              `${p.total_tasks} Tasks`
                            )}
                          </span>
                        </div>

                                                {/* Departments Section */}
                        <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 overflow-hidden flex-1 mr-2">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">Depts:</span>
                            {p.assigned_departments && p.assigned_departments.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {p.assigned_departments.map((d) => (
                                  <span key={d.department_id} className="bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-blue-200">
                                    {d.department_name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Auto-derived</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeptModal(p);
                            }}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 shrink-0 hover:underline"
                          >
                            {p.assigned_departments && p.assigned_departments.length > 0 ? "Edit" : "+ Assign"}
                          </button>
                        </div>

                        {/* Project Owner (PO) Section */}
                        <div className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 min-w-0 flex-1 mr-2">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">PO:</span>
                            {p.project_owner ? (
                              <span className="text-slate-900 font-medium truncate flex items-center">
                                {p.project_owner.employee_name}
                                {p.project_owner.assigned_by_gm && (
                                  <span className="ml-1 bg-amber-100 text-amber-800 text-[9px] font-bold px-1 py-0.2 rounded border border-amber-300">
                                    ⚡ GM
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-rose-500 font-medium text-[11px]">No PO Assigned</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPoModal(p);
                            }}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 shrink-0 hover:underline"
                          >
                            {p.project_owner ? "Change" : "+ Assign PO"}
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-500 font-medium">Task Completion</span>
                            <span className="font-semibold text-slate-700">
                              {p.completed_tasks} / {p.total_tasks} ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                p.current_status === "completed"
                                  ? "bg-emerald-500"
                                  : p.current_status === "blocked"
                                  ? "bg-rose-500"
                                  : "bg-blue-600"
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Unassigned Warning */}
                        {p.unassigned_tasks > 0 && (
                          <div className="mt-3 text-xs bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
                            <span>
                              {p.unassigned_tasks} task{p.unassigned_tasks > 1 ? "s" : ""} unassigned
                            </span>
                          </div>
                        )}

                        {/* No-TL Department Warning */}
                        {p.unassigned_tl_departments && p.unassigned_tl_departments.length > 0 && (
                          <div className="mt-2 text-xs bg-rose-50 text-rose-800 px-2.5 py-1.5 rounded-lg border border-rose-200 flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600 shrink-0" />
                            <span className="font-semibold">
                              ⚠️ Team Lead not assigned for {p.unassigned_tl_departments.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between">
                        <button
                          onClick={() => handleOpenProject(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          View Tasks Drill-Down
                          <ChevronRight className="w-3 h-3 -ml-0.5" />
                        </button>

                        {p.is_active ? (
                          <button
                            onClick={() => handleMarkInactive(p.project_id, p.client_name)}
                            title="Mark project as inactive/archived"
                            className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center"
                          >
                            <Archive className="w-3.5 h-3.5 mr-1" />
                            Archive
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 italic">Inactive</span>
                            <button
                              onClick={() => handleMarkActive(p.project_id, p.client_name)}
                              title="Restore project to active"
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition flex items-center shadow-sm"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Restore
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: GLOBAL MONTHLY CALENDAR ─── */}
        {activeTab === "calendar" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Monthly Executive Schedule
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Spanning bars indicate full project durations from start to end date. Click any bar for details.
                </p>
              </div>

              {/* Status Color Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded bg-slate-500 mr-1.5" /> Assigned
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded bg-blue-500 mr-1.5" /> In Progress
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded bg-emerald-500 mr-1.5" /> Completed
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded bg-rose-500 mr-1.5" /> Blocked
                </span>
              </div>
            </div>

            <div style={{ height: "640px" }} className="re-global-calendar">
              <Calendar
                localizer={localizer}
                events={globalCalendarEvents}
                startAccessor="start"
                endAccessor="end"
                defaultView="month"
                views={["month", "agenda"]}
                eventPropGetter={projectEventPropGetter}
                onSelectEvent={(event) => setPopoverProject(event.resource)}
                popup
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: LIGHTWEIGHT POPOVER (Global Calendar Click) ─── */}
      {popoverProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-lg text-slate-900">{popoverProject.client_name}</h3>
                  <StatusBadge status={popoverProject.current_status} />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {popoverProject.re_proforma_number ? popoverProject.re_proforma_number : `Proforma #${popoverProject.re_proforma_id}`} • Project ID #{popoverProject.project_id}
                </div>
              </div>
              <button
                onClick={() => setPopoverProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Start Date</span>
                  <span className="font-semibold text-slate-800">{popoverProject.start_date || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">End Date</span>
                  <span className="font-semibold text-slate-800">{popoverProject.end_date || "N/A"}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-800">
                    {popoverProject.completed_tasks} / {popoverProject.total_tasks} completed
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{
                      width: `${
                        popoverProject.total_tasks > 0
                          ? (popoverProject.completed_tasks / popoverProject.total_tasks) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setPopoverProject(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={() => handleOpenProject(popoverProject)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center"
              >
                Open Full Breakdown
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: FULL PER-PROJECT DRILLDOWN ─── */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto"
          style={{ zIndex: 50 }}
        >
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold tracking-tight">{selectedProject.client_name}</h2>
                  <StatusBadge status={selectedProject.current_status} />
                  {!selectedProject.is_active && (
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                  <span>{selectedProject.re_proforma_number ? selectedProject.re_proforma_number : `Proforma #${selectedProject.re_proforma_id}`}</span>
                  <span>•</span>
                  <span>SF #{selectedProject.project_id}</span>
                  <span>•</span>
                  <span>
                    Schedule: {selectedProject.start_date || "N/A"} → {selectedProject.end_date || "N/A"}
                  </span>
                </div>
              
                <div className="flex flex-wrap items-center gap-3 text-xs mt-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">PO:</span>
                    <span className="font-semibold text-white">
                      {selectedProject.project_owner?.employee_name || "None"}
                    </span>
                    {selectedProject.project_owner?.assigned_by_gm && (
                      <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        ⚡ GM
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenPoModal(selectedProject)}
                      className="text-blue-400 hover:text-blue-300 font-medium ml-1 underline"
                    >
                      {selectedProject.project_owner ? "Change" : "Assign"}
                    </button>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">Departments:</span>
                    <span className="text-slate-300">
                      {(selectedProject.assigned_departments || []).map((d) => d.department_name).join(", ") || "Auto-derived"}
                    </span>
                    <button
                      onClick={() => handleOpenDeptModal(selectedProject)}
                      className="text-blue-400 hover:text-blue-300 font-medium ml-1 underline"
                    >
                      Manage
                    </button>
                  </div>
                </div></div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sub-Tabs: Project Tasks vs Calendar */}
            <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setProjectSubTab("tasks")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center ${
                    projectSubTab === "tasks"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  All Department Tasks ({projectTasks.length})
                </button>
                <button
                  onClick={() => setProjectSubTab("calendar")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center ${
                    projectSubTab === "calendar"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                  Deadline Overview (Calendar)
                </button>
              </div>

              <button
                onClick={() => fetchProjectTasks(selectedProject.project_id)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingTasks ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingTasks ? (
                <div className="p-16 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-blue-500" />
                  <p className="text-sm font-medium">Loading project tasks...</p>
                </div>
              ) : projectTasks.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <Folder className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No tasks found for this project.</p>
                </div>
              ) : projectSubTab === "calendar" ? (
                /* Per-Project Deadline Calendar */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Point events show task deadlines across all departments. Click any event to inspect daily work logs.
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1" /> Completed
                      </span>
                      <span className="flex items-center">
                        <span className="w-2.5 h-2.5 rounded bg-blue-500 mr-1" /> In Progress
                      </span>
                      <span className="flex items-center">
                        <span className="w-2.5 h-2.5 rounded bg-rose-500 mr-1" /> Blocked
                      </span>
                    </div>
                  </div>

                  <div style={{ height: "480px" }}>
                    <Calendar
                      localizer={localizer}
                      events={perProjectCalendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                      defaultView="month"
                      views={["month", "agenda"]}
                      eventPropGetter={taskEventPropGetter}
                      onSelectEvent={(event) => handleOpenWorkLog(event.resource)}
                      popup
                    />
                  </div>
                </div>
              ) : (
                /* Cross-Department Tasks Table with Expandable Daily Activity Logs */
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Task / RE Item</th>
                        <th className="px-4 py-3">Department / Cat</th>
                        <th className="px-4 py-3">Assignee</th>
                        <th className="px-4 py-3">Deadline</th>
                        <th className="px-4 py-3">Current Status</th>
                        <th className="px-4 py-3 text-right">Daily Logs / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {projectTasks.map((t) => {
                        const isExpanded = Boolean(expandedTaskMap[t.task_owners_id]);
                        const logs = t.work_logs || [];

                        return (
                          <React.Fragment key={t.task_owners_id}>
                            <tr className={`hover:bg-slate-50 transition ${isExpanded ? "bg-slate-50/70" : ""}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-start gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskExpand(t.task_owners_id)}
                                    title={isExpanded ? "Collapse daily logs" : "Expand daily logs"}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded transition mt-0.5"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                  <div>
                                    <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                      <span>{t.task_name}</span>
                                      {logs.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                                          {logs.length} {logs.length === 1 ? "log" : "logs"}
                                        </span>
                                      )}
                                    </div>
                                    {t.description && (
                                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                                        {t.description}
                                      </div>
                                    )}
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      SF: {t.sf_task_id || `ID #${t.task_owners_id}`}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                  {t.category || t.assignee_department || "General"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {t.assignee_name ? (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-slate-900 flex items-center">
                                        <User className="w-3 h-3 mr-1 text-slate-400" />
                                        {t.assignee_name}
                                        {t.assigned_by_gm && (
                                          <span className="ml-1.5 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-300">
                                            ⚡ GM
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400">
                                        {t.assignee_role || t.assignee_department || "Staff"}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-2">
                                      <button
                                        onClick={() => handleOpenTaskModal(t, selectedProject.project_id, selectedProject.end_date)}
                                        className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md transition flex items-center gap-1"
                                        title="Click to extend deadline or reassign"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        Extend / Reassign
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                                      Unassigned
                                    </span>
                                    <button
                                      onClick={() => handleOpenTaskModal(t, selectedProject.project_id, selectedProject.end_date)}
                                      className="ml-2 inline-flex items-center text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded shadow-xs transition"
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      Assign
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600">
                                <button
                                  type="button"
                                  onClick={() => handleOpenTaskModal(t, selectedProject.project_id, selectedProject.end_date)}
                                  className="group inline-flex items-center gap-1.5 hover:bg-blue-50 px-2 py-1 rounded transition text-left cursor-pointer"
                                  title="Click to extend or change deadline"
                                >
                                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                                    {t.deadline || "None"}
                                  </span>
                                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={t.status} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskExpand(t.task_owners_id)}
                                    className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                                      isExpanded
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                    }`}
                                  >
                                    <FileText className="w-3.5 h-3.5 mr-1" />
                                    {isExpanded ? "Hide Logs" : `Logs (${logs.length})`}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* ─── Expandable Daily Activity Logs Drilldown ─── */}
                            {isExpanded && (
                              <tr key={`expanded-${t.task_owners_id}`} className="bg-slate-50/80">
                                <td colSpan="6" className="p-4 border-y border-slate-200">
                                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-600" />
                                        <span className="font-bold text-slate-800 text-xs">
                                          Daily Activity Logs for: <span className="text-indigo-600">{t.task_name}</span>
                                        </span>
                                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                                          {logs.length} {logs.length === 1 ? "entry" : "entries"}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenWorkLog(t)}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Detailed Modal View
                                      </button>
                                    </div>

                                    {logs.length > 0 ? (
                                      <div className="space-y-2.5">
                                        {logs.map((log, lIdx) => (
                                          <div
                                            key={log.task_log_id || lIdx}
                                            className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                                          >
                                            <div className="space-y-1.5 flex-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-slate-900 flex items-center">
                                                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                                  {log.task_date || "N/A"}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="font-medium text-slate-700 flex items-center">
                                                  <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                                  {log.employee_name || t.assignee_name || "Staff"}
                                                </span>
                                              </div>
                                              <p className="text-slate-700 font-normal whitespace-pre-wrap">
                                                {log.description}
                                              </p>
                                              {log.task_image && (
                                                <div className="mt-2">
                                                  <img
                                                    src={
                                                      log.task_image.startsWith("http")
                                                        ? log.task_image
                                                        : `${getApiBase()}/${log.task_image.replace(/^\/+/, "")}`
                                                    }
                                                    alt="Task attachment"
                                                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition"
                                                    onClick={() =>
                                                      setPreviewImage(
                                                        log.task_image.startsWith("http")
                                                          ? log.task_image
                                                          : `${getApiBase()}/${log.task_image.replace(/^\/+/, "")}`
                                                      )
                                                    }
                                                  />
                                                </div>
                                              )}
                                            </div>
                                            <div className="shrink-0 flex items-center gap-1.5 self-start bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                                Status on this date:
                                              </span>
                                              <StatusBadge status={log.entry_status} />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                        No daily progress logged yet for this task.
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                Close Project Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: WORK LOG DRILLDOWN ─── */}
      {selectedTask &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/60 p-4"
            style={{ zIndex: 60 }}
            onClick={() => setSelectedTask(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 bg-slate-900 text-white flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold">{selectedTask.task_name}</h3>
                    <StatusBadge status={selectedTask.status} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                    <span>Assignee: {selectedTask.assignee_name || "Unassigned"}</span>
                    <span>•</span>
                    <span>Deadline: {selectedTask.deadline || "N/A"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            {/* Work Log Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                  Daily Work Log Entries ({workLogs.length})
                </h4>
                <button
                  onClick={() => fetchWorkLogs(selectedTask.task_owners_id)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingWorkLogs ? "animate-spin" : ""}`} />
                  Refresh Logs
                </button>
              </div>

              {loadingWorkLogs ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-blue-500" />
                  <p className="text-xs">Loading employee work logs...</p>
                </div>
              ) : workLogs.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500 border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No work logged yet against this task.</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When the assignee logs tasks in the daily task form, entries will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workLogs.map((log) => {
                    const imageUrl = log.task_image
                      ? log.task_image.startsWith("http")
                        ? log.task_image
                        : `${getApiBase()}/${log.task_image.replace(/^\/+/, "")}`
                      : null;

                    return (
                      <div
                        key={log.task_log_id}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs border-b border-slate-100 pb-2 mb-2 gap-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900">{log.employee_name || "Employee"}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-mono text-slate-500">{log.task_date || "Date N/A"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {log.consuming_time_min > 0 && (
                              <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                <Clock className="w-3 h-3 mr-1" />
                                {log.consuming_time_min} mins
                              </span>
                            )}
                            {log.category && (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {log.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {log.description || "No description entered."}
                        </p>

                        {/* Output Metrics (Posts, Videos, Shoots) */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          {log.post_count > 0 && (
                            <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                              Posts: {log.post_count}
                            </span>
                          )}
                          {log.video_count > 0 && (
                            <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                              Videos: {log.video_count}
                            </span>
                          )}
                          {log.shoot_count > 0 && (
                            <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                              Shoots: {log.shoot_count}
                            </span>
                          )}
                        </div>

                        {/* Image Attachment */}
                        {imageUrl && (
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setPreviewImage(imageUrl)}
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium group"
                            >
                              <img
                                src={imageUrl}
                                alt="Work log attachment"
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 mr-2 group-hover:opacity-90"
                              />
                              <span>View Attached Image</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                Close Work Log
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 5: ASSIGN DEPARTMENTS (GM/MD) ─── */}
      {deptModalProject &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
            style={{ zIndex: 60 }}
            onClick={() => setDeptModalProject(null)}
          >
            <div
              className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center">
                  <Building className="w-4 h-4 mr-2 text-blue-600" />
                  Assign Departments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{deptModalProject.client_name}</p>
              </div>
              <button
                onClick={() => setDeptModalProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-600">
                Select one or more departments to explicitly route this project. Department Team Leads will be notified via WhatsApp.
              </p>
              <div className="space-y-2 mt-2">
                {availableDepartments.map((dept) => {
                  const isChecked = selectedDeptIds.includes(dept.id);
                  return (
                    <div
                      key={dept.id}
                      onClick={() => handleToggleDeptId(dept.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                        isChecked
                          ? "bg-blue-50 border-blue-400 text-blue-900"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold">{dept.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {dept.tl_name ? `TL: ${dept.tl_name}` : "No TL set"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeptModalProject(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDepartments}
                disabled={savingDept}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center disabled:opacity-50"
              >
                {savingDept ? "Saving..." : "Save Departments"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 6: DIRECT ASSIGN PROJECT OWNER (GM/MD) ─── */}
      {poModalProject &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
            style={{ zIndex: 60 }}
            onClick={() => setPoModalProject(null)}
          >
            <div
              className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center">
                    <UserPlus className="w-4 h-4 mr-2 text-blue-600" />
                    Direct Assign Project Owner (PO)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{poModalProject.client_name}</p>
                </div>
                <button
                  onClick={() => setPoModalProject(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-600">
                  As GM/MD, you can directly assign an employee from <strong>any department</strong> to be the Project Owner (PO), bypassing TL bottlenecks.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Employee:
                  </label>
                  <select
                    value={selectedPoEmpId}
                    onChange={(e) => setSelectedPoEmpId(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Active Employee --</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.department || "No Dept"} • {emp.designation || emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setPoModalProject(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePo}
                  disabled={savingPo || !selectedPoEmpId}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center disabled:opacity-50"
                >
                  {savingPo ? "Assigning..." : "Assign as PO"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL 7: DIRECT ASSIGN / REASSIGN TASK OWNER (GM/MD) ─── */}
      {taskModalTask &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
            style={{ zIndex: 60 }}
            onClick={() => setTaskModalTask(null)}
          >
            <div
              className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center">
                    {taskModalTask.employee_id ? (
                      <Edit3 className="w-4 h-4 mr-2 text-blue-600" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2 text-amber-500" />
                    )}
                    {taskModalTask.employee_id
                      ? "Extend Deadline / Reassign Task"
                      : "Direct Assign Task Owner"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{taskModalTask.task_name}</p>
                </div>
                <button
                  onClick={() => setTaskModalTask(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold text-slate-700">{taskModalTask.category || "General"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Assignee:</span>
                    <span className="font-semibold text-slate-700">{taskModalTask.assignee_name || "Unassigned"}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign To (Any Department):
                  </label>
                  <select
                    value={selectedTaskEmpId}
                    onChange={(e) => setSelectedTaskEmpId(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Active Employee --</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.department || "No Dept"} • {emp.designation || emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Task Deadline:</span>
                    <span className="text-[10px] text-blue-600 font-bold">Select future date to extend</span>
                  </label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Task Description / Instructions:
                  </label>
                  <textarea
                    rows={3}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Enter task guidelines, scope or notes..."
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setTaskModalTask(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTask}
                  disabled={savingTask || !selectedTaskEmpId}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center disabled:opacity-50"
                >
                  {savingTask
                    ? "Saving..."
                    : taskModalTask.employee_id
                    ? "Update Deadline / Assignment"
                    : "Save Assignment"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL 4: FULLSCREEN IMAGE PREVIEW ─── */}
      {previewImage &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/80 p-4"
            style={{ zIndex: 70 }}
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewImage}
                alt="Full preview"
                className="max-h-[85vh] w-auto rounded-lg shadow-2xl object-contain"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
