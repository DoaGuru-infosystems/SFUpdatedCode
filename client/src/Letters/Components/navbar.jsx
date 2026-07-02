import CLogo from "../assets/images/CLogo.png";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, FileText, Download, BarChart2,
  ChevronDown, ChevronRight, Menu, X, LogOut, Sun, Moon, User
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/task/letters", icon: LayoutDashboard },
  {
    name: "Generate Letter", href: "#", icon: FileText,
    subMenu: [
      {
        name: "Intern",
        subMenu: [
          { name: "Offer Letter", href: "/task/letters/intern-offer-letter" },
          { name: "Experience Letter", href: "/task/letters/intern-experience-letter" },
          { name: "PPO (Pre-Placement Offer) Letter", href: "/task/letters/intern-ppo-letter" },
          { name: "Other Letters", href: "/intern-other-letters" },
        ],
      },
      {
        name: "Employee",
        subMenu: [
          { name: "Offer Letter", href: "/task/letters/Offer-Letter-Genrate" },
          { name: "Experience Letter", href: "/task/letters/experince-letter-genrate" },
          { name: "Relieving Letter", href: "/task/letters/Relieving-Letter-Genrate" },
          { name: "Termination Letter", href: "/task/letters/Termination-Letter-Genrate" },
          { name: "Warning Letter", href: "/task/letters/warning-letter-genrate" },
          { name: "Salary Slip", href: "/task/letters/salary-slip" },
        ],
      },
    ],
  },
  {
    name: "Download Letter", href: "#", icon: Download,
    subMenu: [
      {
        name: "Intern Letters",
        subMenu: [
          { name: "Download Offer Letter", href: "/task/letters/download/intern-offer-letter" },
          { name: "Download Experience Letter", href: "/task/letters/download/intern-experience-letter" },
          { name: "Download PPO Letter", href: "/task/letters/download/intern-ppo-letter" },
        ],
      },
      {
        name: "Employee Letters",
        subMenu: [
          { name: "Download Offer Letter", href: "/task/letters/download/offer-letter" },
          { name: "Download Experience Letter", href: "/task/letters/download/experience-letter" },
          { name: "Download Relieving Letter", href: "/task/letters/download/relieving-letter" },
          { name: "Download Termination Letter", href: "/task/letters/download/termination-letter" },
          { name: "Download Salary Slip", href: "/task/letters/download/salary-slip" },
        ],
      },
    ],
  },
  { name: "Report", href: "/task/letters/report", icon: BarChart2 },
];

export default function Navbar() {
  const [token, setToken] = useState(localStorage.getItem("token") || localStorage.getItem("user"));
  const [userName, setUserName] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.full_name || "DG";
    } catch {
      return "DG";
    }
  });
  const [openMenu, setOpenMenu] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || localStorage.getItem("user");
    if (savedToken) {
      setToken(savedToken);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        setUserName(user?.full_name || "DG");
      } catch {
        setUserName("DG");
      }
    }
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null); setShowProfile(false); setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpenMenu(null); setShowProfile(false); setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setToken(null); navigate("/");
  };

  const isActive = (href) => location.pathname === href;
  if (!token) return null;

  const linkBase = "relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap bg-transparent border-none";
  const linkIdle = "text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10";
  const linkActive = "text-primary bg-primary/10 dark:text-primary-light dark:bg-primary/10";
  const dropItem = "flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 no-underline cursor-pointer transition-all duration-200 hover:text-gray-900 dark:hover:text-white hover:bg-primary/10";

  return (
    <nav ref={navRef} className="sticky top-0 z-[100] bg-white/90 dark:bg-brand-bg/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-6 flex items-center h-16 gap-4">

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navigation.map((item) => {
            const Icon = item.icon;
            if (!item.subMenu) {
              return (
                <Link key={item.name} to={item.href}
                  className={`${linkBase} ${isActive(item.href) ? linkActive : linkIdle}`}>
                  {Icon && <Icon size={15} />}
                  {item.name}
                  {isActive(item.href) && (
                    <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-gradient-primary rounded-full" />
                  )}
                </Link>
              );
            }
            return (
              <div key={item.name} className="relative">
                <button
                  className={`${linkBase} ${openMenu === item.name ? linkActive : linkIdle}`}
                  onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === item.name ? null : item.name); }}
                >
                  {Icon && <Icon size={15} />}
                  {item.name}
                  <ChevronDown size={13} className="transition-transform duration-200" style={{ transform: openMenu === item.name ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>

                {openMenu === item.name && (
                  <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 min-w-[220px] bg-white/95 dark:bg-[rgba(20,20,35,0.97)] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-2 animate-[fadeInUpCentered_0.2s_ease] z-[200]"
                    onClick={(e) => e.stopPropagation()}>
                    {item.subMenu.map((subItem) => (
                      <div key={subItem.name} className="relative group">
                        {subItem.subMenu ? (
                          <div className={dropItem}>
                            <span className="font-semibold text-xs text-primary-light uppercase tracking-wider">{subItem.name}</span>
                            <ChevronRight size={13} />
                            <div className="absolute left-full top-0 min-w-[220px] bg-white/95 dark:bg-[rgba(20,20,35,0.97)] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-2 ml-1 hidden group-hover:block z-[201]">
                              {subItem.subMenu.map((child) => (
                                <Link key={child.name} to={child.href} className={dropItem + " block"} onClick={() => setOpenMenu(null)}>
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Link to={subItem.href} className={dropItem + " block"} onClick={() => setOpenMenu(null)}>
                            {subItem.name}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors bg-transparent border-none cursor-pointer"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden flex flex-col px-4 py-3 gap-1 border-t border-gray-100 dark:border-white/[0.06] animate-[fadeInUp_0.2s_ease]">
          {navigation.map((item) => {
            const Icon = item.icon;
            if (!item.subMenu) {
              return (
                <Link key={item.name} to={item.href}
                  className={`${linkBase} w-full justify-start ${isActive(item.href) ? linkActive : linkIdle}`}>
                  {Icon && <Icon size={15} />} {item.name}
                </Link>
              );
            }
            return (
              <div key={item.name}>
                <button className={`${linkBase} w-full justify-between ${linkIdle}`}
                  onClick={() => setOpenMenu(openMenu === item.name ? null : item.name)}>
                  <span className="flex items-center gap-1.5">{Icon && <Icon size={15} />}{item.name}</span>
                  <ChevronDown size={13} className="transition-transform duration-200" style={{ transform: openMenu === item.name ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {openMenu === item.name && (
                  <div className="pl-4 border-l-2 border-gray-200 dark:border-white/10 ml-3.5 mt-1 mb-1">
                    {item.subMenu.map((subItem) =>
                      subItem.subMenu ? (
                        <div key={subItem.name}>
                          <p className="text-xs font-semibold text-primary-light uppercase tracking-widest px-3.5 py-2">{subItem.name}</p>
                          {subItem.subMenu.map((child) => (
                            <Link key={child.name} to={child.href}
                              className={`${linkBase} w-full justify-start ${linkIdle}`}
                              onClick={() => setMobileOpen(false)}>{child.name}</Link>
                          ))}
                        </div>
                      ) : (
                        <Link key={subItem.name} to={subItem.href}
                          className={`${linkBase} w-full justify-start ${linkIdle}`}
                          onClick={() => setMobileOpen(false)}>{subItem.name}</Link>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="h-px bg-gray-100 dark:bg-white/[0.06] my-1" />
          <button onClick={handleLogout}
            className={`${linkBase} w-full justify-start text-red-500 gap-2`}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
