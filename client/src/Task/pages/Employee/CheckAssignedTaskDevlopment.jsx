import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CheckAssignedTaskDevlopment = () => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);



  const fetchTasks = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user.id;
    console.log("Employee ID :", userId);
    
    if (!userId) {
      toast.error("User not logged in");
      return;
    }
    try {
      const response = await axios.get(`https://sf.doaguru.com/api/get-assigned-development-tasks/${userId}`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditData({
      status: task.status,
      deadline_date: task.deadline_date
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditData({});
  };

  const saveEdit = async () => {
    setLoading(true);
    console.log("Editing Task ID:", editingTask);
    console.log("Edit Data:", editData);
    try {
      await axios.put(`https://sf.doaguru.com/api/update-assigned-development-task/${editingTask}`, editData);
      toast.success("Task updated successfully");
      fetchTasks(); // Refresh tasks
      cancelEdit();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-8 border rounded-xl shadow-xl p-9 border-cyan-600 m-5">
      <h2 className="text-2xl font-bold mb-6 text-center">My Assigned Development Tasks</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assign Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deadline Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No tasks assigned yet.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {task.task_description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.assigned_at ? new Date(task.assigned_at).toLocaleString() : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingTask === task.id ? (
                      <input
                        type="date"
                        value={editData.deadline_date}
                        onChange={(e) => setEditData({ ...editData, deadline_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-md p-2"
                      />
                    ) : (
                      task.deadline_date ? new Date(task.deadline_date).toLocaleDateString() : ''
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingTask === task.id ? (
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Pipeline">In Pipeline</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Hold">Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'Hold' ? 'bg-red-100 text-red-800' :
                        task.status === 'In Pipeline' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingTask === task.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          disabled={loading}
                          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(task)}
                        className="text-indigo-600 hover:text-indigo-900"
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
      </div>
    </div>
  );
};

export default CheckAssignedTaskDevlopment;
