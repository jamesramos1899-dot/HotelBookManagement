import React, { useState } from "react";
import Swal from "sweetalert2";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  User,
  Phone,
} from "lucide-react";
import authService from "./services/authService";

const Login = ({ onLogin, onBack, onNavigate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.login(form.email, form.password);

      if (result.success) {
        const user = result.data;

        // Check if hotel_admin is approved
        if (user.role === "hotel_admin" && !user.isApproved) {
          Swal.fire({
            icon: "warning",
            title: "Account Pending Approval",
            text: "Your hotel admin account is waiting for system admin approval. Please check your email for updates.",
            confirmButtonColor: "#06b6d4",
          });
          setLoading(false);
          return;
        }

        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(user));

        Swal.fire({
          icon: "success",
          title: "Welcome Back!",
          text: `Logged in as ${user.name}`,
          timer: 1500,
          showConfirmButton: false,
        });

        onLogin(user);
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: result.error || "Invalid credentials",
          confirmButtonColor: "#ef4444",
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.error || "Something went wrong",
        confirmButtonColor: "#ef4444",
      });
      setLoading(false);
      return;
    } finally {
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "Passwords do not match. Please try again.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    setRegisterLoading(true);

    try {
      const result = await authService.register({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
        role: "user",
      });

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Your account has been created successfully! You can now sign in.",
          confirmButtonColor: "#06b6d4",
        });
        setShowRegister(false);
        setRegisterForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: result.error || "Something went wrong",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.error || "Something went wrong",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setRegisterLoading(false);
    }
  };
  

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Email Sent!',
          text: 'Password reset instructions have been sent to your email.',
          confirmButtonColor: '#06b6d4'
        });
        setShowForgotPassword(false);
        setForgotEmail('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: data.error || 'Email not found',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong. Please try again.',
        confirmButtonColor: '#ef4444'
      });
    }
    setForgotLoading(false);
  };

  const handlePartnerClick = () => {
    if (onNavigate) {
      onNavigate("partner");
    } else {
      window.dispatchEvent(
        new CustomEvent("navigate", { detail: "hotel-admin-register" }),
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <svg
              width="44"
              height="44"
              viewBox="0 0 680 680"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="340" cy="340" r="320" fill="#1a1f36" />
              <circle
                cx="340"
                cy="340"
                r="305"
                fill="none"
                stroke="#f5c842"
                strokeWidth="3"
                strokeDasharray="6 5"
              />
              <rect
                x="310"
                y="240"
                width="60"
                height="115"
                rx="3"
                fill="#f5c842"
              />
              <polygon points="340,205 300,240 380,240" fill="#f5c842" />
              <rect
                x="334"
                y="198"
                width="12"
                height="10"
                rx="2"
                fill="#d4a918"
              />
              <line
                x1="340"
                y1="182"
                x2="340"
                y2="200"
                stroke="#d4a918"
                strokeWidth="2"
              />
              <polygon points="340,182 356,187 340,192" fill="#ffffff" />
              <rect
                x="318"
                y="250"
                width="10"
                height="10"
                rx="1"
                fill="#1a1f36"
              />
              <rect
                x="335"
                y="250"
                width="10"
                height="10"
                rx="1"
                fill="#ffffff"
                opacity="0.85"
              />
              <rect
                x="352"
                y="250"
                width="10"
                height="10"
                rx="1"
                fill="#1a1f36"
              />
              <rect
                x="318"
                y="266"
                width="10"
                height="10"
                rx="1"
                fill="#ffffff"
                opacity="0.85"
              />
              <rect
                x="335"
                y="266"
                width="10"
                height="10"
                rx="1"
                fill="#1a1f36"
              />
              <rect
                x="352"
                y="266"
                width="10"
                height="10"
                rx="1"
                fill="#ffffff"
                opacity="0.85"
              />
              <rect
                x="333"
                y="330"
                width="14"
                height="25"
                rx="2"
                fill="#1a1f36"
              />
              <path
                d="M185 390 Q262 370 340 380 Q418 370 495 390 L495 440 Q418 420 340 430 Q262 420 185 440 Z"
                fill="#232a4a"
              />
              <line
                x1="340"
                y1="380"
                x2="340"
                y2="440"
                stroke="#f5c842"
                strokeWidth="2"
              />
              <circle cx="230" cy="300" r="5" fill="#f5c842" />
              <circle cx="255" cy="275" r="4" fill="#8ca0cc" />
              <line
                x1="234"
                y1="298"
                x2="252"
                y2="278"
                stroke="#f5c842"
                strokeWidth="1.5"
              />
              <circle cx="450" cy="300" r="5" fill="#f5c842" />
              <circle cx="425" cy="275" r="4" fill="#8ca0cc" />
              <line
                x1="446"
                y1="298"
                x2="428"
                y2="278"
                stroke="#f5c842"
                strokeWidth="1.5"
              />
            </svg>
            <span className="text-3xl font-bold">
              <span className="text-yellow-400">AI</span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Stay
              </span>
            </span>
          </div>
        </div>

        {/* Login Card */}
        {!showRegister ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* EMAIL */}
              <div>
                <label className="text-sm text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className="w-full pl-12 pr-14 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 z-10"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* FORGOT PASSWORD */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Register Link */}
            <p className="text-center text-gray-400 text-sm mt-6">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setShowRegister(true)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Create an Account
              </button>
            </p>

            <p className="text-center text-gray-500 text-xs mt-4">
              Are you a hotel owner?{" "}
              <button
                onClick={handlePartnerClick}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Register as Partner
              </button>
            </p>
          </div>
        ) : (
          /* Guest Registration Card */
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              Create Account
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Join AI STAY as a Guest
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* NAME */}
              <div>
                <label className="text-sm text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    value={registerForm.name}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="text-sm text-gray-300">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    value={registerForm.phone}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        phone: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Create a password"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="text-sm text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {registerLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Back to Login */}
            <p className="text-center text-gray-400 text-sm mt-6">
              Already have an account?{" "}
              <button
                onClick={() => setShowRegister(false)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="bg-slate-900 rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Reset Password</h2>
            <p className="text-gray-400 text-center text-sm mb-6">
              Enter your email and we'll send you instructions to reset your password.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-sm text-gray-300">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-white hover:shadow-lg transition-all disabled:opacity-50"
              >
                {forgotLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </span>
                ) : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}
                className="w-full py-3 bg-white/10 rounded-xl text-gray-300 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
