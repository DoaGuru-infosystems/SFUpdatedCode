import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CLogo from "../../assets/images/CLogo.png";
import { IoEye, IoEyeOff } from "react-icons/io5";

const AdminPasswordReset = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const sendOtp = async () => {
    if (!email) return setMessage("Please enter a valid email.");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/sendOtp", {
        email,
      });
      setStep(2);
      setMessage("OTP sent to your email.");
    } catch (err) {
      setMessage("Error sending OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return setMessage("Enter the OTP received.");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/verifyOtp", {
        email,
        otp,
      });
      setStep(3);
      setMessage("");
    } catch (err) {
      setMessage("Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!password || !confirmPassword) return setMessage("Fill all fields.");
    if (password !== confirmPassword)
      return setMessage("Passwords don't match.");
    setLoading(true);
    try {
      const res = await axios.put(
        "http://localhost:8080/api/adminResetPassword",
        {
          email,
          password,
        }
      );
      setMessage("Password reset successful.");
      setTimeout(() => navigate("/task/login"), 2000);
    } catch (err) {
      setMessage("Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-600 to-lime-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <img
            src={CLogo} // 🔁 Replace with your path or hosted URL
            alt="Company Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-center text-indigo-700">
          Admin Reset Password
        </h2>

        {message && (
          <div className="text-center text-sm text-red-600">{message}</div>
        )}

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={sendOtp}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition duration-300"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              onClick={verifyOtp}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition duration-300"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            {/* New Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-3 right-3 text-gray-500 hover:text-indigo-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <IoEyeOff className="h-5 w-5" />
                ) : (
                  <IoEye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-3 right-3 text-gray-500 hover:text-indigo-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <IoEyeOff className="h-5 w-5" />
                ) : (
                  <IoEye className="h-5 w-5" />
                )}
              </button>
            </div>

            <button
              onClick={resetPassword}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-300"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

        <div className="text-center">
          <button
            className="text-indigo-500 hover:underline text-sm mt-2"
            onClick={() => navigate("/task/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordReset;
