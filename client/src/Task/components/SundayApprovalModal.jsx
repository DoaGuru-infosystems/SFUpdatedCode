import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSyncAlt,
  FaCalendarAlt,
  FaUserLock,
  FaArrowRight
} from "react-icons/fa";

export default function SundayApprovalModal({
  isOpen,
  onClose,
  requestData,
  onApprovedSuccess
}) {
  const [status, setStatus] = useState("pending"); // pending, approved, rejected, expired
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [approvedData, setApprovedData] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const socketRef = useRef(null);

  const API_BASE = window.API_BASE || "https://sf.doaguru.com";

  // Calculate remaining time until 2 hours expiry
  useEffect(() => {
    if (!requestData) return;

    const calculateTimeLeft = () => {
      let expiry = 0;
      if (requestData.expires_at_timestamp) {
        expiry = Number(requestData.expires_at_timestamp);
      } else if (requestData.expires_at) {
        const dateStr = String(requestData.expires_at).replace(" ", "T");
        expiry = new Date(dateStr).getTime();
        if (isNaN(expiry) || (expiry < Date.now() && (requestData.status === "pending" || !requestData.status))) {
          // If server time skew caused it to look expired while pending, fallback to 2 hours
          expiry = Date.now() + 2 * 60 * 60 * 1000;
        }
      } else {
        expiry = Date.now() + 2 * 60 * 60 * 1000;
      }

      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0 && requestData.status === "expired") {
        setTimeLeft("Expired");
        setStatus("expired");
        return;
      }

      const safeDiff = diff > 0 ? diff : 0;
      const hours = Math.floor(safeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((safeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((safeDiff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [requestData]);

  // Real-time Socket.io listener
  useEffect(() => {
    if (!isOpen || !requestData) return;

    setStatus(requestData.status || "pending");

    const socket = io(API_BASE, {
      transports: ["polling", "websocket"],
      withCredentials: true,
      secure: window.location.protocol === "https:"
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("⚡ Sunday Approval Modal connected to Socket.io");
      if (requestData.employee_id) {
        socket.emit("join_employee_room", requestData.employee_id);
      }
    });

    const handleStatusUpdate = (data) => {
      console.log("🔔 Real-time Sunday status update received:", data);
      if (data.status === "approved") {
        setStatus("approved");
        setApprovedBy(data.approved_by || "Admin");
        setApprovedData(data);
        toast.success("🎉 Sunday Login Approved by Admin!", { duration: 5000 });

        // Auto redirect after 3 seconds if approved
        setTimeout(() => {
          if (data.token && data.user) {
            onApprovedSuccess(data);
          }
        }, 2500);
      } else if (data.status === "rejected") {
        setStatus("rejected");
        setRejectionReason(data.rejection_reason || "Request declined by Admin.");
        toast.error("Sunday Login Request Rejected", { duration: 5000 });
      } else if (data.status === "expired") {
        setStatus("expired");
      }
    };

    if (requestData.id) {
      socket.on(`sunday_request_status_${requestData.id}`, handleStatusUpdate);
    }
    if (requestData.employee_id) {
      socket.on(`sunday_request_status_${requestData.employee_id}`, handleStatusUpdate);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isOpen, requestData, API_BASE, onApprovedSuccess]);

  // Fallback Polling / Manual Status Check
  const checkStatusManually = async () => {
    if (!requestData?.id) return;
    setIsChecking(true);
    try {
      const res = await axios.get(`${API_BASE}/api/sunday-login/check-status/${requestData.id}`);
      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setStatus(item.status);
        if (item.status === "approved") {
          setApprovedBy(item.approved_by || "Admin");
          setApprovedData(item);
          toast.success("Approved! Proceeding to Dashboard...");
          setTimeout(() => {
            onApprovedSuccess(item);
          }, 1200);
        } else if (item.status === "rejected") {
          setRejectionReason(item.rejection_reason || "Declined by Admin");
        } else if (item.status === "pending") {
          toast("Still pending Admin approval", { icon: "⏳" });
        }
      }
    } catch (err) {
      console.error("Error checking Sunday status:", err);
      toast.error("Could not fetch status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualProceed = () => {
    if (approvedData && approvedData.token && approvedData.user) {
      onApprovedSuccess(approvedData);
    } else {
      checkStatusManually();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100"
        >
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-6 text-white text-center">
            <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/10 blur-lg" />
            
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-2">
              <FaCalendarAlt className="text-amber-200" />
              <span>Sunday Policy Enforcement</span>
            </div>

            <h3 className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">
              <FaUserLock className="text-amber-200" />
              Sunday Login Approval
            </h3>
            <p className="mt-1 text-sm text-amber-100 font-medium">
              Company policy requires explicit Admin approval for Sunday logins.
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Employee Info Card */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-800 text-sm block">
                  {requestData?.employee_name || "Employee"}
                </span>
                <span className="text-slate-500">{requestData?.employee_email}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Requested At</span>
                <span className="font-medium text-slate-700">
                  {requestData?.request_time || "Today"}
                </span>
              </div>
            </div>

            {/* Status Views */}
            {status === "pending" && (
              <div className="text-center py-4 space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute h-20 w-20 rounded-full bg-amber-400/20 animate-ping" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-lg">
                    <FaClock className="text-2xl animate-spin" style={{ animationDuration: "6s" }} />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    Waiting for Admin Approval...
                  </h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    A real-time notification has been sent to the Admin dashboard. Your screen will update automatically once reviewed.
                  </p>
                </div>

                {/* Expiry Countdown */}
                <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/70 px-4 py-2 text-xs font-semibold text-amber-800">
                  <FaClock className="text-amber-600" />
                  <span>Request Window Expires In:</span>
                  <span className="font-mono text-sm font-bold text-amber-700 tracking-wider">
                    {timeLeft || "02:00:00"}
                  </span>
                </div>
              </div>
            )}

            {status === "approved" && (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
                  <FaCheckCircle className="text-4xl" />
                </div>

                <div>
                  <h4 className="text-xl font-black text-emerald-800">
                    Request Approved! 🎉
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Admin <span className="font-semibold text-slate-800">{approvedBy}</span> has granted you access for today.
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-medium">
                  Redirecting to your workspace automatically in a few seconds...
                </div>
              </div>
            )}

            {status === "rejected" && (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-md">
                  <FaTimesCircle className="text-4xl" />
                </div>

                <div>
                  <h4 className="text-xl font-black text-rose-800">
                    Request Declined
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Admin declined this Sunday login request.
                  </p>
                </div>

                {rejectionReason && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 text-left">
                    <span className="font-semibold block mb-0.5">Admin Note:</span>
                    <span>{rejectionReason}</span>
                  </div>
                )}
              </div>
            )}

            {status === "expired" && (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600 shadow-md">
                  <FaExclamationTriangle className="text-4xl" />
                </div>

                <div>
                  <h4 className="text-xl font-black text-slate-800">
                    Approval Window Expired
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    The 2-hour window elapsed without an approval. If you still need access, please close this and log in again to send a fresh request.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={checkStatusManually}
                    disabled={isChecking}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    <FaSyncAlt className={isChecking ? "animate-spin text-slate-500" : "text-slate-500"} />
                    {isChecking ? "Checking..." : "Refresh Status"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-md"
                  >
                    Cancel / Close
                  </button>
                </>
              )}

              {status === "approved" && (
                <button
                  type="button"
                  onClick={handleManualProceed}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  <span>Proceed to Dashboard Now</span>
                  <FaArrowRight />
                </button>
              )}

              {(status === "rejected" || status === "expired") && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all"
                >
                  Close Window
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
