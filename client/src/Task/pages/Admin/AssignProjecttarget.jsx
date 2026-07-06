import { useState, useEffect } from 'react';
import axios from 'axios';
import ProjectTargetAssign from '../../components/ProjectTargetAssign';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const AssignProjectTarget = () => {
    const [showModal, setShowModal] = useState(false);
    const [targets, setTargets] = useState([]);
    const [actualCounts, setActualCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingTarget, setEditingTarget] = useState(null);
    const [editFormData, setEditFormData] = useState({
        targetPost: '',
        targetVideo: '',
        targetShoot: ''
    });
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchTargets = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:8080/api/getAllProjectTarget');
            setTargets(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch assigned targets.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch actual post/video counts for all targets (today's tasks)
    const fetchActualCounts = async (targets, date) => {
        const counts = {};
        const selectedDate = date; // YYYY-MM-DD format

        await Promise.all(targets.map(async (tgt) => {
            try {
                const userId = tgt.employeeId;
                const url = `http://localhost:8080/api/getUserTasks/${userId}`;
                const res = await axios.get(url);

                // Filter tasks for selected date
                const todayTasks = res.data.filter(task => {
                    const taskDate = task.task_date ? task.task_date.split('T')[0] : null;
                    return taskDate === selectedDate;
                });

                // Sum up today's post and video counts
                const postCount = todayTasks.reduce((sum, task) => sum + (parseInt(task.postCount) || 0), 0);
                const videoCount = todayTasks.reduce((sum, task) => sum + (parseInt(task.videoCount) || 0), 0);
                const shootCount = todayTasks.reduce((sum, task) => sum + (parseInt(task.shootCount) || 0), 0);

                // Create unique key for this employee's today's counts
                counts[tgt.employeeId] = {
                    post: postCount,
                    video: videoCount,
                    shoot: shootCount
                };

            } catch (err) {
                console.error('Error fetching tasks for employee', tgt.employeeId, ':', err);
                counts[tgt.employeeId] = {
                    post: 0,
                    video: 0,
                    shoot: 0
                };
            }
        }));

        setActualCounts(counts);
    };

    // Handle Edit Target
    const handleEditTarget = (target) => {
        setEditingTarget(target.id);
        setEditFormData({
            targetPost: target.targetPost,
            targetVideo: target.targetVideo,
            targetShoot: target.targetShoot
        });
    };

    // Handle Update Target
    const handleUpdateTarget = async (targetId) => {
        try {
            const response = await axios.put(`http://localhost:8080/api/updateProjectTarget/${targetId}`, editFormData);
            if (response.data.success) {
                setEditingTarget(null);
                setEditFormData({ targetPost: '', targetVideo: '', targetShoot: '' });
                fetchTargets(); // Refresh the list
                toast.success('Target updated successfully!');
            }
        } catch (err) {
            console.error('Error updating target:', err);
            toast.error('Failed to update target. Please try again.');
        }
    };

    // Handle Delete Target
    const handleDeleteTarget = async (targetId) => {
        if (!window.confirm('Are you sure you want to delete this target?')) {
            return;
        }

        try {
            const response = await axios.delete(`http://localhost:8080/api/deleteProjectTarget/${targetId}`);
            if (response.data.success) {
                fetchTargets(); // Refresh the list
                toast.success('Target deleted successfully!');
            }
        } catch (err) {
            console.error('Error deleting target:', err);
            toast.error('Failed to delete target. Please try again.');
        }
    };

    // Handle Cancel Edit
    const handleCancelEdit = () => {
        setEditingTarget(null);
        setEditFormData({ targetPost: '', targetVideo: '', targetShoot: '' });
    };

    // Download Excel Template
    const downloadTemplate = () => {
        const templateData = [
            {
                employeeId: '1',
                employeeName: 'Priyanshu DEMO DATA',
                projectId: '37',
                projectName: 'DOAGURU',
                targetPost: '0',
                targetVideo: '0',
                targetShoot: '0'
            },
            {
                employeeId: '2',
                employeeName: 'Delete kar do is line ko',
                projectId: '37',
                projectName: 'DOAGURU',
                targetPost: '0',
                targetVideo: '0',
                targetShoot: '0'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'project_targets_template.xlsx');

        toast.success('Template downloaded! Fill the data and upload.');
    };

    // Handle File Upload
    const handleFileUpload = async () => {
        if (!uploadFile) {
            toast.error('Please select a file first!');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Validate data
                const validatedData = [];
                const errors = [];

                jsonData.forEach((row, index) => {
                    const rowNum = index + 2; // Excel rows start from 1, plus header row

                    if (!row.employeeId) errors.push(`Row ${rowNum}: employeeId is required`);
                    if (!row.projectId) errors.push(`Row ${rowNum}: projectId is required`);
                    if (row.targetPost === undefined || row.targetPost === null) errors.push(`Row ${rowNum}: targetPost is required`);
                    if (row.targetVideo === undefined || row.targetVideo === null) errors.push(`Row ${rowNum}: targetVideo is required`);
                    if (row.targetShoot === undefined || row.targetShoot === null) errors.push(`Row ${rowNum}: targetShoot is required`);

                    if (row.employeeId && row.projectId && row.targetPost !== undefined && row.targetVideo !== undefined && row.targetShoot !== undefined) {
                        validatedData.push({
                            employeeId: parseInt(row.employeeId),
                            projectId: parseInt(row.projectId),
                            targetPost: parseInt(row.targetPost) || 0,
                            targetVideo: parseInt(row.targetVideo) || 0,
                            targetShoot: parseInt(row.targetShoot) || 0
                        });
                    }
                });

                if (errors.length > 0) {
                    toast.error(`Validation errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
                    setUploading(false);
                    return;
                }

                if (validatedData.length === 0) {
                    toast.error('No valid data found in the file!');
                    setUploading(false);
                    return;
                }

                // Upload to backend
                const response = await axios.post('http://localhost:8080/api/bulkAssignProjectTarget', {
                    targets: validatedData
                });

                if (response.data.success) {
                    toast.success(`Successfully uploaded ${validatedData.length} targets!`);
                    setUploadFile(null);
                    fetchTargets(); // Refresh the list
                } else {
                    toast.error('Upload failed: ' + response.data.message);
                }
            };

            reader.readAsArrayBuffer(uploadFile);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleAssignSuccess = () => {
        setShowModal(false);
        fetchTargets();
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

    useEffect(() => {
        fetchTargets();
    }, []);

    useEffect(() => {
        if (targets.length > 0) {
            fetchActualCounts(targets, selectedDate);
        }
        // eslint-disable-next-line
    }, [targets, selectedDate]);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            {/* Header / Management Bar */}
            <div className="bg-slate-900 text-white pb-24 pt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Daily Target Command</h1>
                            <p className="mt-2 text-slate-400 font-medium">Assign and monitor workforce productivity metrics.</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/10 flex items-center gap-3">
                            <label htmlFor="date-filter" className="pl-3 text-sm font-semibold text-slate-300">Target Date:</label>
                            <input
                                id="date-filter"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-slate-800 border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 px-3 py-2 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Primary Action Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 text-xl">
                                <i className="fas fa-plus"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Manual Assignment</h3>
                            <p className="text-sm text-slate-500 mt-1">Assign targets to individuals manually.</p>
                        </div>
                        <button
                            className="mt-6 w-full bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition"
                            onClick={() => setShowModal(true)}
                        >
                            Open Assignment Form
                        </button>
                    </div>

                    {/* Bulk Upload Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4 text-xl">
                                <i className="fas fa-file-upload"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Bulk Operations</h3>
                            <p className="text-sm text-slate-500 mt-1">Upload multiple targets via Excel file.</p>
                        </div>
                        <div className="mt-6 flex gap-2">
                            <label
                                htmlFor="file-upload"
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold border-2 border-dashed transition cursor-pointer ${uploadFile ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-indigo-400'
                                    }`}
                            >
                                {uploadFile ? uploadFile.name.substring(0, 15) + '...' : 'Select File'}
                            </label>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => setUploadFile(e.target.files[0])}
                                className="hidden"
                                id="file-upload"
                            />
                            {uploadFile && (
                                <button
                                    onClick={handleFileUpload}
                                    disabled={uploading}
                                    className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    {uploading ? '...' : <i className="fas fa-check"></i>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Resources Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-4 text-xl">
                                <i className="fas fa-download"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Resource Templates</h3>
                            <p className="text-sm text-slate-500 mt-1">Download the pre-formatted Excel template.</p>
                        </div>
                        <button
                            onClick={downloadTemplate}
                            className="mt-6 w-full bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-800 transition"
                        >
                            Get Excel Template
                        </button>
                    </div>
                </div>

                {/* Performance Ledger Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <h3 className="text-lg font-bold text-slate-900">Performance Ledger</h3>
                        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Achieved</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Pending</div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-500 italic">Synchronizing target data...</div>
                    ) : error ? (
                        <div className="p-12 text-center text-rose-600 bg-rose-50 font-medium">{error}</div>
                    ) : targets.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic font-medium">No targets registered for this period.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="py-4 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Workforce Member</th>
                                        <th className="py-4 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</th>
                                        <th className="py-4 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned</th>
                                        <th className="py-4 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Target: Posts</th>
                                        <th className="py-4 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Target: Videos</th>
                                        <th className="py-4 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Target: Shoots</th>
                                        <th className="py-4 px-6 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Progress</th>
                                        <th className="py-4 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {targets.map((tgt, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                        {tgt.employeeName.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-900">{tgt.employeeName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-tighter">
                                                    {tgt.projectName}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center text-sm font-medium text-slate-500">
                                                {formatDate(tgt.created_at)}
                                            </td>

                                            <td className="py-4 px-6 text-center">
                                                {editingTarget === tgt.id ? (
                                                    <input
                                                        type="number"
                                                        value={editFormData.targetPost}
                                                        onChange={(e) => setEditFormData({ ...editFormData, targetPost: e.target.value })}
                                                        className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-slate-700">{tgt.targetPost}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {editingTarget === tgt.id ? (
                                                    <input
                                                        type="number"
                                                        value={editFormData.targetVideo}
                                                        onChange={(e) => setEditFormData({ ...editFormData, targetVideo: e.target.value })}
                                                        className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-slate-700">{tgt.targetVideo}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {editingTarget === tgt.id ? (
                                                    <input
                                                        type="number"
                                                        value={editFormData.targetShoot}
                                                        onChange={(e) => setEditFormData({ ...editFormData, targetShoot: e.target.value })}
                                                        className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-slate-700">{tgt.targetShoot}</span>
                                                )}
                                            </td>

                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col gap-2 items-center">
                                                    <div className="flex gap-3 text-lg">
                                                        <i className={`fas fa-paper-plane transition-colors ${(actualCounts[tgt.employeeId]?.post || 0) >= tgt.targetPost ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-200'
                                                            }`} title={`Post: ${actualCounts[tgt.employeeId]?.post || 0}/${tgt.targetPost}`}></i>

                                                        <i className={`fas fa-video transition-colors ${(actualCounts[tgt.employeeId]?.video || 0) >= tgt.targetVideo ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-200'
                                                            }`} title={`Video: ${actualCounts[tgt.employeeId]?.video || 0}/${tgt.targetVideo}`}></i>

                                                        <i className={`fas fa-camera transition-colors ${(actualCounts[tgt.employeeId]?.shoot || 0) >= tgt.targetShoot ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-200'
                                                            }`} title={`Shoot: ${actualCounts[tgt.employeeId]?.shoot || 0}/${tgt.targetShoot}`}></i>
                                                    </div>
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Progress Score</span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6">
                                                <div className="flex gap-2 justify-center">
                                                    {editingTarget === tgt.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateTarget(tgt.id)}
                                                                className="bg-emerald-600 text-white p-1.5 rounded-lg hover:bg-emerald-700 shadow-sm"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="bg-slate-400 text-white p-1.5 rounded-lg hover:bg-slate-500 shadow-sm"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditTarget(tgt)}
                                                                className="bg-slate-100 text-slate-600 p-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTarget(tgt.id)}
                                                                className="bg-slate-100 text-slate-600 p-1.5 rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
                                                            >
                                                                <i className="fas fa-trash-alt"></i>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Assign Target */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
                        <button
                            className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-full w-10 h-10 flex items-center justify-center text-xl font-medium transition-colors"
                            onClick={() => setShowModal(false)}
                            title="Close"
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <div className="p-8">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Assign Strategy</h3>
                                <p className="text-slate-500 font-medium">Define production milestones for {formatDate(selectedDate)}</p>
                            </div>
                            <ProjectTargetAssign onSuccess={handleAssignSuccess} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignProjectTarget;
