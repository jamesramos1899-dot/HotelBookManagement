import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Building2, BedDouble, Calendar, Star, 
  LogOut, Plus, Edit2, Trash2, X, Search, DollarSign, 
  TrendingUp, AlertCircle, Check, MapPin, Phone, Mail,
  MessageSquare, ThumbsUp, Flag, User, Camera, Lock,
  ChevronLeft, Users, Eye,
  PhilippinePeso
} from 'lucide-react';
import { getHotels } from './services/hotelService';
import { getHotelRooms, createRoom, updateRoom, deleteRoom } from './services/roomService';
import { getMyHotelBookings } from './services/bookingService';
import api from './services/api';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import { getHotelConversations, getGuestConversation, replyToGuest } from './services/chatService';
import autoTable from 'jspdf-autotable';

// ALERT MODAL
const AlertModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
  if (!isOpen) return null;
  const bgColor = type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30';
  const iconColor = type === 'error' ? 'text-red-400' : 'text-green-400';
  const buttonColor = type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600';
  
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-slate-900 rounded-2xl p-6 max-w-md w-full border ${bgColor} shadow-2xl`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor}`}>
            <AlertCircle className={`w-6 h-6 ${iconColor}`} />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>
        <button onClick={onClose} className={`w-full py-3 ${buttonColor} text-white rounded-xl font-medium transition-colors`}>
          OK
        </button>
      </div>
    </div>
  );
};

