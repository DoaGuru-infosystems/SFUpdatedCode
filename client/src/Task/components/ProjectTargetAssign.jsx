import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProjectTargetAssign = ({ onSuccess }) => {
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({
        employeeId: '',
        projectId: '',
        month: '',
        year: '',
        targetPost: '',
        targetVideo: '',
        targetShoot: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch all employees
        setLoading(true);
        axios.get('https://sf.doaguru.com/api/users')
            .then(res => {
                setEmployees(res.data);
                setLoading(false);
            })
            .catch(() => {
                setEmployees([]);
                setLoading(false);
            });
        // Fetch all projects
        axios.get('https://sf.doaguru.com/api/projects')
            .then(res => setProjects(res.data))
            .catch(() => setProjects([]));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                employeeId: form.employeeId,
                projectId: form.projectId,
                month: form.month,
                year: form.year,
                targetPost: form.targetPost,
                targetVideo: form.targetVideo,
                targetShoot: form.targetShoot
            };
            const res = await axios.post("https://sf.doaguru.com/api/assignProjectTarget", payload);
            if (res.data && res.data.success) {
                toast.success("Project target assigned successfully.");
                setForm({
                    employeeId: '',
                    projectId: '',
                    month: '',
                    year: '',
                    targetPost: '',
                    targetVideo: '',
                    targetShoot: ''
                });
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.data.message || "Failed to assign target.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    // Generate year options (current year +/- 2)
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    return (
        <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-semibold mb-2 text-gray-700">Employee Name</label>
                    {loading ? (
                        <div className="text-blue-500">Loading employees...</div>
                    ) : employees.length === 0 ? (
                        <div className="text-red-500">No employees found.</div>
                    ) : (
                        <select
                            name="employeeId"
                            value={form.employeeId}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            required
                        >
                            <option value="">Select Employee</option>
                            {employees
                                .filter(emp => emp.department === 'Digital Marketing')
                                .map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.designation})</option>
                                ))}
                        </select>
                    )}
                </div>
                <div>
                    <label className="block font-semibold mb-2 text-gray-700">Company/Project</label>
                    {projects.length === 0 ? (
                        <div className="text-red-500">No projects found.</div>
                    ) : (
                        <select
                            name="projectId"
                            value={form.projectId}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            required
                        >
                            <option value="">Select Project</option>
                            {projects.map(proj => (
                                <option key={proj.id} value={proj.id}>{proj.name}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block font-semibold mb-2 text-gray-700">Month</label>
                        <select
                            name="month"
                            value={form.month}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            required
                        >
                            <option value="">Select Month</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block font-semibold mb-2 text-gray-700">Year</label>
                        <select
                            name="year"
                            value={form.year}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            required
                        >
                            <option value="">Select Year</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block font-semibold mb-2 text-gray-700">Target Post</label>
                        <input
                            type="number"
                            name="targetPost"
                            value={form.targetPost}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            min="0"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block font-semibold mb-2 text-gray-700">Target Video</label>
                        <input
                            type="number"
                            name="targetVideo"
                            value={form.targetVideo}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            min="0"
                            required
                        />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block font-semibold mb-2 text-gray-700">Target Shoot</label>
                        <input
                            type="number"
                            name="targetShoot"
                            value={form.targetShoot}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            min="0"
                            required
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
            </form>
        </div>
    );
};

export default ProjectTargetAssign;
