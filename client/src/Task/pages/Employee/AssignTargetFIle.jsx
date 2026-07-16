import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

function AssignDailyTarget() {
  const API_BASE = window.location.hostname === "localhost" ? window.API_BASE : "https://sf.doaguru.com";
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTarget, setEditingTarget] = useState(null);
  const [editData, setEditData] = useState({ status: "Pending", status_note: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const user = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const employeeId = user?.id;

  const fetchTargets = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/getEmployeeWiseProjectTarget/${employeeId}`);
      setTargets(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch assigned targets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
    // eslint-disable-next-line
  }, [employeeId]);

  const paginatedTargets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return targets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [targets, currentPage]);

  if (!user || !user.id) {
    console.error('User ID not found');
    return null;
  }

  const startEdit = (tgt) => {
    setEditingTarget(tgt.id);
    setEditData({
      status: tgt.status || "Pending",
      status_note: tgt.status_note || ""
    });
  };

  const cancelEdit = () => {
    setEditingTarget(null);
  };

  const saveEdit = async (id) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE}/api/updateProjectTarget/${id}`, {
        status: editData.status,
        status_note: editData.status_note
      });
      toast.success("Target status updated successfully!");
      setEditingTarget(null);
      fetchTargets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update target status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="TaskView min-h-screen">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 font-sans text-slate-800">My Assigned Daily Targets</h1>
        <div className="bg-white rounded-xl shadow border border-black">
          <h3 className="text-base sm:text-lg font-bold px-4 sm:px-6 pt-4 sm:pt-6 pb-2 text-black font-sans">Assigned Daily Targets</h3>
          {loading ? (
            <div className="p-4 sm:p-6 text-center text-black">Loading...</div>
          ) : error ? (
            <div className="p-4 sm:p-6 text-center text-red-600">{error}</div>
          ) : targets.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500">No targets assigned yet.</div>
          ) : (
            <div className="overflow-x-auto p-2 sm:p-6">
              <table className="min-w-full border border-black bg-white">
                <thead className="bg-black text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 border-b border-black text-center">Company Name</th>
                    <th className="py-3 px-3 border-b border-black text-center">Assigned By</th>
                    <th className="py-3 px-3 border-b border-black text-center">Assign Date</th>
                    <th className="py-3 px-3 border-b border-black text-center">Target Post</th>
                    <th className="py-3 px-3 border-b border-black text-center">Target Video</th>
                    <th className="py-3 px-3 border-b border-black text-center">Target Shoot</th>
                    <th className="py-3 px-3 border-b border-black text-center">Remarks / Guidelines</th>
                    <th className="py-3 px-3 border-b border-black text-center">Status</th>
                    <th className="py-3 px-3 border-b border-black text-center">Progress Note</th>
                    <th className="py-3 px-3 border-b border-black text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {paginatedTargets.map((tgt, idx) => (
                    <tr key={idx} className="text-black hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 border-b border-black text-center font-bold text-slate-800">{tgt.projectName}</td>
                      <td className="py-3 px-3 border-b border-black text-center font-bold text-slate-600">{tgt.assigned_by || 'Admin'}</td>
                      <td className="py-3 px-3 border-b border-black text-center">{formatDate(tgt.created_at)}</td>
                      <td className="py-3 px-3 border-b border-black text-center font-semibold text-indigo-600">{tgt.targetPost || 0}</td>
                      <td className="py-3 px-3 border-b border-black text-center font-semibold text-indigo-600">{tgt.targetVideo || 0}</td>
                      <td className="py-3 px-3 border-b border-black text-center font-semibold text-indigo-600">{tgt.targetShoot || 0}</td>
                      <td className="py-3 px-3 border-b border-black text-center text-sm font-semibold text-slate-800 max-w-xs break-words">
                        {tgt.note || <span className="italic text-gray-400 font-normal">No guidelines provided</span>}
                      </td>
                      <td className="py-3 px-3 border-b border-black text-center">
                        {editingTarget === tgt.id ? (
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="border border-gray-300 rounded p-1 text-xs bg-white font-semibold"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Pipeline">In Pipeline</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Hold">Hold</option>
                            <option value="Completed">Completed</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full ${tgt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            tgt.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              tgt.status === 'Hold' ? 'bg-red-100 text-red-800' :
                                tgt.status === 'In Pipeline' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                            }`}>
                            {tgt.status || 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 border-b border-black text-center">
                        {editingTarget === tgt.id ? (
                          <textarea
                            value={editData.status_note}
                            onChange={(e) => setEditData({ ...editData, status_note: e.target.value })}
                            placeholder="Progress update note..."
                            className="border border-gray-300 rounded p-1 text-xs w-full min-w-[120px]"
                            rows="2"
                          />
                        ) : (
                          <span className="italic text-xs text-slate-500 font-medium break-words max-w-[150px] inline-block">
                            {tgt.status_note || 'No note added yet'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 border-b border-black text-center text-xs font-semibold">
                        {editingTarget === tgt.id ? (
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => saveEdit(tgt.id)}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded transition-colors text-[11px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-slate-400 hover:bg-slate-500 text-white px-2 py-1 rounded transition-colors text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(tgt)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 hover:border-red-400 rounded px-2.5 py-1 transition-all duration-150 font-bold uppercase tracking-wider text-[10px]"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {targets.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-black bg-slate-50 mt-4 rounded font-sans">
                  <div className="text-xs text-slate-700 font-bold">
                    Showing <span className="text-indigo-600">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span className="text-indigo-600">
                      {Math.min(currentPage * ITEMS_PER_PAGE, targets.length)}
                    </span> of{' '}
                    <span className="text-indigo-600">{targets.length}</span> targets
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded text-xs font-bold border border-black bg-white text-black hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Prev
                    </button>
                    {Array.from({ length: Math.ceil(targets.length / ITEMS_PER_PAGE) }, (_, idx) => idx + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded text-xs font-bold transition-all duration-200 ${
                          currentPage === p
                            ? 'bg-black text-white shadow'
                            : 'border border-black bg-white text-black hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(targets.length / ITEMS_PER_PAGE)))}
                      disabled={currentPage === Math.ceil(targets.length / ITEMS_PER_PAGE)}
                      className="px-3 py-1.5 rounded text-xs font-bold border border-black bg-white text-black hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignDailyTarget;
