import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Users, BarChart2, Clock, Plus, Download,
  GraduationCap, Handshake, AlertTriangle, ClipboardList,
  Trophy, Wallet, Eye, TrendingUp, LayoutDashboard
} from "lucide-react";

const quickActions = [
  { label: "Offer Letter",       href: "/task/letters/Offer-Letter-Genrate",        icon: FileText,       color: "text-primary-light",    bg: "bg-primary/10 border-primary/20 hover:bg-primary/20" },
  { label: "Internship Letter",  href: "/task/letters/intern-offer-letter",          icon: GraduationCap,  color: "text-sky-400",          bg: "bg-sky-400/10 border-sky-400/20 hover:bg-sky-400/20" },
  { label: "Relieving Letter",   href: "/task/letters/Relieving-Letter-Genrate",     icon: Handshake,      color: "text-emerald-400",      bg: "bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/20" },
  { label: "Warning Letter",     href: "/task/letters/warning-letter-genrate",       icon: AlertTriangle,  color: "text-amber-400",        bg: "bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20" },
  { label: "Termination Letter", href: "/task/letters/Termination-Letter-Genrate",   icon: ClipboardList,  color: "text-red-400",          bg: "bg-red-400/10 border-red-400/20 hover:bg-red-400/20" },
  { label: "Experience Letter",  href: "/task/letters/experince-letter-genrate",     icon: Trophy,         color: "text-violet-400",       bg: "bg-violet-400/10 border-violet-400/20 hover:bg-violet-400/20" },
  { label: "Salary Slip",        href: "/task/letters/salary-slip",                  icon: Wallet,         color: "text-primary-light",    bg: "bg-primary/10 border-primary/20 hover:bg-primary/20" },
  { label: "View Letters",       href: "/task/letters/OfferLetter",                  icon: Eye,            color: "text-sky-400",          bg: "bg-sky-400/10 border-sky-400/20 hover:bg-sky-400/20" },
];

function HomePage() {
  const [offerLetters, setOfferLetters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/offer-letters`)
      .then((res) => setOfferLetters(res.data))
      .catch((err) => console.error("Failed to fetch offer letters:", err))
      .finally(() => setLoading(false));
  }, []);

  const thisMonth = loading ? "..." : offerLetters.filter((l) => {
    if (!l.createdAt) return true;
    const d = new Date(l.createdAt); const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const recent7Days = loading ? "..." : offerLetters.filter((l) => {
    if (!l.createdAt) return false;
    return Math.ceil(Math.abs(new Date() - new Date(l.createdAt)) / (1000 * 60 * 60 * 24)) <= 7;
  }).length;

  const stats = [
    {
      Icon: FileText, iconColor: "#38bdf8", iconRing: "rgba(56,189,248,0.12)",
      number: loading ? "..." : offerLetters.length,
      label: "Total Generated Letters", change: "All time records",
      href: "/task/letters/report?filter=all",
    },
    {
      Icon: Users, iconColor: "#818cf8", iconRing: "rgba(129,140,248,0.12)",
      number: thisMonth,
      label: "Generated This Month",
      change: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
      href: "/task/letters/report?filter=this-month",
    },
    {
      Icon: BarChart2, iconColor: "#34d399", iconRing: "rgba(52,211,153,0.12)",
      number: loading ? "..." : offerLetters.filter((l) => l.designation).length,
      label: "With Designation Set", change: "Of total letters",
      href: "/task/letters/report?filter=designation",
    },
    {
      Icon: Clock, iconColor: "#fbbf24", iconRing: "rgba(251,191,36,0.12)",
      number: recent7Days,
      label: "Recent Generations", change: "Last 7 days",
      href: "/task/letters/report?filter=recent",
    },
  ];

  return (
    <div className="flex-1 px-6 py-8 max-w-[1400px] mx-auto w-full">

      {/* Header */}
      <div className="mb-8 animate-[fadeInUp_0.4s_ease]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {/* <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-light bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wide mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
              Live Dashboard
            </div> */}
            {/* <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
              Welcome back,{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">DOAGuru</span>
            </h1> */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/task/letters/Offer-Letter-Genrate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)]"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)" }}>
              <Plus size={16} /> New Letter
            </Link>
            <Link to="/task/letters/download/offer-letter"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 text-sm font-semibold no-underline border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] transition-all duration-200 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20">
              <Download size={16} /> Downloads
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map(({ Icon, iconColor, iconRing, number, label, change, href }, i) => (
          <Link key={i} to={href}
            className="group relative block bg-white dark:bg-brand-card border border-gray-100 dark:border-white/[0.06] rounded-2xl p-6 no-underline transition-all duration-200 overflow-hidden hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_0_30px_rgba(99,102,241,0.1)]">
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: iconRing, color: iconColor }}>
              <Icon size={22} strokeWidth={1.8} />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{number}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{label}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full mt-3">
              <TrendingUp size={11} /> {change}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <LayoutDashboard size={18} className="text-primary-light" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map(({ label, href, icon: Icon, color, bg }, i) => (
            <Link key={i} to={href}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-center ${bg}`}>
              <Icon size={22} className={color} strokeWidth={1.8} />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Overview */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart2 size={18} className="text-primary-light" /> Overview
        </h2>
        <div className="bg-white dark:bg-brand-card border border-gray-100 dark:border-white/[0.06] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 min-h-[160px]">
          <TrendingUp size={40} className="text-primary/40" strokeWidth={1.5} />
          <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
            {loading ? "Loading data..." : `${offerLetters.length} letters generated so far`}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Activity analytics coming soon</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
