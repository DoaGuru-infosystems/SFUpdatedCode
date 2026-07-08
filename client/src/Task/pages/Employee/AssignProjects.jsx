import React, { useEffect, useState } from "react";
import axios from 'axios';
import PaginationControls from "../../components/Pagination";
import { toast } from "react-hot-toast";

function AssignProjectDetails() {
  const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8080" : "https://sf.doaguru.com";
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editData, setEditData] = useState({ status: "Pending", status_note: "" });

  // Pagination state
  const [currentPagetask, setCurrentPagetask] = useState(1);
  const [rowsPerPagetask, setRowsPerPagetask] = useState(5);

  const getTotalPages = (data, rowsPerPage) => Math.ceil(data.length / rowsPerPage);

  const getCurrentRows = (data, currentPage, rowsPerPage) => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return data.slice(indexOfFirstRow, indexOfLastRow);
  };

  const handleNextPage = (setter, currentPage, totalPages) => {
    if (currentPage < totalPages) {
      setter(currentPage + 1);
    }
  };

  const handlePreviousPage = (setter, currentPage) => {
    if (currentPage > 1) {
      setter(currentPage - 1);
    }
  };

  const handleRowsPerPage = (event, setter) => {
    setter(parseInt(event.target.value));
  };

  const myTask = () => {
    let user = localStorage.getItem('user');
    user = JSON.parse(user);
    if (!user || !user.id) {
      console.error('User ID not found');
      return;
    }

    axios.get(`${API_BASE}/api/getProject/${user.id}`)
      .then(res => {
        setTaskData(res.data);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }

  useEffect(() => {
    myTask();
  }, []);

  const startEdit = (project) => {
    setEditingProject(project.id);
    setEditData({
      status: project.status || "Pending",
      status_note: project.status_note || ""
    });
  };

  const cancelEdit = () => {
    setEditingProject(null);
  };

  const saveEdit = async () => {
    if (!editingProject) return;
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/api/update-assigned-project-status/${editingProject}`, {
        status: editData.status,
        status_note: editData.status_note
      });
      toast.success("Project status updated successfully!");
      setEditingProject(null);
      myTask();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update project status.");
    } finally {
      setLoading(false);
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold text-center py-3 my-2 font-sans text-slate-800">My Assigned Projects</h1>
      </div>
      <div className="container overflow-x-auto shadow-md rounded-lg m-auto border-3 p-6 bg-white">
        <div className="Select-table-row mb-3 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Select Page </span>
          <select name="rowsPerPage" id="rowsPerPage" className="text-xs rounded border border-gray-300 p-1 bg-white font-semibold" onChange={(e) => handleRowsPerPage(e, setRowsPerPagetask)}
            value={rowsPerPagetask}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
        <table className="w-full text-sm text-left rtl:text-right text-gray-700 dark:text-gray">
          <thead className="text-xs text-white-900 uppercase bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
            <tr>
              <th scope="col" className="px-3 py-2">S.no.</th>
              <th scope="col" className="px-3 py-2">Assign ID</th>
              <th scope="col" className="px-3 py-2">Project/Client Name</th>
              <th scope="col" className="px-3 py-2">Category</th>
              <th scope="col" className="px-3 py-2">Assigned By</th>
              <th scope="col" className="px-3 py-2">Assign Date</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2">Progress Note</th>
              <th scope="col" className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taskData.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-3 py-4 text-center text-sm text-gray-500 font-medium">
                  No assigned projects found.
                </td>
              </tr>
            ) : (
              getCurrentRows(taskData, currentPagetask, rowsPerPagetask).map((task, index) => (
                <tr key={task.id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:text-gray-100 dark:border-gray-700">
                  <td className="px-3 py-2">{(currentPagetask - 1) * rowsPerPagetask + index + 1}</td>
                  <td className="px-3 py-2">{task.id}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{task.project_name || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-600">{task.category_name || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-700 font-bold">{task.assigned_by || "Admin"}</td>
                  <td className="px-3 py-2">{formatDate(task.created_at)}</td>
                  <td className="px-3 py-2">
                    {editingProject === task.id ? (
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
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'Hold' ? 'bg-red-100 text-red-800' :
                        task.status === 'In Pipeline' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status || 'Pending'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editingProject === task.id ? (
                      <textarea
                        value={editData.status_note}
                        onChange={(e) => setEditData({ ...editData, status_note: e.target.value })}
                        placeholder="Progress update note..."
                        className="border border-gray-300 rounded p-1 text-xs w-full min-w-[150px]"
                        rows="2"
                      />
                    ) : (
                      <span className="italic text-xs text-slate-500 font-medium break-words">
                        {task.status_note || 'No note added yet'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold">
                    {editingProject === task.id ? (
                      <div className="flex space-x-1.5">
                        <button
                          onClick={saveEdit}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors text-[11px] font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors text-[11px] font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(task)}
                        className="text-blue-600 hover:text-blue-900 font-bold border border-blue-100 hover:border-blue-300 rounded px-2 py-1 bg-blue-50/50 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {getTotalPages(taskData, rowsPerPagetask) > 1 && (
          <PaginationControls
            currentPage={currentPagetask}
            totalPages={getTotalPages(taskData, rowsPerPagetask)}
            onNextPage={() => handleNextPage(setCurrentPagetask, currentPagetask, getTotalPages(taskData, rowsPerPagetask))}
            onPreviousPage={() => handlePreviousPage(setCurrentPagetask, currentPagetask)}
          />
        )}
      </div>
    </div>
  );
}

export default AssignProjectDetails;
