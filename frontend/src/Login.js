import React, { useState } from 'react';
import {
  Diamond,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle
} from 'lucide-react';
import authService from './services/authService';

const Login = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const response = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        });

        if (response.success) {
          setIsSignUp(false);
          setMessage('Registration successful. Please log in.');

          setFormData({
            name: '',
            email: formData.email,
            phone: '',
            password: '',
            confirmPassword: ''
          });

          setShowPassword(false);
          setShowConfirmPassword(false);
        } else {
          setError(response.error || 'Registration failed');
        }

      } else {
        const response = await authService.login({
          email: formData.email,
          password: formData.password
        });

        if (response.success) {
          onLogin(response.data);
        } else {
          setError(response.error || 'Login failed');
        }
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Diamond className="w-10 h-10 text-cyan-400" />
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI'STAY
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">

          <h2 className="text-2xl font-bold text-center text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <p className="text-gray-400 text-center mb-8">
            {isSignUp
              ? 'Join the future of luxury hospitality'
              : 'Sign in to access your dashboard'}
          </p>

          {/* Messages */}
          {message && (
            <div className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-xl text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* FULL NAME */}
            {isSignUp && (
              <div>
                <label className="text-sm text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label className="text-sm text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                  required
                />
              </div>
            </div>

            {/* PHONE */}
            {isSignUp && (
              <div>
                <label className="text-sm text-gray-300">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09XXXXXXXXX"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* PASSWORD */}
            <div>
              <label className="text-sm text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            {isSignUp && (
              <div>
                <label className="text-sm text-gray-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 z-10"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-white"
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>

          </form>

          {/* TOGGLE */}
          <p className="text-center text-gray-400 mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="ml-2 text-cyan-400"
            >
              {isSignUp ? 'Sign In' : 'Create account'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;