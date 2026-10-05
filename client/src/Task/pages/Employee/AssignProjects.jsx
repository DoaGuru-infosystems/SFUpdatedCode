import React, { useEffect, useState } from "react";
import axios from 'axios';
import PaginationControls from "../../components/Pagination";
import { toast } from "react-hot-toast";

function AssignProjectDetails() {
  const API_BASE = "https://sf.doaguru.com";
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(false);
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
              <th scope="col" className="px-3 py-2">Daily Deliverables</th>
              <th scope="col" className="px-3 py-2">Assigned By</th>
              <th scope="col" className="px-3 py-2">Assign Date</th>
            </tr>
          </thead>
          <tbody>
            {taskData.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-3 py-4 text-center text-sm text-gray-500 font-medium">
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
                  <td className="px-3 py-2">
                    {((task.daily_post || 0) + (task.daily_video || 0) + (task.daily_carousel || 0) + (task.daily_creative || 0) + (task.daily_shoot || 0)) > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {task.daily_post > 0 && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            📌 {task.daily_post} Post
                          </span>
                        )}
                        {task.daily_video > 0 && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            🎬 {task.daily_video} Video
                          </span>
                        )}
                        {task.daily_carousel > 0 && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            📑 {task.daily_carousel} Carousel
                          </span>
                        )}
                        {task.daily_creative > 0 && (
                          <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            🎨 {task.daily_creative} Design
                          </span>
                        )}
                        {task.daily_shoot > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            📸 {task.daily_shoot} Shoot
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Standard</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700 font-bold">{task.assigned_by || "Admin"}</td>
                  <td className="px-3 py-2">{formatDate(task.created_at)}</td>

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
