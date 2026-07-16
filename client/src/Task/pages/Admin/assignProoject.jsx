import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser, FaProjectDiagram, FaLayerGroup, FaChevronRight,
  FaUserTag, FaHandPointer, FaTrashAlt,
  FaSearch, FaCalendarAlt, FaDatabase
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
  const [loading, setLoading] = useState(false);

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
      setUsers(userRes.data);
      setProjects(projRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Migration Sync Error:', error);
      toast.error('Failed to sync master datasets');
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data } = await axios.get(window.API_BASE + '/api/getAllAssignments');
      setAssignments(data);
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return toast.error("User selection is mandatory");
    if (!selectedProject && !selectedCategory) {
      return toast.error("Select either a Project or a Category to proceed");
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
        assigned_by: assignedBy
      });
      toast.success(data.message || 'Entity deployment successful!');
      setSelectedProject('');
      setSelectedCategory('');
      fetchAssignments();
    } catch (error) {
      const msg = error.response?.data?.message || 'Assignment failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to terminate this assignment?")) return;
    try {
      await axios.delete(`${window.API_BASE}/api/deleteAssignment/${id}`);
      toast.success("Assignment terminated");
      fetchAssignments();
    } catch (error) {
      toast.error("Cleanup failed");
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a =>
      a.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assignments, searchTerm]);

  const selectStyles = "w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-xs font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-600 outline-none transition-all appearance-none cursor-pointer text-slate-700 shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4"
        >
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden sticky top-8">
            <div className="bg-slate-900 px-6 py-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <FaUserTag className="text-indigo-400" size={16} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200/60">Logic Deployment</span>
                </div>
                <h2 className="text-xl font-black tracking-tight">Assignment Tool</h2>
              </div>
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl"></div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* User Select */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <FaUser size={9} className="text-indigo-500" /> Target Professional
                </label>
                <div className="relative">
                  <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className={selectStyles}>
                    <option value="">Select User...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
              </div>

              {/* Project Select */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <FaProjectDiagram size={9} className="text-indigo-500" /> Project Registry
                </label>
                <div className="relative">
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className={selectStyles}>
                    <option value="">Independent Project (Optional)</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <FaLayerGroup size={9} className="text-indigo-500" /> Classification Layer
                </label>
                <div className="relative">
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={selectStyles}>
                    <option value="">Independent Category (Optional)</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? "PROCESSING..." : <><span>EXECUTE ASSIGNMENT</span><FaChevronRight size={10} /></>}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 space-y-6"
        >
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <FaDatabase size={18} />
                </div>
                Deployment Registry
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Tracking Active Professional Allocations</p>
            </div>

            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={14} />
              <input
                type="text"
                placeholder="Search Registry..."
                className="pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 focus:ring-4 focus:ring-indigo-50 outline-none w-full md:w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-3">Professional</th>
                    <th className="px-6 py-3">Allocated Entity</th>
                    <th className="px-6 py-3">Deployment Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredAssignments.length > 0 ? filteredAssignments.map((row) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={row.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-[10px] font-black">
                              {row.user_name?.charAt(0) || "U"}
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase">
                              {row.user_name || `User ID #${row.user_id}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 space-y-1">
                          {row.project_name ? (
                            <div className="flex items-center gap-2">
                              <span className="bg-indigo-600 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Project</span>
                              <span className="text-[11px] font-bold text-slate-600">{row.project_name}</span>
                            </div>
                          ) : row.project_id && (
                            <div className="flex items-center gap-2">
                              <span className="bg-indigo-400 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Project</span>
                              <span className="text-[11px] font-bold text-slate-400">ID: #{row.project_id}</span>
                            </div>
                          )}
                          {row.category_name ? (
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-500 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Category</span>
                              <span className="text-[11px] font-bold text-slate-600">{row.category_name}</span>
                            </div>
                          ) : row.category_id && (
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-400 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Category</span>
                              <span className="text-[11px] font-bold text-slate-400">ID: #{row.category_id}</span>
                            </div>
                          )}
                          {!row.project_name && !row.category_name && !row.project_id && !row.category_id && (
                            <span className="text-[9px] text-slate-300 font-black italic">NO ENTITIES</span>
                          )}
                        </td>
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                            <FaCalendarAlt size={10} />
                            {row.created_at ? moment(row.created_at).format("DD MMM, YYYY") : "No Date"}
                          </div>
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                            title="Terminate Assignment"
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-300 font-black text-xs uppercase tracking-widest italic">No deployments found in registry</td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectAssignmentForm;
