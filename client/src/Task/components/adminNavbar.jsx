import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CLogo from "../assets/images/NewCLogo.png";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import moment from "moment";
import { io } from "socket.io-client";

const navigation = [
  { name: "Dashboard", href: "task/Admin-Home-page" },
  { name: "Employee", href: "task/employee-show-register-page" },
  {
    name: "Project Details",
    items: [
      { name: "Projects", href: "task/project-add" },
      { name: "Assign Project", href: "task/assign-projects" },
      {
        name: "Assign Target",
        items: [
          { name: "Development Team", href: "task/assign-task-development-team" },
          { name: "DM Team", href: "task/assign-projects-target" },
          { name: "SEO Team", href: "task/assign-projects-target" },
          { name: "Sales Team", href: "task/assign-projects-target" },
        ]
      },
    ],
  },
  {
    name: "Reports",
    items: [
      { name: "Employee Report", href: "task/Employee-report" },
      { name: "Attendance Report", href: "/task/admin/employee-attendance-report" },
      { name: "Attendance Requests", href: "/task/admin/backdate-attendance-request" },
      { name: "Leave Report", href: "/task/admin/employee-leave-report" },
    ],
  },
  { name: "Holiday Management", href: "/task/admin/holiday-management" },
  { name: "Scheduler", href: "/task/scheduler/" },
  { name: "Letters", href: "/task/letters" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminNavbar({ Logout, render }) {
  const [user, setUser] = useState(localStorage.getItem("user"));
  const [userName, setUserName] = useState("default name");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Notification Sound - Professional "Ping" Tone
  const playNotificationSound = () => {
    if (!isSoundEnabled) return;
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch(e => console.log("Audio playback failed:", e));
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${window.location.origin}/api/admin-notifications`);
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id, type) => {
    try {
      await axios.put(`${window.location.origin}/api/admin-notifications/mark-read/${id}`);
      fetchNotifications();

      // Navigate based on type
      if (type === "leave") {
        navigate("/task/admin/employee-leave-report");
      } else if (type === "login" || type === "logout" || type === "backdate") {
        navigate("/task/admin/backdate-attendance-request" === type ? "/task/admin/backdate-attendance-request" : "/task/admin/employee-attendance-report");
      } else if (type === "task") {
        navigate("/task/Employee-report");
      } else if (type === "backdate_request") {
        navigate("/task/admin/backdate-attendance-request");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  useEffect(() => {
    setUser(localStorage.getItem("user"));
    let obj = localStorage.getItem("user");
    obj = JSON.parse(obj);
    setUserName(obj?.full_name || "default name");

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Polling fallback

    // ═══ Real-Time Socket Connection ═══
    // In Production (cPanel/Passenger), we MUST prioritize 'polling' and use 
    // the application's own origin to prevent handshake failures.
    const socket = io(window.location.host === 'localhost:3000' ? "http://localhost:8080" : "/", {
      transports: ["polling", "websocket"],
      withCredentials: true,
      secure: window.location.protocol === "https:",
    });

    socket.on("connect", () => {
      console.log(`✅ Socket.io connected via: ${socket.io.engine.transport.name}`);
      console.log("Connect ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket.io connection error (Handshake Failed):", err.message);
      if (err.message === "server error") {
        console.log("Tip: Check cPanel server terminal for any 'CORS REJECTED' messages or Node.js runtime crashes.");
      }
    });

    // Request Browser Notification Permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    socket.on("new-notification", (notif) => {
      console.log("🔔 New Real-time Notification received:", notif);
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      playNotificationSound();

      // Trigger Native Browser Notification via Service Worker
      if ("Notification" in window && Notification.permission === "granted") {
        navigator.serviceWorker.ready.then((registration) => {
          if (!registration) {
            console.error("❌ Service Worker registration not found!");
            return;
          }

          console.log("📤 Triggering Native Notification via registration.showNotification");
          const title = `DG Workspace: ${notif.user_name}`;
          const options = {
            body: notif.message,
            icon: "https://doaguru.com/static/media/doagurulogo-removebg.b0126812bbe704a27f8f.webp",
            badge: "https://doaguru.com/static/media/doagurulogo-removebg.b0126812bbe704a27f8f.webp",
            tag: notif.id,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: {
              url: window.location.origin,
              notifId: notif.id,
              type: notif.type
            },
            actions: [
              { action: 'open_url', title: '📂 Open Dashboard' },
              { action: 'close', title: '✖️ Dismiss' }
            ]
          };

          registration.showNotification(title, options);
        });
      }
    });

    const subscribeToPush = async () => {
      // 🚨 CRITICAL: This PUBLIC_VAPID_KEY must exactly match the .env on the server
      const PUBLIC_VAPID_KEY = "BGC6hFxCi3W1QCmlVBzbKI6p5GwhngcBD5l9-g-bWWHDi7P4mR4TfyXryFNqS2sY_9RmUFaEj55wHotiBTCesQU";

      try {
        console.log("📡 Push Debug: Checking Service Worker readiness...");
        const registration = await navigator.serviceWorker.ready;

        if (!registration.pushManager) {
          console.error("❌ Push Debug: PushManager is NOT supported in this browser/environment.");
          return;
        }

        console.log("📡 Push Debug: Requesting/Checking Notification Permission...");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("⚠️ Push Debug: Permission not granted. Status:", permission);
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        const convertedVapidKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);

        // 🔄 SMART SYNC: If subscription exists, check if it's using the CORRECT key.
        // If it's an old/broken key from previous tests, we must RE-SUBSCRIBE.
        if (subscription) {
          const currentKey = subscription.options.applicationServerKey;
          if (currentKey) {
            const currentKeyBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(currentKey)))
              .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            if (currentKeyBase64 !== PUBLIC_VAPID_KEY) {
              console.log("♻️ Push Debug: Old/Mismatching key detected. Re-subscribing...");
              await subscription.unsubscribe();
              subscription = null;
            }
          }
        }

        if (!subscription) {
          console.log("📡 Push Debug: Generating fresh DG Workspace token...");
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
          console.log("✅ Push Debug: New subscription generated:", subscription);
        } else {
          console.log("📡 Push Debug: Existing valid subscription found.");
        }

        console.log("📡 Push Debug: Syncing token with DG Workspace database...");
        await axios.post(`${window.location.origin}/api/save-subscription`, {
          subscription,
          userId: obj?.id || 0
        });
        console.log("✅ Push Debug: Subscription successfully saved to Database.");
      } catch (err) {
        console.error("❌ Push Debug: FAILED at step:", err.message);
        console.error("Full Error details:", err);
      }
    };

    function urlBase64ToUint8Array(base64String) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    if ("serviceWorker" in navigator) {
      subscribeToPush();
    }

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [render]);

  return (
    <Disclosure as="nav" className="bg-white border-b border-gray-200 shadow-sm relative z-[1000]">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-full sm:mx-5 px-2 sm:px-3 lg:px-1">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {!user || (
                  <DisclosureButton className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </DisclosureButton>
                )}
              </div>
              <div className="flex flex-1 items-center ms-12 sm:items-center sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-12 w-auto"
                    src={CLogo}
                    alt="DOAGuru Infosystem"
                  />
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  {!user || (
                    <div className="flex space-x-4 items-center">
                      {navigation.map((item) => (
                        item.items ? (
                          <Menu as="div" key={item.name} className="relative">
                            <MenuButton className={classNames(
                              'rounded-md px-3 py-2 text-sm font-medium flex items-center',
                              'text-gray-900 hover:bg-gray-100 hover:text-gray-900',
                              'transition-colors duration-200',
                              location.pathname.includes(item.href || '') && 'text-blue-600 font-semibold'
                            )}>
                              {item.name}
                              <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </MenuButton>
                            <Transition
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <MenuItems className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                <div className="py-1">
                                  {item.items.map((subItem) => (
                                    subItem.items ? (
                                      <Menu as="div" key={subItem.name} className="relative">
                                        <MenuButton className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                          {subItem.name}
                                          <svg className="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 011.414 0l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </MenuButton>
                                        <Transition
                                          enter="transition ease-out duration-100"
                                          enterFrom="transform opacity-0 scale-95"
                                          enterTo="transform opacity-100 scale-100"
                                          leave="transition ease-in duration-75"
                                          leaveFrom="transform opacity-100 scale-100"
                                          leaveTo="transform opacity-0 scale-95"
                                        >
                                          <MenuItems className="origin-top-left absolute left-full top-0 mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                            <div className="py-1">
                                              {subItem.items.map((nestedItem) => (
                                                <Menu.Item key={nestedItem.name}>
                                                  {({ active }) => (
                                                    <Link
                                                      to={nestedItem.href}
                                                      className={classNames(
                                                        location.pathname.includes(nestedItem.href)
                                                          ? 'bg-blue-50 text-blue-700 font-medium'
                                                          : 'text-gray-700 hover:bg-gray-50',
                                                        'block px-4 py-2 text-sm hover:bg-gray-100'
                                                      )}
                                                    >
                                                      {nestedItem.name}
                                                    </Link>
                                                  )}
                                                </Menu.Item>
                                              ))}
                                            </div>
                                          </MenuItems>
                                        </Transition>
                                      </Menu>
                                    ) : (
                                      <Menu.Item key={subItem.name}>
                                        {({ active }) => (
                                          <Link
                                            to={subItem.href}
                                            className={classNames(
                                              location.pathname.includes(subItem.href)
                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50',
                                              'block px-4 py-2 text-sm hover:bg-gray-100'
                                            )}
                                          >
                                            {subItem.name}
                                          </Link>
                                        )}
                                      </Menu.Item>
                                    )
                                  ))}
                                </div>
                              </MenuItems>
                            </Transition>
                          </Menu>
                        ) : (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={classNames(
                              location.pathname.includes(item.href)
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-900 hover:bg-gray-700 hover:text-white',
                              'rounded-md px-3 py-2 text-sm font-medium'
                            )}
                            aria-current={
                              location.pathname.includes(item.href)
                                ? 'page'
                                : undefined
                            }
                          >
                            {item.name}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {!user || (
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <div className="mx-3 flex">
                    <p>
                      <b>Hello {userName}</b>
                    </p>
                  </div>
                  <Menu as="div" className="relative ml-3">
                    <MenuButton className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-gray-800">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </MenuButton>

                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <MenuItems className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl bg-white py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
                          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Live Support</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <MenuItem key={notif.id}>
                                {({ active }) => (
                                  <div
                                    onClick={() => markAsRead(notif.id, notif.type)}
                                    className={classNames(
                                      active ? "bg-gray-50" : "",
                                      "px-4 py-3 cursor-pointer transition-colors relative group"
                                    )}
                                  >
                                    {!notif.is_read && (
                                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                      <p className={classNames(
                                        "text-sm",
                                        notif.is_read ? "text-gray-600" : "text-gray-900 font-medium"
                                      )}>
                                        {notif.message}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${notif.type === 'login' ? 'bg-emerald-100 text-emerald-700' :
                                          notif.type === 'logout' ? 'bg-amber-100 text-amber-700' :
                                            notif.type === 'leave' ? 'bg-rose-100 text-rose-700' :
                                              'bg-blue-100 text-blue-700'
                                          }`}>
                                          {notif.type}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          {moment(notif.created_at).fromNow()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </MenuItem>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center">
                              <p className="text-sm text-gray-500 italic">No recent notifications</p>
                            </div>
                          )}
                        </div>
                      </MenuItems>
                    </Transition>
                  </Menu>
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <MenuButton className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open user menu</span>
                        <img
                          className="h-8 w-8 rounded-full"
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                          alt=""
                        />
                      </MenuButton>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <MenuItems className="absolute right-0 z-[100] mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              to="#"
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              Your Profile
                            </Link>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              to="#"
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              Settings
                            </Link>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => Logout()}
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Transition>
                  </Menu>
                </div>
              )}
            </div>
          </div>

          <DisclosurePanel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.items ? (
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <DisclosureButton
                            className={classNames(
                              "flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium",
                              "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                              location.pathname.includes(item.href || '') && 'text-blue-600 font-semibold'
                            )}
                          >
                            {item.name}
                            <svg
                              className={`h-5 w-5 transition-transform ${open ? 'rotate-180 transform' : ''}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </DisclosureButton>
                          <DisclosurePanel className="ml-4">
                            {item.items.map((subItem) => (
                              subItem.items ? (
                                <Disclosure key={subItem.name}>
                                  {({ open }) => (
                                    <>
                                      <DisclosureButton
                                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                      >
                                        {subItem.name}
                                        <svg
                                          className={`h-4 w-4 transition-transform ${open ? 'rotate-180 transform' : ''}`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </DisclosureButton>
                                      <DisclosurePanel className="ml-4">
                                        {subItem.items.map((nestedItem) => (
                                          <Link
                                            key={nestedItem.name}
                                            to={nestedItem.href}
                                            className={classNames(
                                              location.pathname.includes(nestedItem.href)
                                                ? "bg-blue-50 text-blue-700 font-medium"
                                                : "text-gray-700 hover:bg-gray-50",
                                              "block rounded-md px-3 py-2 text-sm font-medium"
                                            )}
                                          >
                                            {nestedItem.name}
                                          </Link>
                                        ))}
                                      </DisclosurePanel>
                                    </>
                                  )}
                                </Disclosure>
                              ) : (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  className={classNames(
                                    location.pathname.includes(subItem.href)
                                      ? "bg-blue-50 text-blue-700 font-medium"
                                      : "text-gray-700 hover:bg-gray-50",
                                    "block rounded-md px-3 py-2 text-sm font-medium"
                                  )}
                                >
                                  {subItem.name}
                                </Link>
                              )
                            ))}
                          </DisclosurePanel>
                        </>
                      )}
                    </Disclosure>
                  ) : (
                    <DisclosureButton
                      as={Link}
                      to={item.href}
                      className="block w-full text-left"
                    >
                      <span
                        className={classNames(
                          location.pathname.includes(item.href)
                            ? "text-blue-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50",
                          "block rounded-md px-3 py-2 text-base font-medium"
                        )}
                      >
                        {item.name}
                      </span>
                    </DisclosureButton>
                  )}
                </div>
              ))}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
