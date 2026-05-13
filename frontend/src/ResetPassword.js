import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Lock, Loader2 } from 'lucide-react';

const ResetPassword = ({ token, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Passwords do not match.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Too Short',
        text: 'Password must be at least 6 characters.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/reset-password/${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        }
      );
      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Password Reset!',
          text: 'Your password has been changed. You can now sign in.',
          confirmButtonColor: '#06b6d4'
        });
        onBack();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: data.error || 'Invalid or expired link.',
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
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <svg width="44" height="44" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">
              <circle cx="340" cy="340" r="320" fill="#1a1f36"/>
              <circle cx="340" cy="340" r="305" fill="none" stroke="#f5c842" strokeWidth="3" strokeDasharray="6 5"/>
              <rect x="310" y="240" width="60" height="115" rx="3" fill="#f5c842"/>
              <polygon points="340,205 300,240 380,240" fill="#f5c842"/>
              <rect x="334" y="198" width="12" height="10" rx="2" fill="#d4a918"/>
              <line x1="340" y1="182" x2="340" y2="200" stroke="#d4a918" strokeWidth="2"/>
              <polygon points="340,182 356,187 340,192" fill="#ffffff"/>
              <rect x="333" y="330" width="14" height="25" rx="2" fill="#1a1f36"/>
              <path d="M185 390 Q262 370 340 380 Q418 370 495 390 L495 440 Q418 420 340 430 Q262 420 185 440 Z" fill="#232a4a"/>
              <line x1="340" y1="380" x2="340" y2="440" stroke="#f5c842" strokeWidth="2"/>
            </svg>
            <span className="text-3xl font-bold">
              <span className="text-yellow-400">AI</span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> Stay</span>
            </span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Set New Password</h2>
          <p className="text-gray-400 text-center text-sm mb-8">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-gray-300">New Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">Confirm New Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting...
                </span>
              ) : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 bg-white/10 rounded-xl text-gray-300 hover:bg-white/20 transition-colors"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;