// PROFILE MODAL
const ProfileModal = ({ show, onClose, user, onUpdate, uploadingPhoto, onPhotoUpload, fileInputRef }) => {
  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && user) {
      setForm({ name: user.name || '', phone: user.phone || '', avatar: user.avatar || '' });
    }
  }, [show, user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/me', { name: form.name, phone: form.phone });
      if (res.data.success) {
        onUpdate(res.data.data);
        Swal.fire('Updated!', 'Profile updated successfully.', 'success');
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to update', 'error');
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Swal.fire('Error', 'Passwords do not match', 'error');
    }
    setLoading(true);
    try {
      // You'll need to add this endpoint in backend
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data.success) {
        Swal.fire('Success', 'Password changed successfully', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to change password', 'error');
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">My Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl ${activeTab === 'profile' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}`}>
            Profile Info
          </button>
          <button onClick={() => setActiveTab('password')} className={`px-4 py-2 rounded-xl ${activeTab === 'password' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}`}>
            Change Password
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div className="flex justify-center mb-4">
              <div 
                className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-2xl font-bold relative overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                                   {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Avatar failed to load:', user.avatar);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className={`${user?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                  {form.name?.charAt(0) || 'H'}
                </span>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingPhoto ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={onPhotoUpload}
                disabled={uploadingPhoto}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white disabled:opacity-50">
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        ) : (
                    <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Password</label>
              <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                placeholder="Enter your current password"
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">New Password</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                placeholder="Enter your new password"
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                placeholder="Re-enter your new password"
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white disabled:opacity-50">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ROOM MODAL
const RoomModal = ({ show, onClose, editingRoom, hotelId, onSuccess }) => {
  const [form, setForm] = useState({
    roomNumber: '', type: 'double', pricePerNight: '', capacity: 2, 
    description: '', amenities: [], images: ['']
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && editingRoom) {
      setForm({
        roomNumber: editingRoom.roomNumber || '',
        type: editingRoom.type || 'double',
        pricePerNight: editingRoom.pricePerNight || '',
        capacity: editingRoom.capacity || 2,
        description: editingRoom.description || '',
        amenities: editingRoom.amenities || [],
        images: editingRoom.images || ['']
      });
    } else if (show) {
      setForm({ roomNumber: '', type: 'double', pricePerNight: '', capacity: 2, description: '', amenities: [], images: [''] });
    }
  }, [show, editingRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const roomData = { ...form, hotel: hotelId };
      if (editingRoom) {
        await updateRoom(editingRoom._id, roomData);
        Swal.fire('Success', 'Room updated', 'success');
      } else {
        await createRoom(roomData);
        Swal.fire('Success', 'Room created', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to save room', 'error');
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">{editingRoom ? 'Edit Room' : 'Add Room'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Number</label>
             <input type="text" value={form.roomNumber} onChange={(e) => setForm({...form, roomNumber: e.target.value})} placeholder="e.g. 101, A-05"
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white">
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
                <option value="deluxe">Deluxe</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Price/Night (₱)</label>
             <input type="number" value={form.pricePerNight} onChange={(e) => setForm({...form, pricePerNight: e.target.value})} placeholder="0000"
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Capacity</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm({...form, capacity: e.target.value})}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Room features, bed type, view, etc."
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white min-h-[80px]" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/10 rounded-xl font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white disabled:opacity-50">
              {loading ? 'Saving...' : (editingRoom ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// HOTEL MODAL
const HotelModal = ({ show, onClose, onSuccess, editingHotel }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: { address: '', city: '', country: '' },
    images: [''],
    amenities: [],
    starRating: 5,
    contact: { phone: '', email: '' }
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
  if (show && editingHotel) {
    setForm({
      name: editingHotel.name || '',
      description: editingHotel.description || '',
      location: editingHotel.location || { address: '', city: '', country: '' },
      images: editingHotel.images?.length ? editingHotel.images : [''],
      amenities: editingHotel.amenities || [],
      starRating: editingHotel.starRating || 5,
      contact: editingHotel.contact || { phone: '', email: '' }
    });
  } else if (show) {
    // Reset to empty for new hotel
    setForm({
      name: '',
      description: '',
      location: { address: '', city: '', country: '' },
      images: [''],
      amenities: [],
      starRating: 5,
      contact: { phone: '', email: '' }
    });
  }
}, [show, editingHotel]);

  const updateForm = (field, value) => {
    setForm(prev => {
      const newForm = { ...prev };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newForm[parent] = { ...newForm[parent], [child]: value };
      } else {
        newForm[field] = value;
      }
      return newForm;
    });
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addImage = () => setForm(prev => ({ ...prev, images: [...prev.images, ''] }));
  const removeImage = (idx) => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  const updateImage = (idx, value) => setForm(prev => ({
    ...prev,
    images: prev.images.map((img, i) => i === idx ? value : img)
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
if (editingHotel) {
  response = await api.put(`/hotels/${editingHotel._id}`, form);
} else {
  response = await api.post('/hotels', form);
}
      if (response.data.success) {
        Swal.fire('Success', editingHotel ? 'Hotel updated successfully!' : 'Hotel added successfully!', 'success');
        onSuccess();
        onClose();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to add hotel', 'error');
    }
    setLoading(false);
  };

  if (!show) return null;

  const HOTEL_AMENITIES = [
    'WiFi', 'Parking', 'Breakfast', 'Pool', 'Gym', 'SPA', 'AC', 
    'Heating', 'TV', 'Entertainment', 'Restaurant', 'Bar', 
    'Pet Friendly', 'Family Friendly', 'Accessible', 'Business Center', 
    '24/7 Service', 'Security'
  ];

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">{editingHotel ? 'Edit Hotel' : 'Add Your Hotel'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hotel Name *</label>
           <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="e.g. Grand Plaza Hotel"
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description *</label>
           <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Describe your hotel, its features, and what makes it special..."
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none min-h-[100px]" required />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Address *</label>
             <input type="text" value={form.location.address} onChange={(e) => updateForm('location.address', e.target.value)} placeholder="123 Main Street"
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">City *</label>
             <input type="text" value={form.location.city} onChange={(e) => updateForm('location.city', e.target.value)} placeholder="e.g. Cebu City"
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Country *</label>
             <input type="text" value={form.location.country} onChange={(e) => updateForm('location.country', e.target.value)} placeholder="e.g. Philippines"
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone</label>
             <input type="tel" value={form.contact.phone} onChange={(e) => updateForm('contact.phone', e.target.value)} placeholder="+63 912 345 6789"
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
             <input type="email" value={form.contact.email} onChange={(e) => updateForm('contact.email', e.target.value)} placeholder="username@gmail.com"
  className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Star Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => updateForm('starRating', star)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    form.starRating >= star ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-400'
                  }`}>
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Images</label>
            <div className="space-y-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="url" value={img} onChange={(e) => updateImage(idx, e.target.value)} placeholder="https://example.com/image.jpg"
                    className="flex-1 p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" />
                  {form.images.length > 1 && (
                    <button type="button" onClick={() => removeImage(idx)} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addImage} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-sm hover:bg-white/10 transition-colors">
                <Plus className="w-4 h-4" /> Add Image URL
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {HOTEL_AMENITIES.map((amenity) => (
                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-2 rounded-xl border transition-all text-sm ${
                    form.amenities.includes(amenity)
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}>
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Saving...' : (editingHotel ? 'Update Hotel' : 'Create Hotel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const HotelAdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
const fileInputRef = useRef(null);
const [guestConversations, setGuestConversations] = useState([]);
const [activeGuestId, setActiveGuestId] = useState(null);
const [activeGuestName, setActiveGuestName] = useState('');
const [adminChatMessages, setAdminChatMessages] = useState([]);
const [adminChatInput, setAdminChatInput] = useState('');
const [adminChatLoading, setAdminChatLoading] = useState(false);

   useEffect(() => { 
  fetchData();
  fetchGuestConversations();
  return () => {
    if (adminPollingRef.current) clearInterval(adminPollingRef.current);
  };
    // Load avatar from localStorage on mount
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    if (stored.avatar) {
      setCurrentUser(prev => ({ ...prev, avatar: stored.avatar }));
    }
  }, []);

const fetchData = async () => {
  setLoading(true);
  try {
    // Get current user data
    const meRes = await api.get('/auth/me');
    if (meRes.data.success) {
      const userData = meRes.data.data;
      let avatarUrl = userData.avatar || '';
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        let baseUrl = api.defaults.baseURL || window.location.origin;
        baseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
        avatarUrl = baseUrl + '/' + avatarUrl.replace(/^\//, '');
      }
      setCurrentUser({ ...userData, avatar: avatarUrl || userData.avatar });
    }

    // Get hotel admin's hotel
    const hotelsRes = await getHotels();
    let foundHotel = null; // <-- use a local variable
    if (hotelsRes.success) {
      foundHotel = hotelsRes.data.find(h => h.owner === user?._id || h.createdBy === user?._id);
      setHotel(foundHotel || null);
      if (foundHotel) {
        const roomsRes = await getHotelRooms(foundHotel._id);
        if (roomsRes.success) setRooms(roomsRes.data);
        setReviews(foundHotel.reviews || []);
      }
    }

    // Get bookings for this hotel — USE foundHotel, NOT hotel state!
    const bookingsRes = await getMyHotelBookings();
    if (bookingsRes.success) {
      const hotelBookings = foundHotel 
        ? bookingsRes.data.filter(b => b.hotel?._id === foundHotel._id || b.hotel === foundHotel._id)
        : [];
      setBookings(hotelBookings);
    }
  } catch (err) {
    console.error('Failed to fetch data', err);
  } finally {
    setLoading(false);
  }
};
const fetchGuestConversations = async () => {
  try {
    const res = await getHotelConversations();
    if (res.success) setGuestConversations(res.data);
  } catch (err) {
    console.error('Failed to fetch guest conversations', err);
  }
};

const adminPollingRef = React.useRef(null);

const openGuestChat = async (guestId, guestName) => {
  setActiveGuestId(guestId);
  setActiveGuestName(guestName);
  try {
    const res = await getGuestConversation(guestId);
    if (res.success) setAdminChatMessages(res.data.messages || []);
  } catch (err) {
    setAdminChatMessages([]);
  }

  // Clear any existing polling
  if (adminPollingRef.current) clearInterval(adminPollingRef.current);

  // Poll every 3 seconds
  adminPollingRef.current = setInterval(async () => {
    try {
      const res = await getGuestConversation(guestId);
      if (res.success) setAdminChatMessages(res.data.messages || []);
    } catch (err) {}
  }, 3000);
};

const handleAdminSendMessage = async () => {
  if (!adminChatInput.trim() || !activeGuestId) return;
  setAdminChatLoading(true);
  try {
    const res = await replyToGuest(activeGuestId, adminChatInput.trim());
    if (res.success) {
      setAdminChatMessages(prev => [...prev, res.data]);
      setAdminChatInput('');
    }
  } catch (err) {
    console.error('Failed to send reply', err);
  }
  setAdminChatLoading(false);
};
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return showAlert('File Too Large', 'Profile photo must be less than 5MB');
    }
    if (!file.type.startsWith('image/')) {
      return showAlert('Invalid File', 'Please upload an image file');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploadingPhoto(true);
      const response = await api.put('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
                let avatarUrl = response.data.data.avatar;
        // Fix relative URL to absolute
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          let baseUrl = api.defaults.baseURL || window.location.origin;
          // Remove /api from end since uploads are served at root
          baseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
          avatarUrl = baseUrl + '/' + avatarUrl.replace(/^\//, '');
        }
        const newAvatarUrl = avatarUrl + '?t=' + Date.now();
        console.log('Avatar URL:', newAvatarUrl);

        // Update current user state immediately
        setCurrentUser(prev => ({ ...prev, avatar: newAvatarUrl }));
        
        // Update localStorage so it persists after logout
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, avatar: newAvatarUrl }));

        Swal.fire('Success', 'Profile photo updated', 'success');
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };
  const showAlert = (title, message, type = 'error') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

   const handleSignOut = async () => {
    const result = await Swal.fire({
      title: 'Sign Out?',
      text: 'Are you sure you want to sign out of your account?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#fff',
      customClass: {
        popup: 'rounded-2xl border border-white/10',
        confirmButton: 'rounded-xl',
        cancelButton: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      onLogout();
    }
  }; 
  const handleDeleteRoom = async (roomId) => {
    const result = await Swal.fire({
      title: 'Delete Room?', text: 'This cannot be undone!', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete'
    });
    if (!result.isConfirmed) return;
    try {
      await deleteRoom(roomId);
      Swal.fire('Deleted', 'Room removed', 'success');
      fetchData();
    } catch (err) {
      showAlert('Error', 'Failed to delete room');
    }
  };

  // STATS
  const stats = useMemo(() => {
    const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0);
    return {
      totalBookings: bookings.length,
      totalRooms: rooms.length,
      totalRevenue,
      averageRating: hotel?.averageRating || 0,
      totalReviews: reviews.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length
    };
  }, [bookings, rooms, hotel, reviews]);

  const Sidebar = () => (
    <div className="w-64 bg-slate-900/50 border-r border-white/10 p-6 flex flex-col min-h-screen h-full">
      <div className="flex items-center gap-2 mb-8">
        <Building2 className="w-8 h-8 text-cyan-400" />
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Hotel Admin</span>
      </div>
      
      <nav className="space-y-2 flex-1">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <SidebarItem icon={Building2} label="My Hotel" active={activeTab === 'hotel'} onClick={() => setActiveTab('hotel')} />
        <SidebarItem icon={Calendar} label="All Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} badge={bookings.length} />
        <SidebarItem icon={MessageSquare} label="All Reviews" active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} badge={reviews.length} />
        <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === 'messages'} onClick={() => { setActiveTab('messages'); fetchGuestConversations(); }} badge={guestConversations.length} />
        <SidebarItem icon={TrendingUp} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
      </nav>

      <div className="pt-6 border-t border-white/10">
        <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 mb-4 w-full hover:bg-white/5 p-2 rounded-xl transition-colors">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold overflow-hidden">
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt="avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span className={`${currentUser?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
              {currentUser?.name?.charAt(0) || 'H'}
            </span>
          </div>
          <div className="text-left">
            <p className="font-medium text-sm">{currentUser?.name || 'Hotel Admin'}</p>
            <p className="text-xs text-purple-400">Edit Profile</p>
          </div>
        </button>
                <button onClick={handleSignOut} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm w-full">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
    <button onClick={onClick} 
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      <div className="flex items-center gap-3"><Icon className="w-5 h-5" /><span className="font-medium">{label}</span></div>
      {badge > 0 && <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded-full">{badge}</span>}
    </button>
  );

  const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
      cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
      pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400',
      green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
      yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
      red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400'
    };
    return (
      <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-xl rounded-2xl p-6 border`}>
        <Icon className="w-8 h-8 mb-3" />
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    );
  };

  // DASHBOARD VIEW
  const DashboardView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Hotel Dashboard</h2>
      
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={Calendar} label="Total Bookings" value={stats.totalBookings} color="purple" />
        <StatCard icon={BedDouble} label="Total Rooms" value={stats.totalRooms} color="pink" />
        <StatCard icon={PhilippinePeso} label="Total Revenue" value={`₱${stats.totalRevenue.toLocaleString()}`} color="green" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" /> Booking Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-xl border border-green-500/30">
              <span className="text-green-400">Confirmed</span><span className="font-bold text-xl">{stats.confirmedBookings}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-xl border border-red-500/30">
              <span className="text-red-400">Cancelled</span><span className="font-bold text-xl">{stats.cancelledBookings}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Revenue</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-xl border border-green-500/30">
              <span className="text-green-400">Total Revenue</span><span className="font-bold text-xl">₱{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <span className="text-cyan-400">Avg per Booking</span>
              <span className="font-bold text-xl">₱{stats.confirmedBookings > 0 ? Math.round(stats.totalRevenue / stats.confirmedBookings).toLocaleString() : 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Reviews Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <span className="text-yellow-400">Total Reviews</span><span className="font-bold text-xl">{stats.totalReviews}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
              <span className="text-purple-400">Average Rating</span>
              <span className="font-bold text-xl flex items-center gap-1">{stats.averageRating} <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /></span>
            </div>
          </div>
        </div>
      </div>
    {/* ANALYTICS SECTION */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" /> Booking Analytics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Confirmation Rate</span>
              <span className="text-green-400 font-bold">
                {stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}%` }} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-400 text-sm">Cancellation Rate</span>
              <span className="text-red-400 font-bold">
                {stats.totalBookings > 0 ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-red-400 h-2 rounded-full transition-all" style={{ width: `${stats.totalBookings > 0 ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0}%` }} />
            </div>
      
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <PhilippinePeso className="w-5 h-5 text-green-400" /> Revenue Analytics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
              <span className="text-gray-400 text-sm">Total Revenue</span>
              <span className="text-green-400 font-bold">₱{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
              <span className="text-gray-400 text-sm">Avg Revenue / Booking</span>
              <span className="text-cyan-400 font-bold">
                ₱{stats.confirmedBookings > 0 ? Math.round(stats.totalRevenue / stats.confirmedBookings).toLocaleString() : 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
              <span className="text-gray-400 text-sm">Avg Rating</span>
              <span className="text-yellow-400 font-bold">{stats.averageRating} ⭐</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
              <span className="text-gray-400 text-sm">Total Rooms</span>
              <span className="text-purple-400 font-bold">{stats.totalRooms} rooms</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold mb-4">Recent Bookings</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {bookings.slice(0, 5).map(booking => (
            <div key={booking._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="font-medium text-sm">Room #{booking.room?.roomNumber}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> {booking.user?.name || 'Guest'}</p>
<p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {booking.user?.email || 'No email'}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{booking.status}</span>
                <p className="text-xs text-cyan-400 mt-1">₱{booking.totalPrice}</p>
              </div>
            </div>
          ))}
          {bookings.length === 0 && <p className="text-gray-400 text-center py-4">No bookings yet</p>}
        </div>
      </div>
    </div>
  );

  // MY HOTEL VIEW (includes rooms)
  const HotelView = () => {
    if (!hotel) {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">My Hotel</h2>
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">You haven't added your hotel yet.</p>
                        <button onClick={() => setShowHotelModal(true)} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white hover:shadow-lg transition-all">
              Add Your Hotel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Hotel</h2>
        
        {/* Hotel Info Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col md:flex-row gap-6">
            <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} alt={hotel.name}
              className="w-full md:w-64 h-40 object-cover rounded-xl" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{hotel.name}</h3>
                  <p className="text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {hotel.location?.city}, {hotel.location?.country}</p>
                </div>
                <button onClick={() => { setEditingHotel(hotel); setShowHotelModal(true); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20">
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-3">{hotel.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" /> {hotel.averageRating || hotel.starRating} ({hotel.reviewCount || 0} reviews)</span>
                <span className="text-cyan-400 font-medium">{hotel.starRating}-Star</span>
                <span className="text-purple-400 font-medium">{rooms.length} rooms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Rooms</h3>
          <button onClick={() => { setEditingRoom(null); setShowRoomModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all">
            <Plus className="w-5 h-5" /> Add Room
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {rooms.map(room => (
            <div key={room._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold capitalize">{room.type} Room #{room.roomNumber}</h4>
                  <p className="text-cyan-400 text-2xl font-bold">₱{room.pricePerNight}<span className="text-sm text-gray-400 font-normal">/night</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingRoom(room); setShowRoomModal(true); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteRoom(room._id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">{room.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Capacity</p>
                  <p className="font-medium flex items-center gap-1"><Users className="w-4 h-4" /> {room.capacity} guests</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className={`font-medium ${room.isAvailable !== false ? 'text-green-400' : 'text-red-400'}`}>
                    {room.isAvailable !== false ? 'Available' : 'Unavailable'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {rooms.length === 0 && <p className="text-gray-400 text-center py-8 col-span-2">No rooms added yet.</p>}
        </div>
      </div>
    );
  };

  // BOOKINGS VIEW
  const BookingsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">All Bookings</h2>
      <div className="grid gap-4">
        {bookings.map(booking => {
          const nights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
          return (
            <div key={booking._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">Room #{booking.room?.roomNumber}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User className="w-4 h-4" /><span>{booking.user?.name || 'Guest'}</span>
                        <Mail className="w-3 h-3" /><span>{booking.user?.email || 'No email'}</span>
                      </div>
                      {booking.user?.phone && <div className="flex items-center gap-1 text-sm text-cyan-400 mt-1"><Phone className="w-3 h-3" /><span>{booking.user.phone}</span></div>}
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-cyan-400">₱{booking.totalPrice}</span>
                      <p className="text-xs text-gray-500">{nights} nights</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                    <div><p className="text-gray-500 text-xs">Check-in</p><p className="font-medium">{new Date(booking.checkInDate).toLocaleDateString()}</p></div>
                    <div><p className="text-gray-500 text-xs">Check-out</p><p className="font-medium">{new Date(booking.checkOutDate).toLocaleDateString()}</p></div>
                    <div><p className="text-gray-500 text-xs">Guests</p><p className="font-medium">{booking.guests}</p></div>
                    <div><p className="text-gray-500 text-xs">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {bookings.length === 0 && <div className="text-center py-12"><Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">No bookings found.</p></div>}
      </div>
    </div>
  );

  // REVIEWS VIEW
  const ReviewsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">All Reviews</h2>
      <div className="grid gap-4">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
                  {review.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium">{review.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-5 h-5 fill-yellow-400" /><span className="font-bold text-lg">{review.rating}</span>
              </div>
            </div>
            <p className="text-gray-300">{review.comment}</p>
          </div>
        ))}
        {reviews.length === 0 && <div className="text-center py-12"><MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">No reviews yet.</p></div>}
      </div>
    </div>
  );
  // REPORTS VIEW
const ReportsView = () => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Hotel Performance Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Hotel: ${hotel?.name || 'N/A'}`, 14, 38);
    
    // Stats Section
    doc.setFontSize(14);
    doc.text('Statistics Overview', 14, 50);
    doc.setFontSize(11);
    doc.text(`Total Bookings: ${stats.totalBookings}`, 14, 58);
    doc.text(`Total Rooms: ${stats.totalRooms}`, 14, 65);
        doc.text(`Total Revenue: PHP ${stats.totalRevenue.toLocaleString()}`, 14, 72);
       doc.text(`Average Rating: ${stats.averageRating} stars`, 14, 79);
    doc.text(`Confirmed: ${stats.confirmedBookings} | Pending: ${stats.pendingBookings} | Cancelled: ${stats.cancelledBookings}`, 14, 86);
    
    // Bookings Table
    doc.setFontSize(14);
    doc.text('Recent Bookings', 14, 100);
    
    const bookingData = bookings.map(b => [
  b.room?.roomNumber || 'N/A',
  b.user?.name || 'Guest',
  new Date(b.checkInDate).toLocaleDateString(),
  new Date(b.checkOutDate).toLocaleDateString(),
  `PHP ${b.totalPrice}`,
  b.status
]);
    
        autoTable(doc, {
      startY: 105,
      head: [['Room', 'Guest', 'Email', 'Check-in', 'Check-out', 'Price', 'Status']],
      body: bookingData,
      theme: 'striped',
      headStyles: { fillColor: [6, 182, 212] }
    });
    
    // Rooms Table
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Rooms Inventory', 14, finalY);
    
    const roomData = rooms.map(r => [
      r.roomNumber,
      r.type,
            `PHP ${r.pricePerNight}`,
      r.capacity,
      r.isAvailable !== false ? 'Available' : 'Unavailable'
    ]);
    
       autoTable(doc, {
      startY: finalY + 5,
      head: [['Room #', 'Type', 'Price/Night', 'Capacity', 'Status']],
      body: roomData,
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] }
    });
    
    // Reviews Summary
    const finalY2 = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 160;
    doc.setFontSize(14);
    doc.text('Reviews Summary', 14, finalY2);
    doc.setFontSize(11);
    doc.text(`Total Reviews: ${stats.totalReviews}`, 14, finalY2 + 7);
    doc.text(`Average Rating: ${stats.averageRating} stars`, 14, finalY2 + 14);

    // Analytics Section
    const finalY3 = finalY2 + 30;
    doc.setFontSize(14);
    doc.text('Analytics Overview', 14, finalY3);
    doc.setFontSize(11);

    const confirmRate = stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0;
    const cancelRate = stats.totalBookings > 0 ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0;
  
    const avgRevenue = stats.confirmedBookings > 0 ? Math.round(stats.totalRevenue / stats.confirmedBookings) : 0;

    autoTable(doc, {
      startY: finalY3 + 5,
      head: [['Metric', 'Value']],
      body: [
        ['Confirmation Rate', `${confirmRate}%`],
        ['Cancellation Rate', `${cancelRate}%`],
        ['Total Revenue', `PHP ${stats.totalRevenue.toLocaleString()}`],
        ['Avg Revenue per Booking', `PHP ${avgRevenue.toLocaleString()}`],
        ['Average Rating', `${stats.averageRating} stars`],
        ['Total Reviews', `${stats.totalReviews}`],
        ['Total Rooms', `${stats.totalRooms}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [6, 182, 212] }
    });

    doc.save(`hotel-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Generate Report</h2>
        <button onClick={generatePDF} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white hover:shadow-lg transition-all">
          <TrendingUp className="w-5 h-5" /> Download PDF
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon={Calendar} label="Total Bookings" value={stats.totalBookings} color="purple" />
        <StatCard icon={BedDouble} label="Total Rooms" value={stats.totalRooms} color="pink" />
        <StatCard icon={PhilippinePeso} label="Total Revenue" value={`₱${stats.totalRevenue.toLocaleString()}`} color="green" />
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold mb-4">Report Preview</h3>
        <div className="space-y-4 text-gray-400">
          <p>This report will include:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Hotel statistics (bookings, rooms, revenue)</li>
            <li>Complete bookings list with guest details</li>
            <li>Rooms inventory and availability</li>
            <li>Reviews summary</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <AlertModal isOpen={alertModal.isOpen} onClose={() => setAlertModal(prev => ({...prev, isOpen: false}))} title={alertModal.title} message={alertModal.message} type={alertModal.type} />
            <ProfileModal 
        show={showProfile} 
        onClose={() => setShowProfile(false)} 
        user={currentUser} 
        onUpdate={(u) => setCurrentUser(u)} 
        uploadingPhoto={uploadingPhoto}
        onPhotoUpload={handlePhotoUpload}
        fileInputRef={fileInputRef}
      />
      <RoomModal show={showRoomModal} onClose={() => { setShowRoomModal(false); setEditingRoom(null); }} editingRoom={editingRoom} hotelId={hotel?._id} onSuccess={fetchData} />
              <HotelModal show={showHotelModal} onClose={() => setShowHotelModal(false)} onSuccess={fetchData} editingHotel={editingHotel}/>
      
      <Sidebar />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'hotel' && <HotelView />}
          {activeTab === 'bookings' && <BookingsView />}
          {activeTab === 'reviews' && <ReviewsView />}
          {activeTab === 'reports' && <ReportsView />}
{activeTab === 'messages' && (
  <div className="flex h-full gap-4" style={{ minHeight: '70vh' }}>
    <div className="w-64 bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col gap-2 overflow-y-auto">
      <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-2">Guest Messages</h3>
      {guestConversations.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">No guest messages yet.</p>
      )}
      {guestConversations.map(conv => (
        <button
          key={conv.guestId}
          onClick={() => openGuestChat(conv.guestId, conv.guestName)}
          className={`w-full text-left p-3 rounded-xl transition-all ${activeGuestId === conv.guestId ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5 hover:bg-white/10'}`}
        >
          <p className="font-medium text-sm">{conv.guestName}</p>
          <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
        </button>
      ))}
    </div>
    <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 flex flex-col">
      {!activeGuestId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Select a guest conversation to reply</p>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold">{activeGuestName}</h3>
            <p className="text-xs text-gray-400">Guest conversation</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '50vh' }}>
           {adminChatMessages.map((msg, idx) => (
  <div key={idx} className={`flex flex-col ${msg.senderRole === 'hotel_admin' ? 'items-end' : 'items-start'}`}>
    <p className="text-xs text-gray-500 mb-1 px-1">
      {msg.senderRole === 'hotel_admin' ? 'You' : activeGuestName}
    </p>
    <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.senderRole === 'hotel_admin' ? 'bg-cyan-500/30 text-white' : 'bg-white/10 text-gray-200'}`}>
      <p>{msg.message}</p>
      <p className="text-xs opacity-50 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}</p>
    </div>
  </div>
))}
            {adminChatMessages.length === 0 && (
              <p className="text-center text-gray-500 text-sm mt-8">No messages yet.</p>
            )}
          </div>
          <div className="p-4 border-t border-white/10 flex gap-3">
            <input
              type="text"
              value={adminChatInput}
              onChange={(e) => setAdminChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSendMessage()}
              placeholder="Type a reply..."
              className="flex-1 p-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
            />
            <button
              onClick={handleAdminSendMessage}
              disabled={adminChatLoading || !adminChatInput.trim()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default HotelAdminDashboard;