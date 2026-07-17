import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminAssignTaskDevlopment = () => {
  const [users, setUsers] = useState([]);
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [status, setStatus] = useState('Pending');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(assignedTasks.length / rowsPerPage) || 1;
  const paginatedTasks = assignedTasks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const fetchUsers = () => {
    axios.get(window.API_BASE + '/api/users')
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      });
  };

  const fetchAssignedTasks = () => {
    axios.get(window.API_BASE + '/api/get-all-assigned-development-tasks')
      .then(response => {
        setAssignedTasks(response.data || []);
      })
      .catch(error => {
        console.error('Error fetching assigned tasks:', error);
      });
  };

  useEffect(() => {
    fetchUsers();
    fetchAssignedTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!taskDescription || !selectedUser || !status || !taskDate) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      await axios.post(window.API_BASE + '/api/assign-project-target-development-team', {
        user_id: selectedUser,
        user_full_name: users.find(u => u.id == selectedUser)?.full_name || '',
        ProjectOrClientName: 'Development Task',
        Category: 'Development',
        subCategory: 'Task Assignment',
        TaskDescription: taskDescription,
        task_date: taskDate,
        note: note
      });

      toast.success('Task assigned successfully!');
      fetchAssignedTasks();

      // Reset form
      setTaskDescription('');
      setSelectedUser('');
      setStatus('Pending');
      setTaskDate(new Date().toISOString().split('T')[0]);
      setNote('');
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
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
    <div className="max-w-6xl mx-auto mt-8 border rounded-xl shadow-xl p-9 border-cyan-600 m-5 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center">Assign Development Task</h2>

      {/* Form in horizontal layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="md:col-span-2">
          <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Task Details</label>
          <textarea
            id="taskDescription"
            name="taskDescription"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            rows="3"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter task description..."
          />
        </div>

        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700">Select User</label>
          <select
            id="user"
            name="user"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="taskDate" className="block text-sm font-medium text-gray-700">Task Date</label>
          <input
            type="date"
            id="taskDate"
            name="taskDate"
            value={taskDate}
            onChange={(e) => setTaskDate(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md shadow-sm text-black border-2 border-cyan-600 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 w-full md:w-auto"
          >
            {loading ? 'Assigning...' : '+ Assign Task'}
          </button>
        </div>
      </form>

      {/* Table for assigned tasks */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress Note
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignedTasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No tasks assigned yet.
                </td>
              </tr>
            ) : (
              paginatedTasks.map((task, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.user_full_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs break-words">
                    {task.task_description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(task.task_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                    {task.assigned_by || 'Admin'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs break-words">
                    {task.status_note || 'No note added yet'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {assignedTasks.length > 0 && (
        <div className="mt-4 p-4 border-t border-gray-200 bg-gray-50/60 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-600">
          <div className="flex flex-wrap items-center gap-3">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
            >
              {[5, 10, 20, 50].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <span className="text-gray-500">
              Showing {Math.min((currentPage - 1) * rowsPerPage + 1, assignedTasks.length)} to {Math.min(currentPage * rowsPerPage, assignedTasks.length)} of {assignedTasks.length} tasks
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 flex items-center justify-center rounded transition-all font-bold ${
                      currentPage === i + 1
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAssignTaskDevlopment;
