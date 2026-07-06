import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaProjectDiagram, FaLayerGroup, FaTags, FaPlus, FaEdit, FaTrash,
  FaSearch, FaChevronLeft, FaChevronRight, FaBoxOpen, FaInfoCircle
} from "react-icons/fa";
import EditModal from "../../components/EditModal";

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, catRes] = await Promise.all([
        axios.get('https://sf.doaguru.com/api/projects'),
        axios.get('https://sf.doaguru.com/api/category-list')
      ]);

      setProjects(projRes.data);
      setCategories(catRes.data);

      const allSubcategories = [];
      const subPromises = catRes.data.map(cat =>
        axios.get(`https://sf.doaguru.com/api/sub-category-list?category_id=${cat.id}`)
      );

      const subResults = await Promise.all(subPromises);
      subResults.forEach(res => allSubcategories.push(...res.data));
      setSubcategories(allSubcategories);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to sync project data");
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    let data = [];
    if (activeTab === 'projects') data = projects;
    else if (activeTab === 'categories') data = categories;
    else if (activeTab === 'subcategories') data = subcategories;

    return data.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toString().includes(searchTerm);
      if (activeTab === 'projects' && filterDepartment) {
        const itemDepts = item.department ? item.department.toLowerCase() : "";
        return matchesSearch && itemDepts.includes(filterDepartment.toLowerCase());
      }
      return matchesSearch;
    }).sort((a, b) => b.id - a.id); // Newest first
  }, [activeTab, projects, categories, subcategories, searchTerm, filterDepartment]);

  // Pagination Logic
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleEditClick = (item, type) => {
    setModalData(item);
    setModalType(type);
  };

  const handleEditSubmit = async (updatedData) => {
    try {
      await axios.post(`https://sf.doaguru.com/api/update-${modalType}`, updatedData);
      toast.success(`${modalType} updated successfully`);
      fetchData();
      setModalData(null);
    } catch (error) {
      toast.error(`Failed to update ${modalType}`);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to remove this ${type}?`)) return;
    try {
      await axios.post(`https://sf.doaguru.com/api/delete-${type === 'categories' ? 'categorys' : type}`, { id });
      toast.success(`${type} removed successfully`);
      fetchData();
    } catch (error) {
      toast.error(type === 'subcategory' ? "Could not delete: dependent subcategories exist" : "Deletion failed");
    }
  };

  const tabs = [
    { id: 'projects', label: 'Projects', icon: <FaProjectDiagram />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'categories', label: 'Categories', icon: <FaLayerGroup />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'subcategories', label: 'Sub-Categories', icon: <FaTags />, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 flex-shrink-0">
              <FaBoxOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Project Taxonomy</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Global Management Dashboard</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'projects' && (
              <select
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm cursor-pointer text-slate-600"
                value={filterDepartment}
                onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Departments</option>
                <option value="development">Development</option>
                <option value="digital marketing">Digital Marketing</option>
                <option value="seo">SEO</option>
                <option value="management">Management</option>
                <option value="sales">Sales</option>
              </select>
            )}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
              <input
                type="text"
                placeholder="Search Identity..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none w-56 shadow-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Link
              to="/task/AddProject"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 text-xs"
            >
              <FaPlus /> ADD NEW
            </Link>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-max max-w-full overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === tab.id ? `${tab.bg} ${tab.color} shadow-sm ring-1 ring-slate-100` : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              {tab.icon} {tab.label}
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-white shadow-inner' : 'bg-slate-100 opacity-60'}`}>
                {tab.id === 'projects' ? projects.length : tab.id === 'categories' ? categories.length : subcategories.length}
              </span>
            </button>
          ))}
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-2.5">S.No</th>
                  <th className="px-6 py-2.5">Internal ID</th>
                  <th className="px-6 py-2.5">Display Name</th>
                  {activeTab === 'projects' && <th className="px-6 py-2.5">Department</th>}
                  {activeTab === 'subcategories' && <th className="px-6 py-2.5">Parent Category</th>}
                  <th className="px-6 py-2.5 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td colSpan="6" className="px-6 py-40 text-center text-slate-300 font-bold italic animate-pulse">Syncing dataset details...</td>
                    </motion.tr>
                  ) : paginatedData.length === 0 ? (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td colSpan="6" className="px-6 py-40 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-200">
                          <FaBoxOpen size={40} />
                          <p className="text-sm font-bold italic">No {activeTab} defined for this search.</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-2.5 text-[10px] font-black text-slate-300">{(index + 1 + (currentPage - 1) * rowsPerPage).toString().padStart(2, '0')}</td>
                        <td className="px-6 py-2.5">
                          <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-black tracking-tighter shadow-inner">
                            #{item.id}
                          </span>
                        </td>
                        <td className="px-6 py-2.5">
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.name}</p>
                        </td>
                        {activeTab === 'projects' && (
                          <td className="px-6 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {item.department ? item.department.split(',').map((dept, idx) => (
                                <span key={idx} className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase bg-emerald-50/50 px-2.5 py-1 rounded-full w-max border border-emerald-100/50 shadow-sm">
                                  {dept.trim()}
                                </span>
                              )) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase bg-emerald-50/50 px-2.5 py-1 rounded-full w-max border border-emerald-100/50 shadow-sm">
                                  UNASSIGNED
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {activeTab === 'subcategories' && (
                          <td className="px-6 py-2.5">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase bg-indigo-50/50 px-2.5 py-1 rounded-full w-max border border-indigo-100/50 shadow-sm">
                              <FaLayerGroup size={10} /> Parent ID #{item.category_id}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-2.5 text-right">
                          <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditClick(item, activeTab === 'categories' ? 'category' : activeTab === 'projects' ? 'projects' : 'subcategory')}
                              className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                              title="Modify Registry"
                            >
                              <FaEdit size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, activeTab)}
                              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                              title="Remove Entry"
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

          <div className="mt-auto p-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page</span>
              <select
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black outline-none focus:ring-1 focus:ring-indigo-600"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
              >
                {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                >
                  <FaChevronLeft size={10} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Legend/Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tabs.map(tab => (
            <div key={tab.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className={`w-10 h-10 ${tab.bg} ${tab.color} rounded-xl flex items-center justify-center text-lg`}>
                {tab.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{tab.label}</p>
                <p className="text-lg font-black text-slate-800">{tab.id === 'projects' ? projects.length : tab.id === 'categories' ? categories.length : subcategories.length}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditModal
        show={modalData !== null}
        onClose={() => setModalData(null)}
        onSubmit={handleEditSubmit}
        item={modalData}
        type={modalType}
      />
    </div>
  );
}

export default ProjectsPage;
