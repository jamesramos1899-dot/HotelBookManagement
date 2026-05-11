import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  Diamond,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import api from './services/api';

const HotelAdminRegister = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: Math.random().toString(36).slice(-10), // Auto-generate temporary password
        phone: form.phone,
        address: form.address,
        role: 'hotel_admin'
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Application Submitted!',
          text: 'Your application is pending system admin approval. You will receive an email with your login credentials once approved.',
          confirmButtonColor: '#06b6d4'
        });
        onSuccess();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.response?.data?.error || 'Something went wrong',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
            <Diamond className="w-10 h-10 text-cyan-400" />
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI STAY
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
                  onChange={(e) => updateForm('name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">Email *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) => updateForm('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="+63..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                  onChange={(e) => updateForm('phone', e.target.value)}
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
                  onChange={(e) => updateForm('address', e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <button
            onClick={() => onBack ? onBack() : window.location.reload()}
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