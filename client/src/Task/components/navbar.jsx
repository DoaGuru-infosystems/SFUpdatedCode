import CLogo from "../assets/images/NewCLogo.png";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import io from "socket.io-client";
const API_BASE = window.API_BASE || process.env.REACT_APP_API_URL || "https://sf.doaguru.com";

const baseNavigation = [
  { name: "Dashboard", href: "/task/UserHome" },
  {
    name: "Assign Data",
    children: [
      { name: "View Task", href: "/task/TaskView" },
      { name: "Assigned Projects", href: "/task/AssignProjectDetails" },
      // Conditional items will be added based on department
    ]
  },
  {
    name: "Reports",
    children: [
      { name: "Task Report", href: "/task/EmployeeTaskReport" },
      { name: "Attendance Report", href: "/task/employee-attendance-report" },
      { name: "Leave Report", href: "/task/employee-leave-report" },
    ]
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const buildNavigation = (userObj, profileObj) => {
  const merged = { ...(userObj || {}), ...(profileObj || {}) };
  const dept = (merged.department || "").trim().toLowerCase();
  const role = (merged.role || "").trim().toLowerCase();
  const designation = (merged.designation || "").trim().toLowerCase();

  const isTeamLead =
    role === "team_lead" ||
    role === "leader" ||
    designation.includes("lead") ||
    merged.id === 39 ||
    merged.id === 62;

  const assignDataChildren = [
    { name: "View Task", href: "/task/TaskView" },
    { name: "Assigned Projects", href: "/task/AssignProjectDetails" },
  ];

  if (dept === "development") {
    assignDataChildren.push({ name: "Assigned Development Task", href: "/task/check-assigned-development-task" });
  } else if (dept === "digital marketing" || dept === "seo" || dept === "sales") {
    assignDataChildren.push({ name: "Assigned Daily Target", href: "/task/AssignProjectTarget-Details" });
  }

  const items = [];

  if (isTeamLead) {
    // 1. Direct top-level button for Leader Dashboard & RE Projects
    items.push({
      name: "⚡ RE Projects (TL)",
      href: "/task/TeamLeaderDashboard",
      highlight: true,
    });

    // 2. Team Lead Actions Dropdown
    items.push({
      name: "Lead Actions",
      children: [
        { name: "⚡ RE Projects (New from RE)", href: "/task/TeamLeaderDashboard?tab=dashboard" },
        { name: "📊 Team Overview & Stats", href: "/task/TeamLeaderDashboard?tab=dashboard" },
        { name: "📋 Team Tasks", href: "/task/TeamLeaderDashboard?tab=team_tasks" },
        { name: "👥 Team Members", href: "/task/TeamLeaderDashboard?tab=team" },
        { name: "➕ Assign Task", href: "/task/TeamLeaderDashboard?tab=assign" },
        { name: "📌 Assigned Tasks", href: "/task/TeamLeaderDashboard?tab=assigned_tasks" },
      ],
    });

    // 3. Personal Work
    items.push({ name: "My Work", href: "/task/UserHome" });
  } else {
    items.push({ name: "Dashboard", href: "/task/UserHome" });
  }

  items.push({
    name: "Assign Data",
    children: assignDataChildren,
  });

  items.push({
    name: "Reports",
    children: [
      { name: "Task Report", href: "/task/EmployeeTaskReport" },
      { name: "Attendance Report", href: "/task/employee-attendance-report" },
      { name: "Leave Report", href: "/task/employee-leave-report" },
    ],
  });

  if (designation === "hr") {
    items.push({ name: "Letters", href: "/task/letters" });
    items.push({ name: "Scheduler", href: "/task/scheduler/" });
  }

  return items;
};

const getStoredUser = () => {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
};

export default function Navbar({ Logout, render }) {
  const [user, setUser] = useState(() => localStorage.getItem("user"));
  const [userName, setUserName] = useState("User name");
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [navigation, setNavigation] = useState(() => buildNavigation(getStoredUser(), null));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored?.id) return;
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/getEmployee/${stored.id}`
        );
        if (response.data) {
          setProfile(response.data);
          setNavigation(buildNavigation(stored, response.data));
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchEmployeeData();
  }, [render]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const loggedInUser = JSON.parse(userStr);
        const response = await axios.get(
          `${API_BASE}/api/scheduler/notifications/unread?employee_id=${loggedInUser.id}`
        );
        setUnreadCount(response.data.length);
      } catch (err) {
        console.error("Error fetching unread notifications count:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [render]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ["polling", "websocket"],
      withCredentials: true
    });

    try {
      const uStr = localStorage.getItem("user");
      if (uStr) {
        const uObj = JSON.parse(uStr);
        if (uObj?.id) {
          socket.emit("join_employee_room", uObj.id);
        }
      }
    } catch (e) {}

    socket.on("new-scheduler-notification", (notif) => {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const loggedInUser = JSON.parse(userStr);

      if (notif.employee_id === loggedInUser.id) {
        console.log("🔔 New Real-time Scheduler Notification received:", notif);
        setUnreadCount((prev) => prev + 1);

        // Play sound
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play().catch(err => {
            console.log("Autoplay blocked by browser policy:", err.message);
          });
        } catch (e) {
          console.error("Audio playback error:", e);
        }

        // Show Native Notification
        if ("Notification" in window && Notification.permission === "granted") {
          const title = `DG Workspace: Scheduler Alert`;
          const options = {
            body: notif.message_body,
            icon: "https://doaguru.com/static/media/doagurulogo-removebg.b0126812bbe704a27f8f.webp",
            badge: "https://doaguru.com/static/media/doagurulogo-removebg.b0126812bbe704a27f8f.webp",
            tag: String(notif.id),
            requireInteraction: true
          };
          new Notification(title, options);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    setNavigation(buildNavigation(stored, profile));
  }, [profile, render]);

  useEffect(() => {
    setUser(localStorage.getItem("user"));
    let obj = localStorage.getItem("user");
    obj = JSON.parse(obj);
    setUserName(obj?.full_name || "User name");
  }, [render]);

  // Use optional chaining to avoid accessing properties on null
  const profileImageSrc = profile?.profileIMG
    ? profile.profileIMG.replace(window.API_BASE, window.API_BASE)
    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSt9ISaBFDC88ejiGrYACSt81CFq21QsZ6bow&s";

  return (
    <Disclosure as="nav" className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-full lg:mx-5 px-2 lg:px-3 lg:px-1">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
                {!user || (
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                )}
              </div>
              <div className="flex flex-1 items-center ms-12 lg:items-stretch lg:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-12 w-auto"
                    src={CLogo}
                    alt="DOAGuru Infosystem"
                  />
                </div>
                <div className="hidden lg:ml-6 lg:block">
                  {!user || (
                    <div className="flex space-x-2">
                      {navigation.map((item) => {
                        if (item.children) {
                          return (
                            <Menu as="div" key={item.name} className="relative">
                              <div>
                                <Menu.Button className={classNames(
                                  "text-slate-700 hover:bg-slate-100 hover:text-indigo-600",
                                  "rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-1 transition-colors"
                                )}>
                                  {item.name}
                                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </Menu.Button>
                              </div>
                              <Transition
                                as="div"
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute left-0 z-50 mt-2 w-52 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none border border-slate-100 py-1">
                                  <div className="py-1">
                                    {item.children.map((childItem) => {
                                      const isChildActive = location.pathname === childItem.href;
                                      return (
                                        <Menu.Item key={childItem.name}>
                                          {({ active }) => (
                                            <Link
                                              to={childItem.href}
                                              className={classNames(
                                                isChildActive ? 'bg-indigo-50 text-indigo-700 font-bold' : '',
                                                active ? 'bg-slate-50 text-indigo-600' : 'text-slate-700',
                                                'block px-4 py-2.5 text-sm font-medium w-full text-left transition-colors'
                                              )}
                                            >
                                              {childItem.name}
                                            </Link>
                                          )}
                                        </Menu.Item>
                                      );
                                    })}
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          );
                        }

                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={classNames(
                              isActive
                                ? "bg-slate-900 text-white font-bold shadow-xs"
                                : item.highlight
                                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black border border-indigo-200 shadow-xs"
                                : "text-slate-700 hover:bg-slate-100 hover:text-indigo-600 font-semibold",
                              "rounded-lg px-3 py-2 text-sm transition-colors flex items-center gap-1.5"
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {!user || (
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 lg:static lg:inset-auto lg:ml-6 lg:pr-0">
                  <div className="text-sm lg:text-lg mx-3 flex ">
                    <p>
                      <b>Hello {userName}</b>
                    </p>
                  </div>
                  <Link
                    to="/task/my-notifications"
                    className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-gray-800">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        <img
                          className="h-8 w-8 rounded-full"
                          src={profileImageSrc}
                          alt={`${profile?.full_name || "Employee"}'s profile`}
                        />
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ focus }) => (
                            <Link
                              to="/task/EmployeeDashboard"
                              className={classNames(
                                focus ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              Your Profile
                            </Link>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ focus }) => (
                            <button
                              onClick={() => Logout()}
                              className={classNames(
                                focus ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              )}
            </div>
          </div>

          <Disclosure.Panel className="lg:hidden bg-white border-t border-slate-200/90 shadow-lg">
            <div className="space-y-3 px-3 pb-5 pt-3">
              {navigation.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.name} className="pt-2 border-t border-slate-100 first:border-t-0 first:pt-0">
                      <div className="px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
                        {item.name}
                      </div>
                      <div className="ml-2 pl-2.5 border-l-2 border-indigo-100 space-y-1 mt-1.5">
                        {item.children.map((childItem) => {
                          const isChildActive = location.pathname === childItem.href;
                          return (
                            <Disclosure.Button
                              key={childItem.name}
                              as={Link}
                              to={childItem.href}
                              className={classNames(
                                isChildActive
                                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                                  : "text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 font-semibold",
                                "block w-full rounded-xl px-3.5 py-2.5 text-sm transition-all text-left"
                              )}
                              aria-current={isChildActive ? "page" : undefined}
                            >
                              {childItem.name}
                            </Disclosure.Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const isActive = location.pathname === item.href;
                return (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={classNames(
                      isActive
                        ? "bg-slate-900 text-white font-bold shadow-xs"
                        : item.highlight
                        ? "bg-indigo-50 text-indigo-700 font-black border border-indigo-200"
                        : "text-slate-800 hover:bg-slate-100 hover:text-indigo-600 font-bold",
                      "block w-full rounded-xl px-3.5 py-2.5 text-sm transition-all text-left"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                );
              })}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
