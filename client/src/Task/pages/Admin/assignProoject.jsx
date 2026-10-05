import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser, FaProjectDiagram, FaLayerGroup, FaChevronRight, FaChevronLeft,
  FaUserTag, FaTrashAlt, FaSearch, FaCalendarAlt, FaDatabase,
  FaImage, FaVideo, FaImages, FaPaintBrush, FaCamera, FaBullseye,
  FaChevronDown, FaTimes, FaUsers, FaBoxOpen,
  FaSpinner, FaBriefcase, FaFolderOpen
} from 'react-icons/fa';
import moment from 'moment';

const ProjectAssignmentForm = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Daily Work Count / Commitments (Special for Digital Marketing & Content Team)
  const [dailyPost, setDailyPost] = useState('');
  const [dailyVideo, setDailyVideo] = useState('');
  const [dailyCarousel, setDailyCarousel] = useState('');
  const [dailyCreative, setDailyCreative] = useState('');
  const [dailyShoot, setDailyShoot] = useState('');

  const totalDaily = useMemo(() => {
    return (
      (parseInt(dailyPost, 10) || 0) +
      (parseInt(dailyVideo, 10) || 0) +
      (parseInt(dailyCarousel, 10) || 0) +
      (parseInt(dailyCreative, 10) || 0) +
      (parseInt(dailyShoot, 10) || 0)
    );
  }, [dailyPost, dailyVideo, dailyCarousel, dailyCreative, dailyShoot]);

  useEffect(() => {
    fetchInitialData();
    fetchAssignments();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [userRes, projRes, catRes] = await Promise.all([
        axios.get(window.API_BASE + '/api/users'),
        axios.get(window.API_BASE + '/api/projects'),
        axios.get(window.API_BASE + '/api/category-list')
      ]);
      setUsers(userRes.data || []);
      setProjects(projRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      console.error('Master data sync error:', error);
      toast.error('Failed to sync master datasets');
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data } = await axios.get(window.API_BASE + '/api/getAllAssignments');
      setAssignments(data || []);
    } catch (error) {
      console.error('Fetch assignments error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return toast.error("Please select an employee");
    if (!selectedProject && !selectedCategory) {
      return toast.error("Please select either a Project or a Category");
    }

    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const loggedInUser = userStr ? JSON.parse(userStr) : null;
      const assignedBy = loggedInUser ? (loggedInUser.full_name || 'Admin') : 'Admin';

      const { data } = await axios.post(window.API_BASE + '/api/assignProject', {
        userId: selectedUser,
        projectId: selectedProject,
        categoryId: selectedCategory,
        assigned_by: assignedBy,
        daily_post: parseInt(dailyPost, 10) || 0,
        daily_video: parseInt(dailyVideo, 10) || 0,
        daily_carousel: parseInt(dailyCarousel, 10) || 0,
        daily_creative: parseInt(dailyCreative, 10) || 0,
        daily_shoot: parseInt(dailyShoot, 10) || 0
      });

      toast.success(data.message || 'Project assigned successfully!');
      setSelectedProject('');
      setSelectedCategory('');
      setDailyPost('');
      setDailyVideo('');
      setDailyCarousel('');
      setDailyCreative('');
      setDailyShoot('');
      fetchAssignments();
    } catch (error) {
      const msg = error.response?.data?.message || 'Assignment failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this assignment?")) return;
    try {
      await axios.delete(`${window.API_BASE}/api/deleteAssignment/${id}`);
      toast.success("Assignment removed successfully");
      fetchAssignments();
    } catch (error) {
      toast.error("Failed to delete assignment");
    }
  };

  // Only active employees, sorted alphabetically
  const activeUsers = useMemo(() => {
    return users
      .filter((u) => u.employment_status?.toLowerCase() === 'active')
      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }, [users]);

  // Overall Statistics for Top Bar
  const stats = useMemo(() => {
    const uniqueUsers = new Set(assignments.map(a => a.user_id)).size;
    const uniqueProjects = new Set(assignments.filter(a => a.project_id).map(a => a.project_id)).size;
    const totalDailyCommitments = assignments.reduce((acc, a) => {
      return (
        acc +
        (a.daily_post || 0) +
        (a.daily_video || 0) +
        (a.daily_carousel || 0) +
        (a.daily_creative || 0) +
        (a.daily_shoot || 0)
      );
    }, 0);

    return {
      totalAssignments: assignments.length,
      assignedUsers: uniqueUsers,
      activeProjects: uniqueProjects,
      totalDailyCommitments
    };
  }, [assignments]);

  // Filtered Assignments List
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        (a.user_name || '').toLowerCase().includes(s) ||
        (a.project_name || '').toLowerCase().includes(s) ||
        (a.category_name || '').toLowerCase().includes(s) ||
        (a.assigned_by || '').toLowerCase().includes(s);

      const matchesProject = filterProject ? String(a.project_id) === String(filterProject) : true;
      return matchesSearch && matchesProject;
    });
  }, [assignments, searchTerm, filterProject]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAssignments.length / rowsPerPage) || 1;
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAssignments.slice(start, start + rowsPerPage);
  }, [filteredAssignments, currentPage, rowsPerPage]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-6 lg:p-8 space-y-6">
      <div className="max-w-[1540px] mx-auto space-y-6">

        {/* ═══════════════════════════════════════════════
            HEADER & STAT CARDS
        ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100 flex-shrink-0">
                <FaProjectDiagram size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                    Project & Task Allocation
                  </h1>
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Admin Portal
                  </span>
                </div>
                <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">
                  Assign projects, categories & daily deliverables targets to active employees
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-slate-400 mb-0.5">
                  <FaBriefcase size={11} className="text-indigo-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Allocations</span>
                </div>
                <span className="text-xl font-black text-slate-800">{stats.totalAssignments}</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                  <FaUsers size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Staff</span>
                </div>
                <span className="text-xl font-black text-emerald-700">{stats.assignedUsers}</span>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-amber-600 mb-0.5">
                  <FaFolderOpen size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Projects Active</span>
                </div>
                <span className="text-xl font-black text-amber-700">{stats.activeProjects}</span>
              </div>

              <div className="bg-purple-50/60 border border-purple-100 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-purple-600 mb-0.5">
                  <FaBullseye size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Daily Output</span>
                </div>
                <span className="text-xl font-black text-purple-700">
                  {stats.totalDailyCommitments} <span className="text-[10px] font-bold text-purple-500 uppercase tracking-tight">/day</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            MAIN SPLIT GRID: FORM + REGISTRY
        ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ─────────────────────────────────────────────
              LEFT PANEL: ASSIGNMENT FORM (4 COLS)
          ───────────────────────────────────────────── */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Form Card Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                      <FaUserTag size={15} />
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">
                        Assign New Project
                      </h2>
                      <p className="text-slate-300 text-[11px] mt-0.5 font-medium">
                        Select employee & define targets
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">

                {/* 1. Target Active Employee */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <FaUser size={11} className="text-indigo-600" />
                      Select Employee <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {activeUsers.length} Active Staff
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer pr-9 shadow-xs"
                      required
                    >
                      <option value="">Choose an active employee...</option>
                      {activeUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} {u.department ? `(${u.department})` : ''}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={11} />
                  </div>
                </div>

                {/* 2. Project Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <FaProjectDiagram size={11} className="text-indigo-600" />
                      Project <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">{projects.length} Available</span>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer pr-9 shadow-xs"
                    >
                      <option value="">Independent Project (Optional)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={11} />
                  </div>
                </div>

                {/* 3. Category Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <FaLayerGroup size={11} className="text-indigo-600" />
                      Category <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">{categories.length} Available</span>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer pr-9 shadow-xs"
                    >
                      <option value="">Independent Category (Optional)</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={11} />
                  </div>
                </div>

                {/* 4. Daily Deliverables / Work Count Box */}
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div>
                      <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-tight">
                        <FaBullseye size={12} className="text-indigo-600" /> Daily Deliverables Target
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Post, Video, Carousel, Design & Shoot Counts
                      </p>
                    </div>
                    <span className="bg-indigo-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Per Day
                    </span>
                  </div>

                  {/* Primary 3 deliverables */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                        <FaImage size={10} className="text-blue-500" /> Posts
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={dailyPost}
                        onChange={(e) => setDailyPost(e.target.value)}
                        className="w-full text-sm font-black text-slate-800 outline-none bg-transparent"
                      />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all">
                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                        <FaVideo size={10} className="text-purple-500" /> Videos
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={dailyVideo}
                        onChange={(e) => setDailyVideo(e.target.value)}
                        className="w-full text-sm font-black text-slate-800 outline-none bg-transparent"
                      />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                        <FaImages size={10} className="text-amber-500" /> Carousel
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={dailyCarousel}
                        onChange={(e) => setDailyCarousel(e.target.value)}
                        className="w-full text-sm font-black text-slate-800 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Optional 2 deliverables */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1 focus-within:ring-2 focus-within:ring-pink-500/20 focus-within:border-pink-500 transition-all">
                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase truncate">
                        <FaPaintBrush size={10} className="text-pink-500 flex-shrink-0" /> Creative (Opt)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={dailyCreative}
                        onChange={(e) => setDailyCreative(e.target.value)}
                        className="w-full text-sm font-black text-slate-800 outline-none bg-transparent"
                      />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                        <FaCamera size={10} className="text-emerald-500" /> Shoot (Opt)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={dailyShoot}
                        onChange={(e) => setDailyShoot(e.target.value)}
                        className="w-full text-sm font-black text-slate-800 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Dynamic Output Calculation Card */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                        Total Daily Commitment
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        ~{totalDaily * 26} units / month (26 working days)
                      </span>
                    </div>
                    <div className="bg-white shadow-xs border border-indigo-200 px-3 py-1.5 rounded-xl text-center">
                      <span className="text-base font-black text-indigo-700 leading-none block">
                        {totalDaily}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block mt-0.5">
                        Units / Day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black py-3 rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" size={13} />
                      <span>Deploying Assignment...</span>
                    </>
                  ) : (
                    <>
                      <span>Execute Assignment</span>
                      <FaChevronRight size={10} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ─────────────────────────────────────────────
              RIGHT PANEL: REGISTRY TABLE (8 COLS)
          ───────────────────────────────────────────── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">

            {/* Table Search & Filter Toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                  <FaDatabase size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Active Allocations
                    <span className="bg-slate-100 text-slate-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                      {filteredAssignments.length} Records
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Live database of assigned projects & deliverable commitments
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Filter by Project */}
                <div className="relative">
                  <select
                    value={filterProject}
                    onChange={(e) => { setFilterProject(e.target.value); setCurrentPage(1); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all pr-8 cursor-pointer"
                  >
                    <option value="">All Projects</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                  <input
                    type="text"
                    placeholder="Search staff, project..."
                    className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all w-52 md:w-60"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <FaTimes size={10} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Assigned Entity</th>
                      <th className="px-4 py-3.5">Daily Deliverables</th>
                      <th className="px-4 py-3.5">Assigned On</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence mode="popLayout">
                      {paginatedAssignments.length > 0 ? paginatedAssignments.map((row) => {
                        const rowTotal = (row.daily_post || 0) + (row.daily_video || 0) + (row.daily_carousel || 0) + (row.daily_creative || 0) + (row.daily_shoot || 0);

                        return (
                          <motion.tr
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={row.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            {/* Employee column */}
                            <td className="px-4 py-3 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center flex-shrink-0 border border-indigo-200/50">
                                  {row.user_name ? row.user_name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-slate-800 block truncate">
                                    {row.user_name || `User #${row.user_id}`}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold block">
                                    ID: DOAG{row.user_id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Allocated Project / Category */}
                            <td className="px-4 py-3 align-middle">
                              <div className="space-y-1">
                                {row.project_name ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-black px-1.5 py-0.5 rounded">
                                      Project
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">
                                      {row.project_name}
                                    </span>
                                  </div>
                                ) : row.project_id && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                      Project #{row.project_id}
                                    </span>
                                  </div>
                                )}

                                {row.category_name ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-1.5 py-0.5 rounded">
                                      Category
                                    </span>
                                    <span className="text-xs font-medium text-slate-600">
                                      {row.category_name}
                                    </span>
                                  </div>
                                ) : row.category_id && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                      Category #{row.category_id}
                                    </span>
                                  </div>
                                )}

                                {!row.project_name && !row.category_name && !row.project_id && !row.category_id && (
                                  <span className="text-[10px] text-slate-400 font-bold italic">No Entity Linked</span>
                                )}
                              </div>
                            </td>

                            {/* Daily Deliverables column */}
                            <td className="px-4 py-3 align-middle">
                              {rowTotal > 0 ? (
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-1 max-w-[240px]">
                                    {row.daily_post > 0 && (
                                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <FaImage size={8} /> {row.daily_post} Post{row.daily_post > 1 ? 's' : ''}
                                      </span>
                                    )}
                                    {row.daily_video > 0 && (
                                      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <FaVideo size={8} /> {row.daily_video} Video{row.daily_video > 1 ? 's' : ''}
                                      </span>
                                    )}
                                    {row.daily_carousel > 0 && (
                                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <FaImages size={8} /> {row.daily_carousel} Carousel
                                      </span>
                                    )}
                                    {row.daily_creative > 0 && (
                                      <span className="bg-pink-50 text-pink-700 border border-pink-200 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <FaPaintBrush size={8} /> {row.daily_creative} Design
                                      </span>
                                    )}
                                    {row.daily_shoot > 0 && (
                                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <FaCamera size={8} /> {row.daily_shoot} Shoot
                                      </span>
                                    )}
                                  </div>
                                  <span className="inline-block text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Total: {rowTotal} / Day
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] font-semibold italic bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md inline-block">
                                  Standard Delivery
                                </span>
                              )}
                            </td>

                            {/* Date & Assigner */}
                            <td className="px-4 py-3 align-middle">
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <FaCalendarAlt size={10} className="text-slate-400" />
                                  {row.created_at ? moment(row.created_at).format("DD MMM, YYYY") : "N/A"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold block">
                                  By: {row.assigned_by || "Admin"}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 align-middle text-right">
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-xs ml-auto"
                                title="Terminate Assignment"
                              >
                                <FaTrashAlt size={11} />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                            <div className="max-w-xs mx-auto space-y-2">
                              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                                <FaBoxOpen size={20} />
                              </div>
                              <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                                No allocations found
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Try changing your search query or assign a project on the left.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* ═══════════════════════════════════════════════
                  PAGINATION CONTROLS
              ═══════════════════════════════════════════════ */}
              {filteredAssignments.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <span>Show</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                    <span className="text-slate-400 ml-1">
                      (Total {filteredAssignments.length} records)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FaChevronLeft size={9} /> Prev
                    </button>

                    <div className="px-3 py-1 font-bold text-slate-700 text-xs">
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Next <FaChevronRight size={9} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAssignmentForm;
