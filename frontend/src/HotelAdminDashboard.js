
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Building2, BedDouble, Calendar, Star, 
  LogOut, Plus, Edit2, Trash2, X, ChevronLeft, Users, 
  MapPin, Phone, Mail, Search, DollarSign, 
  TrendingUp, AlertCircle, Check, User, CheckCircle, XCircle,
  MessageSquare, ThumbsUp, Flag, Eye, Wifi, Car, Coffee, Waves, 
  Dumbbell, Sparkles, Wind, Thermometer, Tv, Music, UtensilsCrossed, 
  Wine, PawPrint, Baby, Accessibility, Briefcase, Clock, Shield
} from 'lucide-react';
import { getHotels } from './services/hotelService';
import { getHotelRooms, getAllRooms, deleteRoom } from './services/roomService';
import { getMyBookings, cancelBooking, deleteBooking } from './services/bookingService';
import api from './services/api';
import Swal from 'sweetalert2';

// AMENITIES OPTIONS
const HOTEL_AMENITIES = [
  { icon: Wifi, label: 'Free WiFi', value: 'WiFi' },
  { icon: Car, label: 'Free Parking', value: 'Parking' },
  { icon: Coffee, label: 'Breakfast', value: 'Breakfast' },
  { icon: Waves, label: 'Swimming Pool', value: 'Pool' },
  { icon: Dumbbell, label: 'Fitness Center', value: 'Gym' },
  { icon: Sparkles, label: 'SPA & Wellness', value: 'SPA' },
  { icon: Wind, label: 'Air Conditioning', value: 'AC' },
  { icon: Thermometer, label: 'Heating', value: 'Heating' },
  { icon: Tv, label: 'Smart TV', value: 'TV' },
  { icon: Music, label: 'Entertainment', value: 'Entertainment' },
  { icon: UtensilsCrossed, label: 'Restaurant', value: 'Restaurant' },
  { icon: Wine, label: 'Bar/Lounge', value: 'Bar' },
  { icon: PawPrint, label: 'Pet Friendly', value: 'Pet Friendly' },
  { icon: Baby, label: 'Family Friendly', value: 'Family Friendly' },
  { icon: Accessibility, label: 'Accessible', value: 'Accessible' },
  { icon: Briefcase, label: 'Business Center', value: 'Business Center' },
  { icon: Clock, label: '24/7 Service', value: '24/7 Service' },
  { icon: Shield, label: 'Security', value: 'Security' }
];

const ROOM_TYPES = [
  { value: 'single', label: 'Single Room', maxGuests: 1 },
  { value: 'double', label: 'Double Room', maxGuests: 2 },
  { value: 'suite', label: 'Suite', maxGuests: 4 },
  { value: 'deluxe', label: 'Deluxe Room', maxGuests: 3 },
  { value: 'family', label: 'Family Room', maxGuests: 6 }
];

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

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

