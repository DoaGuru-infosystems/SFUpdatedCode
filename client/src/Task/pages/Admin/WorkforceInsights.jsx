import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaChartPie,
  FaXmark,
  FaUsers,
  FaMoneyBillWave,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaBuilding,
  FaHandHoldingHeart,
  FaBoxesStacked,
  FaFileInvoiceDollar,
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaPenToSquare
} from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';

// ═══ Dummy Data for Subscription Management (Mock API) ═══
const DUMMY_REVENUE = [
  { id: 1, client: "Jabalpur Hospital", service: "Digital Marketing", amount: 39400, date: "Jan-31" },
  { id: 2, client: "Ayushi Construction", service: "Digital Marketing", amount: 50000, date: "Jan-31" },
  { id: 3, client: "Enejh Herbal", service: "Digital Marketing", amount: 24000, date: "Jan-31" },
  { id: 4, client: "Jyotirmay IVF Rewa", service: "Digital Marketing", amount: 40000, date: "Jan-31" },
  { id: 5, client: "Jabalpur IVF", service: "Digital Marketing", amount: 42850, date: "Jan-31" },
  { id: 6, client: "Life Medicity Hospital", service: "Digital Marketing", amount: 36000, date: "16-15" },
  { id: 7, client: "Narayana Institute", service: "Digital Marketing", amount: 51800, date: "06-May" },
  { id: 8, client: "RAB MALL", service: "Digital Marketing", amount: 20000, date: "13-Dec" },
  { id: 9, client: "Chandrayu", service: "Digital Marketing", amount: 15000, date: "Jan-31" },
  { id: 10, client: "Nidhivan/Starfarm Developers", service: "Digital Marketing", amount: 20000, date: "10-Sep" },
  { id: 11, client: "Jan Jyoti Eye Hospital", service: "Digital Marketing", amount: 60000, date: "Jan-31" },
  { id: 12, client: "Oh Bombay Milton", service: "Digital Marketing", amount: 20000, date: "16-15" },
  { id: 13, client: "Doon International School", service: "Digital Marketing", amount: 30000, date: "Jan-31" },
  { id: 14, client: "Dr. Devkriti Tiwari", service: "Digital Marketing", amount: 28000, date: "30-29" },
  { id: 15, client: "Eywaa (Dr. Shakti Sharma)", service: "Digital Marketing", amount: 16500, date: "16-15" },
  { id: 16, client: "Dr Abhishek Goswami", service: "Digital Marketing", amount: 5000, date: "18-17" },
  { id: 17, client: "Vardaan Hospital", service: "Digital Marketing", amount: 20000, date: "N/A" },
  { id: 18, client: "Just Jabalpur", service: "Digital Marketing", amount: 12000, date: "N/A" },
];

const DUMMY_EXPENSES = [
  { id: 1, category: "Office Rent", amount: 65000, date: "2024-04-01" },
  { id: 2, category: "Electricity Bill", amount: 12000, date: "2024-04-05" },
  { id: 3, category: "Server Hosting", amount: 8500, date: "2024-04-02" },
  { id: 4, category: "Office Maintenance", amount: 5000, date: "2024-04-10" },
  { id: 5, category: "Marketing Tools", amount: 15000, date: "2024-04-07" },
];

const DUMMY_PRODUCTS = [
  { id: 1, name: "Dentalguru Pro", income: 0, date: "2024-04-24" },
  { id: 2, name: "Dentalguru Lite", income: 0, date: "2024-04-24" },
  { id: 3, name: "CRM Guru", income: 0, date: "2024-04-24" },
  { id: 4, name: "MedBrainiX", income: 0, date: "2024-04-24" },
];

