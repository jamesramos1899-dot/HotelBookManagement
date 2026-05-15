import React, { useState } from "react";
import Swal from "sweetalert2";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Hash,
  Upload,
} from "lucide-react";
import api from "./services/api";

const HotelAdminRegister = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    hotelName: "",
    propertyLocation: "",
    businessLicense: "",
    taxInformation: "",
    numberOfUnits: "",
  });
  const [validIdFile, setValidIdFile] = useState(null);
  const [validIdPreview, setValidIdPreview] = useState(null);

  const handleValidIdChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setValidIdFile(file);
    setValidIdPreview(URL.createObjectURL(file));
  };
  const handleSendOtp = async () => {
    if (!form.email.endsWith("@gmail.com")) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Only Gmail addresses (@gmail.com) are accepted.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        setOtpTimer(300);
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: `A 6-digit code was sent to ${form.email}`,
          confirmButtonColor: "#06b6d4",
        });
        const interval = setInterval(() => {
          setOtpTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: data.error,
          confirmButtonColor: "#ef4444",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
        confirmButtonColor: "#ef4444",
      });
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp: otpCode }),
      });
      const data = await response.json();
      if (data.success) {
        setOtpVerified(true);
        Swal.fire({
          icon: "success",
          title: "Email Verified!",
          text: "Your Gmail has been verified. You can now complete registration.",
          confirmButtonColor: "#06b6d4",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: data.error,
          confirmButtonColor: "#ef4444",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
        confirmButtonColor: "#ef4444",
      });
    }
    setOtpLoading(false);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      Swal.fire({
        icon: "warning",
        title: "Email Not Verified",
        text: "Please verify your Gmail before submitting your application.",
        confirmButtonColor: "#06b6d4",
      });
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", Math.random().toString(36).slice(-10));
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("hotelName", form.hotelName);
      formData.append("propertyLocation", form.propertyLocation);
      formData.append("businessLicense", form.businessLicense);
      formData.append("taxInformation", form.taxInformation);
      formData.append("numberOfUnits", form.numberOfUnits);
      formData.append("role", "hotel_admin");
      if (validIdFile) formData.append("validId", validIdFile);

      const response = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Application Submitted!",
          text: "Your application is pending system admin approval. You will receive an email with your login credentials once approved.",
          confirmButtonColor: "#06b6d4",
        });
        onSuccess();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.error || "Something went wrong",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
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

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            Become a Partner
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Register as a hotel partner
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-gray-300">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) => updateForm("name", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">Email *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your Gmail address"
                    className={`w-full pl-12 pr-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none ${
                      otpVerified
                        ? "border-green-500/50"
                        : "border-white/10 focus:border-cyan-500/50"
                    }`}
                    value={form.email}
                    onChange={(e) => {
                      updateForm("email", e.target.value);
                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtpCode("");
                    }}
                    disabled={otpVerified}
                    pattern="^[a-zA-Z0-9._%+\-]+@gmail\.com$"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || otpVerified || otpTimer > 0}
                  className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {otpVerified
                    ? "✓ Verified"
                    : otpTimer > 0
                      ? `${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, "0")}`
                      : otpLoading
                        ? "Sending..."
                        : "Send OTP"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be a @gmail.com address
              </p>

              {/* OTP Input */}
              {otpSent && !otpVerified && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none tracking-widest text-center text-lg"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/, ""))
                    }
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpCode.length !== 6 || otpLoading}
                    className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 text-xs font-semibold hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? "Verifying..." : "Verify"}
                  </button>
                </div>
              )}

              {otpVerified && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ Gmail verified successfully
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-300">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="+63..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) => updateForm("phone", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  placeholder="Your address"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) => updateForm("address", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-cyan-400 uppercase tracking-wider mb-3 font-semibold">
                Hotel / Property Information
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-300">Hotel Name *</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  placeholder="Enter your hotel name"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) => updateForm("hotelName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Property Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  placeholder="Full property address"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) =>
                    updateForm("propertyLocation", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Business License Number *
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  placeholder="e.g. BL-2024-XXXXX"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) =>
                    updateForm("businessLicense", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Tax Identification Number (TIN) *
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  placeholder="e.g. 123-456-789"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) => updateForm("taxInformation", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Number of Units / Rooms *
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 20"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) => updateForm("numberOfUnits", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">Valid ID Upload *</label>
              <div className="mt-1">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-cyan-500/50 hover:bg-white/5 transition-all">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    className="hidden"
                    onChange={handleValidIdChange}
                    required={!validIdFile}
                  />
                  {validIdPreview ? (
                    <img
                      src={validIdPreview}
                      alt="ID Preview"
                      className="h-full w-full object-contain rounded-xl p-1"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        Click to upload valid ID
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </div>
                  )}
                </label>
                {validIdFile && (
                  <p className="text-xs text-cyan-400 mt-1">
                    ✓ {validIdFile.name}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>

          <button
            onClick={() => (onBack ? onBack() : window.location.reload())}
            className="w-full mt-4 text-gray-400 hover:text-cyan-400 text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelAdminRegister;