// ROOM MODAL
const RoomModal = ({ 
  showRoomModal, setShowRoomModal, editingRoom, roomForm, setRoomForm, 
  loading, handleCreateRoom, handleUpdateRoom, selectedHotel 
}) => {
  const [localForm, setLocalForm] = useState({
    hotel: '', roomNumber: '', type: 'double', pricePerNight: '', 
    capacity: 2, description: '', amenities: [], amenitiesString: '', images: ['']
  });

  useEffect(() => {
    if (showRoomModal) {
      if (editingRoom) {
        const amenityStr = editingRoom.amenities ? editingRoom.amenities.join(', ') : '';
        setLocalForm({
          hotel: editingRoom.hotel || '', roomNumber: editingRoom.roomNumber || '',
          type: editingRoom.type || 'double', pricePerNight: editingRoom.pricePerNight || '',
          capacity: editingRoom.capacity || 2, description: editingRoom.description || '',
          amenities: editingRoom.amenities || [], amenitiesString: amenityStr,
          images: editingRoom.images || ['']
        });
      } else {
        setLocalForm({
          hotel: selectedHotel?._id || '', roomNumber: '', type: 'double',
          pricePerNight: '', capacity: 2, description: '', amenities: [], amenitiesString: '', images: ['']
        });
      }
    }
  }, [showRoomModal, editingRoom, selectedHotel]);

  const updateLocalForm = (field, value) => setLocalForm(prev => ({ ...prev, [field]: value }));

  const handleAmenitiesChange = (e) => {
    const value = e.target.value;
    setLocalForm(prev => ({
      ...prev, amenitiesString: value,
      amenities: value.split(',').map(s => s.trim()).filter(Boolean)
    }));
  };

  const roomType = ROOM_TYPES.find(t => t.value === localForm.type);
  const maxGuestsForType = roomType?.maxGuests || 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    setRoomForm(localForm);
    if (editingRoom) handleUpdateRoom(e, localForm);
    else handleCreateRoom(e, localForm);
  };

  if (!showRoomModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
          <button onClick={() => setShowRoomModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Number</label>
              <input type="text" value={localForm.roomNumber} onChange={(e) => updateLocalForm('roomNumber', e.target.value)}
                placeholder="101" className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Type</label>
              <select value={localForm.type} onChange={(e) => {
                const newType = e.target.value;
                const typeInfo = ROOM_TYPES.find(t => t.value === newType);
                setLocalForm(prev => ({ ...prev, type: newType, capacity: Math.min(prev.capacity, typeInfo?.maxGuests || 2) }));
              }} className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none">
                {ROOM_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Price per Night (₱)</label>
              <input type="number" value={localForm.pricePerNight} onChange={(e) => updateLocalForm('pricePerNight', Number(e.target.value))}
                min="1" className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Guests ({maxGuestsForType} max)</label>
              <select value={localForm.capacity} onChange={(e) => updateLocalForm('capacity', Number(e.target.value))}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none">
                {GUEST_OPTIONS.filter(n => n <= maxGuestsForType).map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea value={localForm.description} onChange={(e) => updateLocalForm('description', e.target.value)}
              placeholder="Room description..." className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none min-h-[80px]" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Room Amenities (comma separated)</label>
            <input type="text" value={localForm.amenitiesString} onChange={handleAmenitiesChange}
              placeholder="WiFi, TV, Mini Bar, Balcony..." className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowRoomModal(false)} className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Saving...' : (editingRoom ? 'Update Room' : 'Create Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// REVIEWS MODAL
const ReviewsModal = ({ showReviewsModal, setShowReviewsModal, selectedHotelForReviews }) => {
  if (!showReviewsModal || !selectedHotelForReviews) return null;
  const reviews = selectedHotelForReviews.reviews || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold">Reviews: {selectedHotelForReviews.name}</h3>
            <p className="text-gray-400">{reviews.length} reviews • Average: {selectedHotelForReviews.averageRating}★</p>
          </div>
          <button onClick={() => setShowReviewsModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No reviews yet</p>
          ) : (
            reviews.map((review, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                      {review.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <span className="font-medium">{review.user?.name || 'Unknown'}</span>
                      {review.user?.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {review.user.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="font-bold">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-2">{review.comment}</p>
                <p className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const HotelAdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);
  const [selectedHotelForReviews, setSelectedHotelForReviews] = useState(null);
  
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const [roomForm, setRoomForm] = useState({
    hotel: '', roomNumber: '', type: 'double', pricePerNight: '',
    capacity: 2, description: '', amenities: [], images: ['']
  });

  // Get hotel admin's assigned hotel(s)
  const myHotels = useMemo(() => {
    if (!user?.hotelId) return hotels;
    return hotels.filter(h => h._id === user.hotelId || h.owner === user._id);
  }, [hotels, user]);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const hotelsRes = await getHotels();
      if (hotelsRes.success) setHotels(hotelsRes.data);

      const bookingsRes = await getMyBookings();
      if (bookingsRes.success) setBookings(bookingsRes.data);

      const allRoomsRes = await getAllRooms();
      if (allRoomsRes.success) setRooms(allRoomsRes.data);

      if (selectedHotelForRooms) {
        const roomsRes = await getHotelRooms(selectedHotelForRooms._id);
        if (roomsRes.success) {
          const hotelSpecificRooms = roomsRes.data;
          setRooms(prev => {
            const existingIds = new Set(prev.map(r => r._id));
            const newRooms = hotelSpecificRooms.filter(r => !existingIds.has(r._id));
            return [...prev, ...newRooms];
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message, type = 'error') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () => setAlertModal(prev => ({ ...prev, isOpen: false }));

  // ROOM CRUD
  const handleCreateRoom = async (e, localForm) => {
    e.preventDefault();
    try {
      setLoading(true);
      const roomData = { ...(localForm || roomForm), hotel: selectedHotelForRooms._id };
      const response = await api.post('/rooms', roomData);
      if (response.data.success) {
        showAlert('Success', 'Room created successfully', 'success');
        setShowRoomModal(false);
        resetRoomForm();
        fetchData();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async (e, localForm) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put(`/rooms/${editingRoom._id}`, localForm || roomForm);
      if (response.data.success) {
        showAlert('Success', 'Room updated successfully', 'success');
        setShowRoomModal(false);
        setEditingRoom(null);
        resetRoomForm();
        fetchData();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      setLoading(true);
      await deleteRoom(roomId);
      showAlert('Success', 'Room deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showAlert('Error', 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  // BOOKING MANAGEMENT
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setLoading(true);
      await cancelBooking(bookingId);
      showAlert('Success', 'Booking cancelled', 'success');
      fetchData();
    } catch (err) {
      showAlert('Error', 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Permanently delete this booking?')) return;
    try {
      setLoading(true);
      await deleteBooking(bookingId);
      showAlert('Success', 'Booking deleted', 'success');
      fetchData();
    } catch (err) {
      showAlert('Error', 'Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  const resetRoomForm = () => {
    setRoomForm({
      hotel: '', roomNumber: '', type: 'double', pricePerNight: '',
      capacity: 2, description: '', amenities: [], images: ['']
    });
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      hotel: room.hotel, roomNumber: room.roomNumber, type: room.type,
      pricePerNight: room.pricePerNight, capacity: room.capacity,
      description: room.description || '', amenities: room.amenities || [], images: room.images || ['']
    });
    setShowRoomModal(true);
  };

  const openManageRooms = (hotel) => {
    setSelectedHotelForRooms(hotel);
    setActiveTab('rooms');
  };

  const openViewReviews = (hotel) => {
    setSelectedHotelForReviews(hotel);
    setShowReviewsModal(true);
  };

  // STATS - Filtered by hotel admin's hotels
  const stats = useMemo(() => {
    const hotelIds = myHotels.map(h => h._id);
    const myBookings = bookings.filter(b => hotelIds.includes(b.hotel?._id || b.hotel));
    const myRoomsList = rooms.filter(r => {
      const roomHotelId = r.hotel?._id || r.hotel;
      return hotelIds.includes(roomHotelId);
    });
    
    const totalRevenue = myBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0);
    const totalReviews = myHotels.reduce((sum, h) => sum + (h.reviewCount || 0), 0);
    const averageRating = myHotels.length > 0 ? (myHotels.reduce((sum, h) => sum + (h.averageRating || 0), 0) / myHotels.length).toFixed(1) : 0;
    
    return {
      totalHotels: myHotels.length,
      totalRooms: myRoomsList.length,
      totalBookings: myBookings.length,
      totalRevenue,
      totalReviews,
      averageRating,
      cancelledBookings: myBookings.filter(b => b.status === 'cancelled').length,
      confirmedBookings: myBookings.filter(b => b.status === 'confirmed').length,
      pendingBookings: myBookings.filter(b => b.status === 'pending').length
    };
  }, [myHotels, bookings, rooms]);

  const filteredHotels = myHotels.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allReviews = useMemo(() => {
    const reviews = [];
    myHotels.forEach(hotel => {
      if (hotel.reviews?.length > 0) {
        hotel.reviews.forEach(review => {
          reviews.push({ ...review, hotelId: hotel._id, hotelName: hotel.name, hotelImage: hotel.images?.[0] });
        });
      }
    });
    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [myHotels]);

  const Sidebar = () => (
    <div className="w-64 bg-slate-900/50 border-r border-white/10 p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-8">
        <Building2 className="w-8 h-8 text-cyan-400" />
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Hotel Admin</span>
      </div>
      
      <nav className="space-y-2 flex-1">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSelectedHotelForRooms(null); }} />
        <SidebarItem icon={Building2} label="My Hotels" active={activeTab === 'hotels'} onClick={() => { setActiveTab('hotels'); setSelectedHotelForRooms(null); }} />
        <SidebarItem icon={BedDouble} label="Manage Rooms" active={activeTab === 'rooms'} onClick={() => { setActiveTab('rooms'); setSelectedHotelForRooms(null); }} />
        <SidebarItem icon={Calendar} label="All Bookings" active={activeTab === 'bookings'} onClick={() => { setActiveTab('bookings'); setSelectedHotelForRooms(null); }} />
        <SidebarItem icon={MessageSquare} label="All Reviews" active={activeTab === 'reviews'} onClick={() => { setActiveTab('reviews'); setSelectedHotelForRooms(null); }} badge={stats.totalReviews} />
      </nav>

      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || 'H'}
          </div>
          <div>
            <p className="font-medium text-sm">{user?.name || 'Hotel Admin'}</p>
            <p className="text-xs text-purple-400">Hotel Administrator</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm w-full">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
    <button onClick={onClick} 
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
        active ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </div>
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
        <StatCard icon={Building2} label="My Hotels" value={stats.totalHotels} color="cyan" />
        <StatCard icon={Calendar} label="Total Bookings" value={stats.totalBookings} color="purple" />
        <StatCard icon={BedDouble} label="Total Rooms" value={stats.totalRooms} color="pink" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" /> Booking Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-xl border border-green-500/30">
              <span className="text-green-400">Confirmed</span>
              <span className="font-bold text-xl">{stats.confirmedBookings}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <span className="text-yellow-400">Pending</span>
              <span className="font-bold text-xl">{stats.pendingBookings}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-xl border border-red-500/30">
              <span className="text-red-400">Cancelled</span>
              <span className="font-bold text-xl">{stats.cancelledBookings}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" /> Revenue
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-xl border border-green-500/30">
              <span className="text-green-400">Total Revenue</span>
              <span className="font-bold text-xl">₱{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <span className="text-cyan-400">Avg per Booking</span>
              <span className="font-bold text-xl">
                ₱{stats.confirmedBookings > 0 ? Math.round(stats.totalRevenue / stats.confirmedBookings).toLocaleString() : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" /> Reviews Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <span className="text-yellow-400">Total Reviews</span>
              <span className="font-bold text-xl">{stats.totalReviews}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
              <span className="text-purple-400">Average Rating</span>
              <span className="font-bold text-xl flex items-center gap-1">
                {stats.averageRating} <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold mb-4">Recent Bookings</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {bookings.filter(b => myHotels.some(h => h._id === (b.hotel?._id || b.hotel))).slice(0, 5).map(booking => (
            <div key={booking._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="font-medium text-sm">{booking.hotel?.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> {booking.user?.name || 'Guest'}
                  {booking.user?.phone && <span className="flex items-center gap-1 ml-1"><Phone className="w-3 h-3" /> {booking.user.phone}</span>}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {booking.status}
                </span>
                <p className="text-xs text-cyan-400 mt-1">₱{booking.totalPrice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // HOTELS VIEW (Read-only for hotel admin)
  const HotelsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Hotels</h2>
        <p className="text-gray-400">{myHotels.length} hotels assigned to you</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search your hotels..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white" />
      </div>

      <div className="grid gap-4">
        {filteredHotels.map(hotel => (
          <div key={hotel._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all">
            <div className="flex flex-col md:flex-row gap-6">
              <img src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} alt={hotel.name}
                className="w-full md:w-48 h-32 object-cover rounded-xl" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold">{hotel.name}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {hotel.location.city}, {hotel.location.country}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openViewReviews(hotel)} className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors" title="View Reviews">
                      <Star className="w-5 h-5" />
                    </button>
                    <button onClick={() => openManageRooms(hotel)} className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors" title="Manage Rooms">
                      <BedDouble className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{hotel.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {hotel.amenities?.slice(0, 5).map((amenity, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300">{amenity}</span>
                  ))}
                  {hotel.amenities?.length > 5 && <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">+{hotel.amenities.length - 5} more</span>}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" /> {hotel.averageRating || hotel.starRating} ({hotel.reviewCount || 0} reviews)
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-cyan-400 font-medium">{hotel.starRating}-Star</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-400 font-medium">{hotel.roomCount || 0} rooms</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ROOMS VIEW
  const RoomsView = () => {
    if (!selectedHotelForRooms) {
      const roomsByHotel = rooms.reduce((acc, room) => {
        const hotelId = room.hotel?._id || room.hotel;
        const hotel = myHotels.find(h => h._id === hotelId);
        if (!hotel) return acc;
        if (!acc[hotelId]) acc[hotelId] = { name: hotel.name, rooms: [] };
        acc[hotelId].rooms.push(room);
        return acc;
      }, {});

      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Manage All Rooms</h2>
            <p className="text-gray-400">{Object.values(roomsByHotel).reduce((sum, h) => sum + h.rooms.length, 0)} total rooms</p>
          </div>

          {Object.entries(roomsByHotel).map(([hotelId, hotelData]) => (
            <div key={hotelId} className="space-y-4">
              <h3 className="text-xl font-semibold text-cyan-400 border-b border-white/10 pb-2">
                {hotelData.name} ({hotelData.rooms.length} rooms)
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {hotelData.rooms.map(room => (
                  <div key={room._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold capitalize">{room.type} Room #{room.roomNumber}</h3>
                        <p className="text-cyan-400 text-2xl font-bold">₱{room.pricePerNight}<span className="text-sm text-gray-400 font-normal">/night</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedHotelForRooms(myHotels.find(h => h._id === hotelId)); openEditRoom(room); }}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteRoom(room._id)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{room.description}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
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
                    <div className="flex flex-wrap gap-2">
                      {room.amenities?.map((amenity, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300">{amenity}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(roomsByHotel).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No rooms found in your hotels.</p>
              <button onClick={() => setActiveTab('hotels')}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-colors mx-auto">
                <ChevronLeft className="w-5 h-5" /> Go to Hotels to Add Rooms
              </button>
            </div>
          )}
        </div>
      );
    }

    const hotelRooms = rooms.filter(r => {
      const roomHotelId = r.hotel?._id || r.hotel;
      return roomHotelId === selectedHotelForRooms._id;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedHotelForRooms(null)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Rooms: {selectedHotelForRooms.name}</h2>
            <p className="text-gray-400 text-sm">{hotelRooms.length} rooms</p>
          </div>
        </div>

        <button onClick={() => { setEditingRoom(null); resetRoomForm(); setShowRoomModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all">
          <Plus className="w-5 h-5" /> Add Room
        </button>

        <div className="grid md:grid-cols-2 gap-4">
          {hotelRooms.map(room => (
            <div key={room._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold capitalize">{room.type} Room #{room.roomNumber}</h3>
                  <p className="text-cyan-400 text-2xl font-bold">₱{room.pricePerNight}<span className="text-sm text-gray-400 font-normal">/night</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditRoom(room)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteRoom(room._id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">{room.description}</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
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
              <div className="flex flex-wrap gap-2">
                {room.amenities?.map((amenity, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300">{amenity}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // BOOKINGS VIEW
  const BookingsView = () => {
    const myBookings = bookings.filter(b => myHotels.some(h => h._id === (b.hotel?._id || b.hotel)));
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">All Bookings</h2>
        
        <div className="grid gap-4">
          {myBookings.map(booking => {
            const nights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
            return (
              <div key={booking._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col md:flex-row gap-6">
                  <img src={booking.hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} alt={booking.hotel?.name}
                    className="w-full md:w-32 h-24 object-cover rounded-xl" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold">{booking.hotel?.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <User className="w-4 h-4" />
                          <span>{booking.user?.name || 'Guest'}</span>
                          <span className="text-gray-600">•</span>
                          <Mail className="w-3 h-3" />
                          <span>{booking.user?.email || 'No email'}</span>
                        </div>
                        {booking.user?.phone && (
                          <div className="flex items-center gap-1 text-sm text-cyan-400 mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{booking.user.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-cyan-400">₱{booking.totalPrice}</span>
                        <p className="text-xs text-gray-500">{nights} nights</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                      <div><p className="text-gray-500 text-xs">Room</p><p className="font-medium">#{booking.room?.roomNumber}</p></div>
                      <div><p className="text-gray-500 text-xs">Check-in</p><p className="font-medium">{new Date(booking.checkInDate).toLocaleDateString()}</p></div>
                      <div><p className="text-gray-500 text-xs">Check-out</p><p className="font-medium">{new Date(booking.checkOutDate).toLocaleDateString()}</p></div>
                      <div><p className="text-gray-500 text-xs">Guests</p><p className="font-medium">{booking.guests}</p></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {booking.status}
                      </span>
                      
                      <div className="flex gap-2">
                        {booking.status !== 'cancelled' && (
                          <button onClick={() => handleCancelBooking(booking._id)}
                            className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/20 transition-colors">
                            Cancel
                          </button>
                        )}
                        {booking.status === 'cancelled' && (
                          <button onClick={() => handleDeleteBooking(booking._id)}
                            className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {myBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No bookings found for your hotels.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // REVIEWS VIEW
  const ReviewsView = () => {
    const [reviewFilter, setReviewFilter] = useState('all');
    const [searchReview, setSearchReview] = useState('');

    const filteredReviews = allReviews.filter(review => {
      const matchesSearch = 
        review.hotelName?.toLowerCase().includes(searchReview.toLowerCase()) ||
        review.user?.name?.toLowerCase().includes(searchReview.toLowerCase()) ||
        review.comment?.toLowerCase().includes(searchReview.toLowerCase());
      if (reviewFilter === 'positive') return matchesSearch && review.rating >= 4;
      if (reviewFilter === 'negative') return matchesSearch && review.rating <= 2;
      return matchesSearch;
    });

    const reviewStats = {
      total: allReviews.length,
      fiveStar: allReviews.filter(r => r.rating === 5).length,
      fourStar: allReviews.filter(r => r.rating === 4).length,
      threeStar: allReviews.filter(r => r.rating === 3).length,
      twoStar: allReviews.filter(r => r.rating === 2).length,
      oneStar: allReviews.filter(r => r.rating === 1).length,
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">All Reviews & Experiences</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm">{stats.totalReviews} Total</span>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm">{stats.averageRating}★ Avg</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {[5, 4, 3, 2, 1].map(stars => (
            <div key={stars} className="bg-white/5 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{stars}</span>
              </div>
              <p className="text-2xl font-bold text-gray-400">
                {stars === 5 ? reviewStats.fiveStar : stars === 4 ? reviewStats.fourStar : stars === 3 ? reviewStats.threeStar : stars === 2 ? reviewStats.twoStar : reviewStats.oneStar}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search reviews..." value={searchReview} onChange={(e) => setSearchReview(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white" />
          </div>
          <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}
            className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none">
            <option value="all">All Reviews</option>
            <option value="positive">Positive (4-5★)</option>
            <option value="negative">Negative (1-2★)</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredReviews.map((review, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <img src={review.hotelImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} alt={review.hotelName}
                  className="w-full md:w-32 h-24 object-cover rounded-xl" />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-cyan-400">{review.hotelName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                          {review.user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm text-gray-300">{review.user?.name || 'Unknown User'}</span>
                        {review.user?.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {review.user.phone}</span>}
                        <span className="text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                      review.rating >= 4 ? 'bg-green-500/20 text-green-400' : review.rating === 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{review.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-3">{review.comment}</p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-cyan-400 transition-colors"><ThumbsUp className="w-4 h-4" /> Helpful</button>
                    <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors"><Flag className="w-4 h-4" /> Report</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredReviews.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No reviews found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <AlertModal isOpen={alertModal.isOpen} onClose={closeAlert} title={alertModal.title} message={alertModal.message} type={alertModal.type} />
      
      <RoomModal showRoomModal={showRoomModal} setShowRoomModal={setShowRoomModal} editingRoom={editingRoom}
        roomForm={roomForm} setRoomForm={setRoomForm} loading={loading} handleCreateRoom={handleCreateRoom}
        handleUpdateRoom={handleUpdateRoom} selectedHotel={selectedHotelForRooms} />
      
      <ReviewsModal showReviewsModal={showReviewsModal} setShowReviewsModal={setShowReviewsModal} selectedHotelForReviews={selectedHotelForReviews} />

      <Sidebar />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'hotels' && <HotelsView />}
          {activeTab === 'rooms' && <RoomsView />}
          {activeTab === 'bookings' && <BookingsView />}
          {activeTab === 'reviews' && <ReviewsView />}
        </div>
      </div>
    </div>
  );
};

export default HotelAdminDashboard;

