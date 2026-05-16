import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EmployeeAssignTaskView = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState({});
    const [updating, setUpdating] = useState({});

    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;

    // Fetch assigned tasks
    const fetchAssignedTasks = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/tasks/assigned/${userId}`);
            setTasks(response.data);
            
            // Initialize status for each task
            const initialStatus = {};
            response.data.forEach(task => {
                initialStatus[task.id] = task.status || 'Progress';
            });
            setSelectedStatus(initialStatus);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    // Update task status
    const updateTaskStatus = async (taskId) => {
        try {
            setUpdating(prev => ({ ...prev, [taskId]: true }));
            const newStatus = selectedStatus[taskId];
            
            await axios.put(`/api/tasks/${taskId}/status`, {
                status: newStatus
            });
            
            toast.success('Task status updated successfully');
            fetchAssignedTasks(); // Refresh the task list
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Failed to update task status');
        } finally {
            setUpdating(prev => ({ ...prev, [taskId]: false }));
        }
    };

    useEffect(() => {
        if (userId) {
            fetchAssignedTasks();
        }
    }, [userId]);

    // Handle status change
    const handleStatusChange = (taskId, newStatus) => {
        setSelectedStatus(prev => ({
            ...prev,
            [taskId]: newStatus
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Assigned Tasks</h1>
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No tasks assigned yet</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {tasks.map((task) => (
                            <li key={task.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-indigo-600 truncate">
                                            {task.project_name || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {task.category_name} - {task.subcategory_name}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {task.task_description}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Assigned on: {new Date(task.assigned_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                                        <select
                                            value={selectedStatus[task.id] || 'Progress'}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="On Hold">On Hold</option>
                                        </select>
                                        <button
                                            onClick={() => updateTaskStatus(task.id)}
                                            disabled={updating[task.id]}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        >
                                            {updating[task.id] ? 'Updating...' : 'Update'}
                                        </button>
                                    </div>
                                </div>
                                {task.due_date && (
                                    <div className="mt-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Due: {new Date(task.due_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EmployeeAssignTaskView;