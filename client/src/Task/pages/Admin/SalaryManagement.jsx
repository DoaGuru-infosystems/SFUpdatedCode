import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    FaMoneyBillWave, FaHistory, FaCheckCircle, FaExclamationCircle,
    FaPlus, FaCalendarAlt, FaCreditCard, FaTrash, FaEdit
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const getTodayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const SalaryManagement = ({ employeeId, baseSalary }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editModeId, setEditModeId] = useState(null);
    const [formData, setFormData] = useState({
        total_salary: baseSalary || 0,
        amount_paid: '',
        payment_month: '',
        issue_date: getTodayLocal()
    });

    useEffect(() => {
        fetchHistory();
    }, [employeeId]);

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get(`${window.API_BASE}/api/salary/history/${employeeId}`);
            if (data.success) {
                setHistory(data.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load salary history');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.payment_month) {
            toast.error("Please select a month and year");
            return;
        }

        const [year, month] = formData.payment_month.split('-');
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        const formattedDuration = `${monthName} ${year}`;

        try {
            if (editModeId) {
                const { data } = await axios.put(`${window.API_BASE}/api/salary/update/${editModeId}`, {
                    ...formData,
                    payment_duration: formattedDuration
                });
                if (data.success) {
                    toast.success('Salary payment updated');
                    setShowAddForm(false);
                    setEditModeId(null);
                    fetchHistory();
                }
            } else {
                const { data } = await axios.post(window.API_BASE + '/api/salary/pay', {
                    ...formData,
                    payment_duration: formattedDuration,
                    employee_id: employeeId
                });
                if (data.success) {
                    toast.success('Salary payment recorded');
                    setShowAddForm(false);
                    fetchHistory();
                }
            }
        } catch (error) {
            toast.error(editModeId ? 'Failed to update payment' : 'Failed to record payment');
        }
    };

    const handleEditClick = (record) => {
        let yyyy_mm = "";
        try {
            const date = new Date(`${record.payment_duration} 1`);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            yyyy_mm = `${date.getFullYear()}-${month}`;
        } catch (e) { }

        setFormData({
            total_salary: record.total_salary,
            amount_paid: record.amount_paid,
            payment_month: yyyy_mm,
            issue_date: record.issue_date || getTodayLocal()
        });
        setEditModeId(record.payment_id);
        setShowAddForm(true);
    };

    const clearBalance = async (paymentId, total, currentPaid) => {
        try {
            const { data } = await axios.put(`${window.API_BASE}/api/salary/update/${paymentId}`, {
                amount_paid: total,
                remaining_paid_date: getTodayLocal()
            });
            if (data.success) {
                toast.success('Balance cleared');
                fetchHistory();
            }
        } catch (error) {
            toast.error('Failed to clear balance');
        }
    };

    const deleteRecord = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await axios.delete(`${window.API_BASE}/api/salary/delete/${id}`);
            toast.success('Record deleted');
            fetchHistory();
        } catch (error) {
            toast.error('Failed to delete record');
        }
    };

    const totalPaid = history.reduce((acc, curr) => acc + parseFloat(curr.amount_paid), 0);
    const totalRemaining = history.reduce((acc, curr) => acc + parseFloat(curr.remaining_amount), 0);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <FaMoneyBillWave className="text-emerald-500" /> Salary Management
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Track monthly payouts and pending balances</p>
                </div>
                <button
                    onClick={() => {
                        const nextState = !showAddForm;
                        setShowAddForm(nextState);
                        if (!nextState) {
                            setEditModeId(null);
                            setFormData({ total_salary: baseSalary || 0, amount_paid: '', payment_month: '', issue_date: getTodayLocal() });
                        }
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl transition-all active:scale-95 text-xs shadow-lg shadow-indigo-100"
                >
                    {showAddForm ? 'CANCEL' : <><FaPlus /> ADD PAYMENT</>}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Base Monthly Salary</p>
                    <p className="text-2xl font-black text-indigo-700">₹{baseSalary ? parseInt(baseSalary).toLocaleString() : '0'}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Paid (Lifetime)</p>
                    <p className="text-2xl font-black text-emerald-700">₹{totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Remaining Balance</p>
                    <p className="text-2xl font-black text-rose-700">₹{totalRemaining.toLocaleString()}</p>
                </div>
            </div>

            {showAddForm && (
                <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Duration (Month/Year)</label>
                        <input
                            type="month" name="payment_month"
                            value={formData.payment_month} onChange={handleInputChange} required
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Total Salary (₹)</label>
                        <input
                            type="number" name="total_salary"
                            value={formData.total_salary} onChange={handleInputChange} required
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Amount Paid (₹)</label>
                        <input
                            type="number" name="amount_paid"
                            value={formData.amount_paid} onChange={handleInputChange} required
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold"
                        />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="w-full bg-emerald-600 text-white font-black p-2 rounded-lg text-xs hover:bg-emerald-700 transition-colors uppercase">
                            {editModeId ? 'Update Payment' : 'Record Payment'}
                        </button>
                    </div>
                </motion.form>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                            <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (Total/Paid)</th>
                            <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining</th>
                            <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                            <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-10 text-center text-slate-400 font-bold text-sm italic">No payment history found</td>
                            </tr>
                        ) : (
                            history.map((record) => (
                                <tr key={record.payment_id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                                                <FaCalendarAlt size={12} />
                                            </div>
                                            <span className="font-black text-slate-700 text-sm">{record.payment_duration}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${record.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' :
                                            record.status === 'Partial' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="text-xs font-black text-slate-700">₹{record.amount_paid}</div>
                                        <div className="text-[9px] font-bold text-slate-400">Total: ₹{record.total_salary}</div>
                                    </td>
                                    <td className="py-4 font-black text-rose-500 text-sm">
                                        {record.remaining_amount > 0 ? `₹${record.remaining_amount}` : '--'}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                                <span className="text-slate-500 font-black uppercase">Issued:</span> {record.issue_date ? record.issue_date.split('-').reverse().join('/') : '--'}
                                            </div>
                                            {record.remaining_paid_date && (
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                                                    <span className="text-emerald-600 font-black uppercase">Cleared:</span> {record.remaining_paid_date.split('-').reverse().join('/')}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {record.remaining_amount > 0 && (
                                                <button
                                                    onClick={() => clearBalance(record.payment_id, record.total_salary, record.amount_paid)}
                                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-md transition-all title='Clear Balance'"
                                                    title="Clear Balance"
                                                >
                                                    <FaCheckCircle size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditClick(record)}
                                                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-md transition-all"
                                                title="Edit Record"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={() => deleteRecord(record.payment_id)}
                                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-md transition-all"
                                                title="Delete Record"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
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

export default SalaryManagement;
