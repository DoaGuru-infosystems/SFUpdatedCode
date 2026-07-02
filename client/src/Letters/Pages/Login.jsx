import { Link, useNavigate } from "react-router-dom";
import CLogo from "../assets/images/CLogo.png";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    axios
      .post(`${process.env.REACT_APP_API_URL}/api/login`, { username, password })
      .then((response) => {
        if (response.data && response.data.token) {
          localStorage.setItem("token", response.data.token);
          toast.success("Login successful! Welcome back 🎉");
          window.location.href = "/task/letters";
        } else {
          toast.error("Login successful, but no token received.");
        }
      })
      .catch((error) => {
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Login failed. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-8 bg-[#0f0f1a] dark:bg-[#0f0f1a]">

      {/* Animated Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-40%] left-[-20%] w-[70%] h-full rounded-full animate-float"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-40%] right-[-20%] w-[70%] h-full rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", animation: "float 8s ease-in-out infinite reverse" }} />
        <div className="absolute top-[20%] right-[15%] w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", animation: "float 6s ease-in-out infinite 2s" }} />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${(i % 3) + 2}px`, height: `${(i % 3) + 2}px`,
              background: i % 2 === 0 ? "rgba(99,102,241,0.5)" : "rgba(14,165,233,0.5)",
              top: `${10 + i * 15}%`, left: `${5 + i * 15}%`,
              animation: `float ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }} />
        ))}
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[460px] bg-[rgba(20,20,40,0.85)] backdrop-blur-[40px] border border-white/10 rounded-3xl px-10 py-12 shadow-2xl animate-[fadeInUp_0.6s_ease]">

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={CLogo}
            alt="DOAGuru"
            className="h-16 w-auto mb-4 animate-float"
            style={{ filter: "drop-shadow(0 0 20px rgba(99,102,241,0.4))" }}
          />
          <h1 className="text-3xl font-extrabold text-center tracking-tight text-white leading-tight">
            Welcome back
          </h1>
          <p className="text-sm text-slate-400 text-center mt-2">
            Sign in to DOAGuru Letters Portal
          </p>
        </div>

        {/* Gradient Divider */}
        <div className="h-px mb-7" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none flex items-center">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm font-sans outline-none transition-all duration-200 focus:border-primary focus:bg-primary/5 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-400">
                Password
              </label>
              <Link to="#" className="text-xs font-semibold text-primary-light hover:underline no-underline transition-colors duration-200">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none flex items-center">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm font-sans outline-none transition-all duration-200 focus:border-primary focus:bg-primary/5 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary-light transition-colors duration-200 flex items-center p-0 bg-transparent border-none cursor-pointer"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl text-white text-sm font-semibold tracking-wide transition-all duration-200 relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-px hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] active:translate-y-0"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)" }}
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />
            )}
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        {/* Footer Text */}
        <p className="text-center mt-6 text-sm text-slate-400">
          Not a member?{" "}
          <a
            href="https://doaguru.com/"
            target="_blank"
            rel="noreferrer"
            className="text-primary-light font-semibold hover:underline"
          >
            Join DOAGuru Team
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
