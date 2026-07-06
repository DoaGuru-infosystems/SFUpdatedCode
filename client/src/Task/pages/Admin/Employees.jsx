import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUserPlus,
  FaFileExcel,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaCalendarPlus,
  FaArrowLeft,
  FaArrowRight,
  FaFilter,
  FaTimes,
  FaChartPie,
  FaMoneyBillWave
} from "react-icons/fa";
import * as XLSX from "xlsx";

const EmployeePage = ({ userRole }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:8080/api/users");
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updatedData = {
        id: selectedEmployee.id,
        full_name: selectedEmployee.full_name,
        designation: selectedEmployee.designation,
        email_id: selectedEmployee.email_id,
        mobile_number: selectedEmployee.mobile_number,
        employment_status: selectedEmployee.employment_status,
        salary_amount: selectedEmployee.salary_amount,
      };

      await axios.put(`http://localhost:8080/api/Update-Employee-Details`, updatedData);
      setUsers(users.map(u => u.id === selectedEmployee.id ? { ...u, ...updatedData } : u));
      setIsModalOpen(false);
      alert("Employee details updated successfully.");
    } catch (error) {
      alert("Failed to update employee details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      setDeletingId(id);
      try {
        await axios.delete(`http://localhost:8080/api/delete-employee/${id}`);
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        alert("Failed to delete the employee.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const s = searchText.toLowerCase();
      const searchMatch =
        user.full_name?.toLowerCase().includes(s) ||
        user.email_id?.toLowerCase().includes(s) ||
        user.mobile_number?.includes(s) ||
        user.id?.toString().includes(s);
      const statusMatch = statusFilter === "all" || user.employment_status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [users, searchText, statusFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.employment_status === "active").length,
    inactive: users.filter(u => u.employment_status === "inactive").length,
    newJoiners: users.filter(u => {
      const joinDate = new Date(u.joiningDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return joinDate >= thirtyDaysAgo;
    }).length
  }), [users]);


  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const exportToExcel = () => {
    const exportData = filteredUsers.map((user, index) => ({
      "S.No.": index + 1,
      "Employee ID": `DOAG${user.id}`,
      "Full Name": user.full_name || "-",
      "Designation": user.designation || "-",
      "Email ID": user.email_id || "-",
      "Mobile No.": user.mobile_number || "-",
      "Status": user.employment_status || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `Personnel_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-5">
      <div className="max-w-[1700px] mx-auto space-y-4">

        {/* ═══ Compact Header ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
              <FaUsers size={20} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-800 leading-tight">Workforce Matrix</h1>
              <p className="text-slate-500 font-medium text-[11px] uppercase tracking-tighter">Personnel Directory & Control Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Link
              to="/task/registerUser"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 text-xs"
            >
              <FaUserPlus size={14} /> Register
            </Link>
            <button
              onClick={exportToExcel}
              disabled={filteredUsers.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 text-xs shadow-sm disabled:opacity-30"
            >
              <FaFileExcel size={14} /> Export
            </button>
          </div>
        </div>

        {/* ═══ Compressed Stats ═══ */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            {[
              { label: "Active", val: stats.active, color: "text-emerald-600", bg: "bg-emerald-50", icon: <FaUserCheck /> },
              { label: "Inactive", val: stats.inactive, color: "text-rose-600", bg: "bg-rose-50", icon: <FaUserTimes /> },
              { label: "Joiners", val: stats.newJoiners, color: "text-amber-600", bg: "bg-amber-50", icon: <FaCalendarPlus /> },
              { label: "Global", val: stats.total, color: "text-indigo-600", bg: "bg-indigo-50", icon: <FaUsers /> }
            ].map((s, i) => (
              <div key={i} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
                <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center text-lg shadow-inner flex-shrink-0`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5 truncate">{s.label}</p>
                  <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/task/admin/workforce-insights"
            target="_blank"
            className="lg:w-48 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            <div className="p-2 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
              <FaChartPie size={18} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">View Data</p>
              <p className="text-xs font-bold opacity-80 leading-none">Salary Insights</p>
            </div>
          </Link>
        </div>

        {/* ═══ Slim Control Bar ═══ */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1 block px-1">Discovery</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search personnel..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1 block px-1">Engagement</label>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 text-xs appearance-none cursor-pointer"
              >
                <option value="all">Every Personnel</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Staff</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1 block px-1">View Density</label>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs appearance-none cursor-pointer"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} Per Page</option>)}
              </select>
            </div>
            <button
              onClick={handleResetFilters}
              className="h-8 w-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              title="Reset Filters"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>

        {/* ═══ High-Density Personnel Matrix ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-3 py-3 border-b border-slate-100">Identity</th>
                  <th className="px-3 py-3 border-b border-slate-100">Department</th>
                  <th className="px-3 py-3 border-b border-slate-100">Role</th>
                  <th className="px-3 py-3 border-b border-slate-100">Contact & History</th>
                  {userRole === "admin" && <th className="px-3 py-3 border-b border-slate-100">Salary</th>}
                  <th className="px-3 py-3 border-b border-slate-100 text-center">Status</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="7" className="py-20 text-center text-slate-300 font-bold italic animate-pulse">Initializing...</td></tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr><td colSpan="7" className="py-20 text-center text-slate-300 font-bold italic">No records found.</td></tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/70 transition-all transition-colors duration-150">
                      <td className="px-4 py-2 text-slate-400 font-black text-[10px]">DOAG{user.id}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-black text-[13px] tracking-tight">{user.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[220px]">{user.email_id}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-slate-800 font-bold text-[10px] uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded">{user.department || "N/A"}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest leading-none block w-fit">{user.designation}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-slate-600 font-bold text-[11px] leading-tight flex items-center gap-1.5 uppercase tracking-tighter">Born: {user.joiningDate || "N/A"}</span>
                          <span className="text-[9px] text-slate-400 font-black mt-0.5">MOB: {user.mobile_number}</span>
                        </div>
                      </td>
                      {userRole === "admin" && (
                        <td className="px-3 py-2">
                          <span className="text-slate-800 font-bold tracking-tighter">₹ {user.salary_amount?.toLocaleString()}</span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-center text-[10px]">
                        <span className={`px-2.5 py-1 rounded-full font-black uppercase tracking-widest text-[8px] border ${user.employment_status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                          {user.employment_status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => navigate(`/task/employee-details-page/${user.id}`)}
                            className="w-7 h-7 flex items-center justify-center bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-600 hover:text-white transition-all active:scale-95 shadow-sm"
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button
                            onClick={() => { setSelectedEmployee(user); setIsModalOpen(true); }}
                            className="w-7 h-7 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id}
                            className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-sm disabled:opacity-40"
                            title="Delete"
                          >
                            {deletingId === user.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaTrash size={11} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ═══ Compressed Pagination ═══ */}
          {totalPages > 1 && (
            <div className="bg-slate-50/50 px-5 py-3 flex items-center justify-between gap-4 border-t border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                {filteredUsers.length} Members Total
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => c - 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 flex items-center justify-center transition-all"
                >
                  <FaArrowLeft size={10} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg font-black text-[10px] transition-all ${currentPage === i + 1
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(c => c + 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 flex items-center justify-center transition-all"
                >
                  <FaArrowRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ High-Density Profile Editor ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 animate-fade-in shadow-2xl">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl animate-slide-up border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <FaEdit size={16} />
                <h2 className="text-[15px] font-black tracking-tight uppercase">Update Personnel Identity</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center active:scale-90"
              >
                <FaTimes size={12} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-1 italic">Name</label>
                  <input
                    type="text"
                    value={selectedEmployee.full_name}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, full_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-[13px]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-1 italic">Designation</label>
                  <input
                    type="text"
                    value={selectedEmployee.designation}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-[13px]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-1 italic">Email</label>
                  <input
                    type="email"
                    value={selectedEmployee.email_id}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-[13px]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-1 italic">Contact</label>
                  <input
                    type="text"
                    value={selectedEmployee.mobile_number}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, mobile_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-[13px]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-1 italic">Status</label>
                  <select
                    value={selectedEmployee.employment_status}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, employment_status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-[13px] appearance-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {userRole === "admin" && (
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-1 italic">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      value={selectedEmployee.salary_amount}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, salary_amount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-[13px]"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all active:scale-95 text-[11px] uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95 text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {isUpdating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeePage;
