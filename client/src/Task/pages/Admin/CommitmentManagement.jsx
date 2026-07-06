import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaTasks, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CommitmentManagement = ({ employeeId, readOnly = false }) => {
    const [commitments, setCommitments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editModeId, setEditModeId] = useState(null);
    const [commitmentText, setCommitmentText] = useState('');
    const [role, setRole] = useState('Collaborator');
    const [uniqueRoles, setUniqueRoles] = useState(['Collaborator', 'Team Lead', 'Manager', 'Executor', 'Support']);

    useEffect(() => {
        fetchCommitments();
        fetchUniqueRoles();
    }, [employeeId]);

    const fetchUniqueRoles = async () => {
        try {
            const { data } = await axios.get('http://localhost:8080/api/commitments/roles');
            if (data.success && data.data.length > 0) {
                // Merge default roles with DB roles, keeping them unique
                const defaults = ['Collaborator', 'Team Lead', 'Manager', 'Executor', 'Support'];
                const merged = [...new Set([...defaults, ...data.data])];
                setUniqueRoles(merged);
            }
        } catch (error) {
            console.error('Error fetching unique roles:', error);
        }
    };

    const fetchCommitments = async () => {
        try {
            const { data } = await axios.get(`http://localhost:8080/api/commitments/history/${employeeId}`);
            if (data.success) {
                setCommitments(data.data);
            }
        } catch (error) {
            console.error('Error fetching commitments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!commitmentText.trim()) {
            toast.error("Please enter commitment details");
            return;
        }

        try {
            if (editModeId) {
                const { data } = await axios.put(`http://localhost:8080/api/commitments/update/${editModeId}`, {
                    commitment_text: commitmentText,
                    role: role
                });
                if (data.success) {
                    toast.success('Commitment updated');
                    resetForm();
                    fetchCommitments();
                    fetchUniqueRoles();
                }
            } else {
                const { data } = await axios.post('http://localhost:8080/api/commitments/add', {
                    commitment_text: commitmentText,
                    role: role,
                    employee_id: employeeId
                });
                if (data.success) {
                    toast.success('Commitment added');
                    resetForm();
                    fetchCommitments();
                    fetchUniqueRoles();
                }
            }
        } catch (error) {
            toast.error(editModeId ? 'Failed to update commitment' : 'Failed to add commitment');
        }
    };

    const handleEditClick = (record) => {
        setCommitmentText(record.commitment_text);
        setRole(record.role || 'Collaborator');
        setEditModeId(record.id);
        setShowAddForm(true);
    };

    const deleteRecord = async (id) => {
        if (!window.confirm('Are you sure you want to delete this commitment?')) return;
        try {
            await axios.delete(`http://localhost:8080/api/commitments/delete/${id}`);
            toast.success('Commitment deleted');
            fetchCommitments();
        } catch (error) {
            toast.error('Failed to delete commitment');
        }
    };

    const resetForm = () => {
        setShowAddForm(false);
        setEditModeId(null);
        setCommitmentText('');
        setRole('Collaborator');
    };

    return (
        <div className="h-full">
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${readOnly ? 'hidden' : 'mb-6'}`}>
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <FaTasks className="text-blue-500" /> Roles & Commitments
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Manage employee roles and responsibilities</p>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => {
                            if (showAddForm) resetForm();
                            else setShowAddForm(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-xl transition-all active:scale-95 text-xs shadow-lg shadow-blue-100"
                    >
                        {showAddForm ? 'CANCEL' : <><FaPlus /> ADD NEW</>}
                    </button>
                )}
            </div>

            {!readOnly && showAddForm && (
                <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Responsibilities / Description</label>
                            <textarea
                                rows="3"
                                placeholder="Describe the responsibilities and commitments here..."
                                value={commitmentText}
                                onChange={(e) => setCommitmentText(e.target.value)}
                                required
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Role Performed</label>
                            <input
                                list="rolesList"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Type or select a role"
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            />
                            <datalist id="rolesList">
                                {uniqueRoles.map((ur, i) => (
                                    <option key={i} value={ur} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-blue-600 text-white font-black px-6 py-2 rounded-lg text-xs hover:bg-blue-700 transition-colors uppercase shadow-md shadow-blue-200">
                            {editModeId ? 'Update Commitment' : 'Save Commitment'}
                        </button>
                    </div>
                </motion.form>
            )}

            <div className="space-y-3">
                {commitments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 font-bold text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
                        No commitments or roles found for this employee
                    </div>
                ) : (
                    commitments.map((record, index) => (
                        <div key={record.id} className="group flex flex-col md:flex-row gap-4 p-4 border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 rounded-xl transition-all">
                            <div className="flex-shrink-0 pt-1">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                                    {index + 1}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                        {record.role || 'Collaborator'}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {record.commitment_text}
                                </p>
                                <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">
                                    Added on: {new Date(record.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            {!readOnly && (
                                <div className="flex-shrink-0 flex gap-2 self-start">
                                    <button
                                        onClick={() => handleEditClick(record)}
                                        className="p-2 bg-white border border-slate-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm"
                                        title="Edit"
                                    >
                                        <FaEdit size={12} />
                                    </button>
                                    <button
                                        onClick={() => deleteRecord(record.id)}
                                        className="p-2 bg-white border border-slate-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm"
                                        title="Delete"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommitmentManagement;