const WorkforceInsights = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // OTP Verification State
  const [isVerified, setIsVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, expensesRes] = await Promise.all([
          axios.get(window.API_BASE + "/api/users"),
          axios.get(window.API_BASE + "/api/get-expenses")
        ]);
        console.log("Users fetched:", usersRes.data);
        console.log("Expenses fetched:", expensesRes.data);
        setUsers(usersRes.data);
        setExpenses(expensesRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Check OTP verification
    const verified = sessionStorage.getItem('workforce_verified');
    if (verified === 'true') {
      setIsVerified(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  // OTP Handlers
  const handleSendOtp = async () => {
    setOtpLoading(true);
    try {
      await axios.post(window.API_BASE + "/api/send-admin-otp");
      setOtpSent(true);
      alert("OTP has been sent to your registered email.");
    } catch (error) {
      console.error("Failed to send OTP:", error);
      alert(error.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      alert("Please enter a valid OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await axios.post(window.API_BASE + "/api/verify-admin-otp", { otp });
      if (res.data.success) {
        setIsVerified(true);
        sessionStorage.setItem('workforce_verified', 'true');
        setLoading(true); // show loader while fetching
        // Fetch data manually here since useEffect won't trigger again
        const [usersRes, expensesRes] = await Promise.all([
          axios.get(window.API_BASE + "/api/users"),
          axios.get(window.API_BASE + "/api/get-expenses")
        ]);
        setUsers(usersRes.data);
        setExpenses(expensesRes.data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      alert(error.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleExpenseAction = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      if (editingExpense) {
        await axios.put(`${window.API_BASE}/api/update-expense/${editingExpense.id}`, expenseForm);
        setExpenses(expenses.map(ex => ex.id === editingExpense.id ? { ...ex, ...expenseForm } : ex));
      } else {
        const res = await axios.post(window.API_BASE + "/api/add-expense", expenseForm);
        setExpenses([{ id: res.data.id, ...expenseForm }, ...expenses]);
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      setExpenseForm({ category: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Expense action failed:", error);
      alert("Failed to process expense. Please check server.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await axios.delete(`${window.API_BASE}/api/delete-expense/${id}`);
      setExpenses(expenses.filter(ex => ex.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // ═══ Data Processing Logic ═══
  const dashboardStats = useMemo(() => {
    if (loading) return null;

    const deptMap = new Map();
    let totalPayroll = 0;
    const activeEmployees = users.filter(u => u.employment_status?.toLowerCase() === "active");

    activeEmployees.forEach(emp => {
      const dept = (emp.department || "Unassigned").trim().toUpperCase();
      const salary = parseFloat(emp.salary_amount) || 0;

      if (!deptMap.has(dept)) {
        deptMap.set(dept, { count: 0, totalSalary: 0 });
      }
      const deptData = deptMap.get(dept);
      deptData.count += 1;
      deptData.totalSalary += salary;
      totalPayroll += salary;
    });

    const totalServiceIncome = DUMMY_REVENUE.reduce((sum, item) => sum + item.amount, 0);
    const totalProductIncome = DUMMY_PRODUCTS.reduce((sum, item) => sum + item.income, 0);
    const totalRevenue = totalServiceIncome + totalProductIncome;

    const totalOfficeExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalOutgoing = totalPayroll + totalOfficeExpenses;

    return {
      departments: Array.from(deptMap.entries()).map(([name, data]) => ({ name, ...data })),
      totalActive: activeEmployees.length,
      totalPayroll,
      totalRevenue,
      totalServiceIncome,
      totalProductIncome,
      totalOfficeExpenses,
      totalOutgoing,
      netProfit: totalRevenue - totalOutgoing
    };
  }, [users, expenses, loading]);

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === id
        ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100"
        : "text-white/60 hover:text-white hover:bg-white/10"
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  // Render OTP Verification Screen if not verified
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -ml-48 -mt-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] -mr-48 -mb-48"></div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[3rem] shadow-2xl max-w-md w-full relative z-10 animate-slide-up">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-indigo-500/30">
              <FaUsers size={36} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-3">Authentication Required</h2>
            <p className="text-sm font-medium text-white/60">
              Workforce Insights is restricted. You must verify your identity via Email OTP to proceed.
            </p>
          </div>

          {!otpSent ? (
            <button
              onClick={handleSendOtp}
              disabled={otpLoading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
            >
              {otpLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Send OTP to Email"}
            </button>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-1 text-center block">Enter Email OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="------"
                  maxLength={6}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-2xl font-black text-white tracking-[0.5em] text-center focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-white/20"
                />
              </div>
              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
              >
                {otpLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Verify & Access Data"}
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full py-2 text-center text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
              >
                Resend OTP
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ═══ Top Navigation Bar ═══ */}
      <div className="bg-indigo-600 p-8 shadow-2xl shadow-indigo-100 mb-8 rounded-b-[3rem]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-6 text-white">
              <div className="p-4 bg-white/20 rounded-[2rem] backdrop-blur-md shadow-inner">
                <FaChartPie size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Company Control Dashboard</h2>
                <p className="text-[12px] font-bold text-white/70 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Live Financial & Personnel Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-3 active:scale-95 text-white font-black uppercase text-[11px] tracking-widest"
            >
              <FaXmark size={18} /> Close Tab
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <TabButton id="summary" label="Overview" icon={FaChartPie} />
            <TabButton id="revenue" label="Revenue Tracking" icon={FaArrowTrendUp} />
            <TabButton id="expenses" label="Burn Analysis" icon={FaArrowTrendDown} />
            <TabButton id="workforce" label="Human Capital" icon={FaUsers} />
          </div>
        </div>
      </div>

      {/* ═══ Main Content Area ═══ */}
      <div className="max-w-7xl mx-auto px-6">

        {/* ═══ SUMMARY TAB ═══ */}
        {activeTab === 'summary' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:translate-y-[-4px]">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Current Monthly Revenue</p>
                <p className="text-4xl font-black text-indigo-600">₹ {dashboardStats.totalRevenue.toLocaleString()}</p>
                <div className="mt-6 flex items-center gap-2 text-[11px] font-black text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-xl">
                  <FaArrowTrendUp /> +12.5% Performance
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:translate-y-[-4px]">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Operational Burn</p>
                <p className="text-4xl font-black text-rose-600">₹ {dashboardStats.totalOutgoing.toLocaleString()}</p>
                <div className="mt-6 flex items-center gap-2 text-[11px] font-black text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-xl">
                  <FaArrowTrendDown /> -2.4% Optimization
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl shadow-indigo-100/50 bg-gradient-to-br from-indigo-50 to-white transition-all hover:scale-[1.02]">
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-4">Net Forecasted Profit</p>
                <p className="text-4xl font-black text-indigo-700">₹ {dashboardStats.netProfit.toLocaleString()}</p>
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-indigo-400">
                    <span>Target Achievement</span>
                    <span>84%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[84%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><FaBuilding /></div>
                  Operational Health Metrics
                </h3>
                <div className="space-y-6">
                  {[
                    { label: "Payroll Utilization", val: Math.round((dashboardStats.totalPayroll / dashboardStats.totalRevenue) * 100), color: "bg-amber-500" },
                    { label: "Office Overheads", val: Math.round((dashboardStats.totalOfficeExpenses / dashboardStats.totalRevenue) * 100), color: "bg-sky-500" },
                    { label: "Profit Margin", val: Math.round((dashboardStats.netProfit / dashboardStats.totalRevenue) * 100), color: "bg-emerald-500" }
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] font-black uppercase mb-2 tracking-tighter">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="text-slate-800">{item.val}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-10 opacity-60 flex items-center gap-2">
                  <FaUsers /> Global Workforce Distribution
                </h3>
                <div className="flex items-end justify-between relative z-10">
                  <div>
                    <p className="text-7xl font-black text-white tracking-tighter">{dashboardStats.totalActive}</p>
                    <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-white/40 mt-2">Active Personnel</p>
                  </div>
                  <div className="flex flex-col gap-3 items-end">
                    <div className="px-4 py-2 bg-white/10 rounded-[1rem] text-[11px] font-black uppercase tracking-widest border border-white/5 backdrop-blur-md">
                      {dashboardStats.departments.length} Business Depts
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-[1rem] text-[11px] font-black uppercase tracking-widest border border-emerald-500/20">
                      Full Capacity
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ REVENUE TAB ═══ */}
        {activeTab === 'revenue' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border-b-4 border-indigo-500 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Service Credit</p>
                  <p className="text-4xl font-black text-indigo-600">₹ {dashboardStats.totalServiceIncome.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-inner">
                  <FaFileInvoiceDollar size={32} />
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border-b-4 border-emerald-500 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Product SaaS Income</p>
                  <p className="text-4xl font-black text-emerald-600">₹ {dashboardStats.totalProductIncome.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[2rem] shadow-inner">
                  <FaBoxesStacked size={32} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-8 py-5">Client Identity / Product Name</th>
                    <th className="px-8 py-5">Vertical Category</th>
                    <th className="px-8 py-5">Transaction Date</th>
                    <th className="px-8 py-5 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...DUMMY_REVENUE, ...DUMMY_PRODUCTS.map(p => ({ client: p.name, service: "SaaS Product", amount: p.income, date: p.date }))].map((item, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-8 py-5 text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{item.client}</td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-200">
                          {item.service}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-400">{item.date}</td>
                      <td className="px-8 py-5 text-right text-sm font-black text-emerald-600 tracking-tight">₹ {item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ EXPENSES TAB ═══ */}
        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl flex items-center justify-between overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
              <div className="relative z-10">
                <p className="text-[12px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Total Organization Outflow</p>
                <p className="text-6xl font-black text-white tracking-tighter">₹ {dashboardStats.totalOutgoing.toLocaleString()}</p>
                <div className="mt-6 flex items-center gap-4">
                  <span className="px-4 py-2 bg-white/10 rounded-xl text-[11px] font-black uppercase border border-white/5">Burn Index: 0.84</span>
                  <span className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl text-[11px] font-black uppercase border border-rose-500/20 tracking-widest">Optimized Payout</span>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[11px] font-black text-white/30 uppercase mb-2">Payroll Intensity</p>
                <p className="text-4xl font-black text-white/90">{Math.round((dashboardStats.totalPayroll / dashboardStats.totalOutgoing) * 100)}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <FaMoneyBillWave className="text-indigo-600" /> Organization Cost Centers
              </h3>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseForm({ category: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
                  setIsExpenseModalOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
              >
                <FaPlus /> Add New Expense
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-8 py-5">Operational Cost Center</th>
                    <th className="px-8 py-5">Allocation Cycle</th>
                    <th className="px-8 py-5 text-right">Debit Balance</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-rose-50/50 group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"><FaUsers size={18} /></div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Active Employee Payroll</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Across {dashboardStats.departments.length} Departments</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Recurring Monthly</td>
                    <td className="px-8 py-6 text-right text-lg font-black text-rose-600 tracking-tighter">₹ {dashboardStats.totalPayroll.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-[9px] font-black uppercase text-slate-300 italic">Managed via HR</span>
                    </td>
                  </tr>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-20 text-center text-slate-400 italic font-medium">No operational expenses recorded yet. Click "Add New Expense" to begin.</td>
                    </tr>
                  ) : (
                    expenses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-800">{item.category}</p>
                          {item.description && <p className="text-[10px] text-slate-400 font-medium">{item.description}</p>}
                        </td>
                        <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(item.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-6 text-right text-sm font-black text-slate-600 tracking-tight">₹ {parseFloat(item.amount).toLocaleString()}</td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingExpense(item);
                                setExpenseForm({ ...item, expense_date: item.expense_date.split('T')[0] });
                                setIsExpenseModalOpen(true);
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                            >
                              <FaPenToSquare size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(item.id)}
                              className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                            >
                              <FaTrash size={12} />
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
        )}

        {/* ═══ WORKFORCE TAB ═══ */}
        {activeTab === 'workforce' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm gap-8">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl shadow-indigo-200">
                  <FaUsers />
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Organization Talent</p>
                  <p className="text-5xl font-black text-slate-800 tracking-tighter">{dashboardStats.totalActive}</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Personnel Payout</p>
                <p className="text-4xl font-black text-indigo-600 tracking-tighter">₹ {dashboardStats.totalPayroll.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-10 py-6">Department Identity</th>
                    <th className="px-10 py-6 text-center">Active Talent Count</th>
                    <th className="px-10 py-6 text-right">Departmental Expenditure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {dashboardStats.departments.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/50 transition-all duration-200 group">
                      <td className="px-10 py-6">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{dept.name}</span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-2xl text-[11px] font-black border border-indigo-100 uppercase tracking-widest shadow-sm">
                          {dept.count} Members
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span className="text-base font-black text-slate-900 tracking-tighter">₹ {dept.totalSalary.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 animate-slide-up">
        <button
          onClick={() => window.close()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-600 transition-all"
        >
          <FaXmark size={14} /> Close Matrix
        </button>
        <div className="w-px h-4 bg-slate-200 mx-2"></div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all"
        >
          Export Intelligence
        </button>
      </div>

      {/* ═══ Expense Management Modal ═══ */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-slide-up border border-white overflow-hidden">
            <div className="bg-indigo-600 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl"><FaMoneyBillWave size={20} /></div>
                <h3 className="text-lg font-black uppercase tracking-tight">{editingExpense ? 'Update Expense' : 'Register New Expense'}</h3>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"><FaXmark /></button>
            </div>

            <form onSubmit={handleExpenseAction} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Expense Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Rent, Electricity, Server..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Brief Description (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Add some details about this expense..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all resize-none"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all uppercase text-[11px] tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {isActionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingExpense ? 'Update Entry' : 'Confirm Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforceInsights;
