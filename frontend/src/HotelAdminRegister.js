import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  Diamond,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building
} from 'lucide-react';

const HotelAdminRegister = ({ onSuccess, onBack }) => {
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    hotelName: ''
  });

  const handleSubmit = (e) => {
  e.preventDefault();

  const newPartner = {
    id: Date.now(),
    name: form.name,
    email: form.email,
    hotelName: form.hotelName,
    role: 'hotelAdmin',
    status: 'pending'
  };

  // GET existing pending users
  const existing = JSON.parse(localStorage.getItem('pendingPartners')) || [];

  // SAVE new one
  localStorage.setItem('pendingPartners', JSON.stringify([...existing, newPartner]));

  Swal.fire({
    icon: 'success',
    title: 'Submitted!',
    text: 'Your account is pending system admin approval.'
  });

  onSuccess();
};

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background (same as Login) */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Diamond className="w-10 h-10 text-cyan-400" />
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI STAY
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">

          <h2 className="text-2xl font-bold text-center text-white mb-2">
            Become a Partner
          </h2>

          <p className="text-gray-400 text-center mb-8">
            Register your hotel and get approved by our system admin
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* FULL NAME */}
            <div>
              <label className="text-sm text-gray-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  className="w-full pl-12 pr-14 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 z-10"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* HOTEL NAME */}
            <div>
              <label className="text-sm text-gray-300">Hotel Name</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  placeholder="Enter hotel name"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                  onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-white"
            >
              Submit Application
            </button>

          </form>

          {/* BACK BUTTON */}
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.location.reload();
              }
            }}
            className="w-full mt-4 text-gray-400 hover:text-cyan-400 text-sm"
          >
            ← Back to Home
          </button>

        </div>
      </div>
    </div>
  );
};

export default HotelAdminRegister;