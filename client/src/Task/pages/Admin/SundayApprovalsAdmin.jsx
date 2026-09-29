import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import moment from "moment";
import {
  FaSun,
  FaCalendarCheck,
  FaCalendarPlus,
  FaClock,
  FaCheck,
  FaTimes,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaExclamationTriangle,
  FaHistory,
  FaBolt
} from "react-icons/fa";

export default function SundayApprovalsAdmin() {
  const [activeTab, setActiveTab] = useState("live"); // 'live' | 'pre' | 'history'
  const [requests, setRequests] = useState([]);
  const [preApprovals, setPreApprovals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Filters for Live Requests & History
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReqForReject, setSelectedReqForReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Pre-Approval Modal state
  const [preModalOpen, setPreModalOpen] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [preDate, setPreDate] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("18:30");
  const [preReason, setPreReason] = useState("");

  const socketRef = useRef(null);
  const API_BASE = window.API_BASE || "https://sf.doaguru.com";
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Calculate upcoming Sundays for quick selection
  const upcomingSundays = useMemo(() => {
    const list = [];
    let current = moment();
    // find next Sunday (day 0)
    for (let i = 0; i < 30; i++) {
      if (current.day() === 0) {
        list.push(current.format("YYYY-MM-DD"));
      }
      current = current.clone().add(1, "day");
      if (list.length >= 4) break;
    }
    return list;
  }, []);

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/sunday-login/requests`, {
        params: {
          date: activeTab === "history" ? selectedDate : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        }
      });
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load Sunday requests:", err);
      toast.error("Failed to load Sunday requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pre-Approvals
  const fetchPreApprovals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/sunday-login/pre-approvals`);
      if (res.data?.success) {
        setPreApprovals(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load pre-approvals:", err);
    }
  };

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/sunday-login/employees`);
      if (res.data?.success) {
        setEmployees(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  // Notification audio alert
  const playAlertSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => {});
    } catch (e) {
      // ignore
    }
  };

  // Socket setup
  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ["polling", "websocket"],
      withCredentials: true,
      secure: window.location.protocol === "https:"
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_admin_room");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Real-time listener for new Sunday requests
    socket.on("sunday_new_login_request", (newReq) => {
      playAlertSound();
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-amber-500 p-4`}
          >
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FaSun className="text-amber-500" /> New Sunday Login Request!
              </p>
              <p className="mt-1 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{newReq.employee_name}</span> has requested login approval for Sunday work.
              </p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setActiveTab("live");
                fetchRequests();
              }}
              className="ml-3 self-center rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition"
            >
              View
            </button>
          </div>
        ),
        { duration: 8000 }
      );
      fetchRequests();
    });

    socket.on("sunday_request_updated", () => {
      fetchRequests();
    });

    socket.on("sunday_pre_approvals_updated", () => {
      fetchPreApprovals();
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [API_BASE]);

  // Initial load
  useEffect(() => {
    fetchRequests();
    fetchPreApprovals();
    fetchEmployees();
    if (upcomingSundays.length > 0) {
      setPreDate(upcomingSundays[0]);
    }
  }, []);

  // Respond to request (Approve)
  const handleApprove = async (reqItem) => {
    try {
      const res = await axios.post(`${API_BASE}/api/sunday-login/respond`, {
        requestId: reqItem.id,
        action: "approved",
        adminName: user.full_name || "Admin"
      });
      if (res.data?.success) {
        toast.success(`Approved login access for ${reqItem.employee_name}`);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve request");
    }
  };

  // Open Reject Modal
  const openRejectModal = (reqItem) => {
    setSelectedReqForReject(reqItem);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!selectedReqForReject) return;
    try {
      const res = await axios.post(`${API_BASE}/api/sunday-login/respond`, {
        requestId: selectedReqForReject.id,
        action: "rejected",
        rejection_reason: rejectionReason || "Work not scheduled on Sunday.",
        adminName: user.full_name || "Admin"
      });
      if (res.data?.success) {
        toast.error(`Rejected login request for ${selectedReqForReject.employee_name}`);
        setRejectModalOpen(false);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject request");
    }
  };

  // Create Pre-Approval
  const handleSavePreApproval = async (e) => {
    e.preventDefault();
    if (selectedEmpIds.length === 0) {
      return toast.error("Please select at least one employee");
    }
    if (!preDate) {
      return toast.error("Please select an approved Sunday date");
    }

    try {
      const res = await axios.post(`${API_BASE}/api/sunday-login/pre-approve`, {
        employee_ids: selectedEmpIds,
        approved_date: preDate,
        is_full_day: isFullDay,
        start_time: isFullDay ? null : startTime,
        end_time: isFullDay ? null : endTime,
        reason: preReason || "Sunday Work Scheduled",
        approved_by: user.full_name || "Admin"
      });

      if (res.data?.success) {
        toast.success(`Successfully pre-approved ${selectedEmpIds.length} employee(s)!`);
        setPreModalOpen(false);
        setSelectedEmpIds([]);
        setPreReason("");
        fetchPreApprovals();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save pre-approval");
    }
  };

  // Revoke Pre-Approval
  const handleRevokePreApproval = async (id, empName) => {
    if (!window.confirm(`Revoke Sunday pre-approval for ${empName}?`)) return;
    try {
      const res = await axios.delete(`${API_BASE}/api/sunday-login/pre-approve/${id}`);
      if (res.data?.success) {
        toast.success("Pre-approval revoked successfully");
        fetchPreApprovals();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to revoke pre-approval");
    }
  };

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.designation?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // Pending Count Badge
  const pendingCount = useMemo(() => {
    return requests.filter((r) => r.status === "pending").length;
  }, [requests]);

  const isSundayToday = moment().day() === 0;

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-amber-200">
                <FaSun className="text-amber-300 animate-spin" style={{ animationDuration: "12s" }} />
                <span>Attendance Governance</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>
                  {isSundayToday ? "☀️ TODAY IS SUNDAY (ACTIVE)" : "Upcoming Sunday Policy"}
                </span>
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Sunday Login Approval Management
              </h1>
              <p className="mt-1.5 text-sm text-amber-100 max-w-2xl leading-relaxed">
                Review real-time login approval requests or pre-schedule authorized employees for Sunday work with custom time windows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur-md px-4 py-2.5 text-xs font-medium text-white border border-white/20">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    socketConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                  }`}
                />
                <span>{socketConnected ? "Socket Live Connected" : "Connecting..."}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchRequests();
                  fetchPreApprovals();
                  toast.success("Refreshed data");
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-amber-50 transition active:scale-95"
              >
                <FaSyncAlt className={loading ? "animate-spin text-amber-600" : "text-amber-600"} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/10">
              <span className="text-xs text-amber-100 font-medium">Pending Approvals</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{pendingCount}</span>
                {pendingCount > 0 && (
                  <span className="text-xs font-bold text-amber-300 animate-pulse">Needs Action</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/10">
              <span className="text-xs text-amber-100 font-medium">Active Pre-Approvals</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{preApprovals.length}</span>
                <span className="text-xs text-amber-200">Scheduled</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/10">
              <span className="text-xs text-amber-100 font-medium">Approved Today</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-300">
                  {requests.filter((r) => r.status === "approved").length}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/10">
              <span className="text-xs text-amber-100 font-medium">Rejected / Expired</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-200">
                  {requests.filter((r) => ["rejected", "expired"].includes(r.status)).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Controls */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab("live")}
              className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "live"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaBolt />
              <span>Real-Time Requests</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-white text-orange-600 px-2 py-0.5 text-[10px] font-black">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("pre")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "pre"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaCalendarCheck />
              <span>Pre-Approvals</span>
              <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                {preApprovals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaHistory />
              <span>Audit & Logs</span>
            </button>
          </div>

          {activeTab === "pre" ? (
            <button
              type="button"
              onClick={() => setPreModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-amber-700 hover:to-orange-700 transition"
            >
              <FaCalendarPlus />
              <span>Schedule Sunday Pre-Approval</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Only</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {activeTab === "history" && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:outline-none"
                />
              )}
            </div>
          )}
        </div>

        {/* ── TAB 1 & TAB 3: REAL-TIME REQUESTS & AUDIT LOGS ── */}
        {(activeTab === "live" || activeTab === "history") && (
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <FaSyncAlt className="animate-spin text-3xl text-amber-500" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
                  <FaSun className="text-2xl" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No Sunday Login Requests Found
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  {activeTab === "live"
                    ? "When employees attempt to login on Sunday without pre-approval, their requests will appear here in real-time."
                    : "No logs found for the selected date or filter criteria."}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Employee</th>
                        <th className="py-3.5 px-4">Department / Role</th>
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Expiry Window</th>
                        <th className="py-3.5 px-4">Reviewed By / Notes</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.map((reqItem) => {
                        const isPending = reqItem.status === "pending";
                        const isApproved = reqItem.status === "approved";
                        const isRejected = reqItem.status === "rejected";
                        const isExpired = reqItem.status === "expired";

                        return (
                          <tr
                            key={reqItem.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isPending ? "bg-amber-50/40 font-medium" : ""
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                  {reqItem.employee_name?.charAt(0) || "E"}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {reqItem.employee_name}
                                  </span>
                                  <span className="text-slate-500 text-[11px]">
                                    {reqItem.employee_email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-slate-600">
                              <div>
                                <span className="font-semibold text-slate-800 block">
                                  {reqItem.designation || "Staff"}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {reqItem.department || "General"}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-slate-600">
                              <span className="block font-medium text-slate-800">
                                {moment(reqItem.request_date).format("DD MMM YYYY")}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {reqItem.request_time}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              {isPending && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 animate-pulse">
                                  <FaClock className="text-amber-600" /> Pending
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                                  <FaCheck className="text-emerald-600" /> Approved
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                                  <FaTimes className="text-rose-600" /> Rejected
                                </span>
                              )}
                              {isExpired && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                  <FaExclamationTriangle className="text-slate-500" /> Expired
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-[11px] text-slate-500">
                              {isPending ? (
                                <span className="font-mono font-semibold text-amber-700">
                                  Until {moment(reqItem.expires_at).format("hh:mm A")}
                                </span>
                              ) : (
                                <span>{moment(reqItem.expires_at).format("DD MMM, hh:mm A")}</span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-slate-600">
                              {isApproved && (
                                <div>
                                  <span className="font-semibold text-emerald-700 block">
                                    by {reqItem.approved_by || "Admin"}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {moment(reqItem.approved_at).format("hh:mm A")}
                                  </span>
                                </div>
                              )}
                              {isRejected && (
                                <span className="text-rose-600 font-medium">
                                  {reqItem.rejection_reason || "Declined"}
                                </span>
                              )}
                              {isPending && <span className="text-slate-400 italic">Awaiting response</span>}
                              {isExpired && <span className="text-slate-400 italic">2hr window lapsed</span>}
                            </td>

                            <td className="py-4 px-4 text-right">
                              {isPending ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(reqItem)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition active:scale-95"
                                  >
                                    <FaCheck />
                                    <span>Approve</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openRejectModal(reqItem)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 text-xs font-bold transition active:scale-95"
                                  >
                                    <FaTimes />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PRE-APPROVAL MANAGEMENT ── */}
        {activeTab === "pre" && (
          <div className="mt-6">
            {preApprovals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
                  <FaCalendarCheck className="text-2xl" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No Upcoming Sunday Pre-Approvals
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Schedule employees in advance so they can log in seamlessly on Sunday without waiting for live approval.
                </p>
                <button
                  type="button"
                  onClick={() => setPreModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition"
                >
                  <FaCalendarPlus />
                  <span>Schedule Pre-Approval Now</span>
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Employee</th>
                        <th className="py-3.5 px-4">Department / Designation</th>
                        <th className="py-3.5 px-4">Approved Sunday Date</th>
                        <th className="py-3.5 px-4">Allowed Window</th>
                        <th className="py-3.5 px-4">Purpose / Reason</th>
                        <th className="py-3.5 px-4">Scheduled By</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preApprovals.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                {item.employee_name?.charAt(0) || "E"}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {item.employee_name}
                                </span>
                                <span className="text-slate-500 text-[11px]">
                                  {item.employee_email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-slate-600">
                            <span className="font-semibold text-slate-800 block">
                              {item.designation || "Staff"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.department || "General"}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-800">
                              <FaSun className="text-amber-500" />
                              {moment(item.approved_date).format("ddd, DD MMM YYYY")}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            {item.is_full_day ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                🌟 Full Day (Anytime)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-700">
                                <FaClock className="text-slate-400" />
                                {item.start_time} - {item.end_time}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-slate-600 max-w-xs truncate">
                            {item.reason || "Sunday Work Scheduled"}
                          </td>

                          <td className="py-4 px-4 text-slate-600">
                            <span className="font-medium text-slate-800 block">
                              {item.approved_by || "Admin"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {moment(item.created_at).format("DD MMM, hh:mm A")}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRevokePreApproval(item.id, item.employee_name)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 text-xs font-bold transition active:scale-95"
                            >
                              <FaTrash className="text-xs" />
                              <span>Revoke</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: REJECT REASON MODAL ── */}
      <AnimatePresence>
        {rejectModalOpen && selectedReqForReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="bg-rose-600 p-5 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FaTimes /> Reject Sunday Login Request
                </h3>
                <p className="text-xs text-rose-100 mt-1">
                  Employee: {selectedReqForReject.employee_name}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Reason for Rejection (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Sunday work not approved for your department today."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-md transition"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: SCHEDULE PRE-APPROVAL ── */}
      <AnimatePresence>
        {preModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FaCalendarPlus /> Schedule Sunday Pre-Approval
                  </h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Pre-approve employees to login without waiting for live approval.
                  </p>
                </div>
                <button
                  onClick={() => setPreModalOpen(false)}
                  className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSavePreApproval} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                {/* 1. Date Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Select Sunday Date *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {upcomingSundays.map((sun) => (
                      <button
                        type="button"
                        key={sun}
                        onClick={() => setPreDate(sun)}
                        className={`rounded-xl px-3 py-1.5 font-bold transition text-xs ${
                          preDate === sun
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {moment(sun).format("DD MMM (Sun)")}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    required
                    value={preDate}
                    onChange={(e) => setPreDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* 2. Employee Multi-Selection */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-bold text-slate-700">
                      Select Employees ({selectedEmpIds.length} selected) *
                    </label>
                    <div className="flex gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedEmpIds(employees.map((e) => e.id))}
                        className="text-amber-600 font-bold hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedEmpIds([])}
                        className="text-slate-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Search by name or department..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs mb-2 focus:border-amber-500 focus:outline-none"
                  />

                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-2 divide-y divide-slate-100 bg-slate-50/50">
                    {employees
                      .filter(
                        (emp) =>
                          emp.full_name?.toLowerCase().includes(empSearch.toLowerCase()) ||
                          emp.department?.toLowerCase().includes(empSearch.toLowerCase())
                      )
                      .map((emp) => {
                        const isSelected = selectedEmpIds.includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            className="flex items-center gap-2.5 p-2 hover:bg-white rounded-lg cursor-pointer transition"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmpIds((prev) => [...prev, emp.id]);
                                } else {
                                  setSelectedEmpIds((prev) => prev.filter((id) => id !== emp.id));
                                }
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                            />
                            <div className="flex-1">
                              <span className="font-bold text-slate-800 block text-xs">
                                {emp.full_name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {emp.designation} • {emp.department || "No dept"}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* 3. Time Window */}
                <div>
                  <label className="block font-bold text-slate-700 mb-2">
                    Allowed Working Hours
                  </label>
                  <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="hourMode"
                        checked={isFullDay}
                        onChange={() => setIsFullDay(true)}
                        className="text-amber-600"
                      />
                      <span>Full Day (24-hour access)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="hourMode"
                        checked={!isFullDay}
                        onChange={() => setIsFullDay(false)}
                        className="text-amber-600"
                      />
                      <span>Specific Time Window</span>
                    </label>
                  </div>

                  {!isFullDay && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50">
                      <div>
                        <span className="block font-semibold text-slate-600 mb-1">Start Time</span>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <span className="block font-semibold text-slate-600 mb-1">End Time</span>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Reason */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Reason / Project Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Critical client milestone delivery, system maintenance..."
                    value={preReason}
                    onChange={(e) => setPreReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPreModalOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-700 hover:to-orange-700 transition"
                  >
                    Save Pre-Approval ({selectedEmpIds.length})
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
