import React, { useState, useMemo, useCallback, useEffect, } from 'react';
import { 
  Diamond, Search, Calendar, Users, MapPin, Star, 
  LogOut, Home, BookOpen, Heart, User, Filter,
  ChevronRight, Check, ChevronDown, X, Bed, Loader2,
  Moon, Clock, CreditCard, Trash2, AlertCircle, 
  Heart as HeartIcon, Star as StarIcon, MessageSquare,
  Trash, Phone, Camera, Upload, Eye
} from 'lucide-react';
import { getHotels, deleteHotel, toggleFavorite, getMyFavorites, addReview } from './services/hotelService';
import { getHotelRooms } from './services/roomService';
import { createBooking, getMyBookings, cancelBooking, deleteBooking, getRoomBookedDates, getHotelBookedDates } from './services/bookingService';
import api from './services/api';
import authService from './services/authService';
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import BookingReceipts from './components/BookingReceipts';

// StripePayment
const stripePromise = loadStripe("pk_test_51TLcTACNevQjxpY3ADVTELinkSwuxkK1eORQKnYzO0KKUBOJvLvDyEgR1PTxx9aaEY3Zc9aJgFM3UZbZ82A8WVah00yJO5SG2x");


const StripePaymentForm = ({ amount, room, checkIn, checkOut, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handlePay = async () => {
    try {
      if (!stripe || !elements) return;

      // 1. Check availability first
      try {
        const checkResponse = await api.post('/bookings/check-availability', {
          room: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut
        });

        if (!checkResponse.data.available) {
          onError('This room was just booked by someone else. Please select different dates.');
          return;
        }
      } catch (checkErr) {
        console.log("Availability check failed:", checkErr);
      }

      // 2. Create PaymentIntent
      const { data } = await api.post("/payments/create-intent", { amount });
      const clientSecret = data.clientSecret;

      // 3. Confirm Payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        onError(result.error.message);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        onSuccess(result.paymentIntent);
      }

    } catch (err) {
      console.error(err);
      onError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
      <p className="text-sm text-gray-400 mb-2">Card Payment</p>
      <div className="p-3 bg-white/10 rounded-lg">
        <CardElement options={{
          style: {
            base: {
              color: '#fff',
              fontSize: '16px',
              '::placeholder': { color: '#9ca3af' }
            },
            invalid: {
              color: '#ef4444',
              iconColor: '#ef4444'
            }
          }
        }} />
      </div>
      <button
        onClick={handlePay}
        disabled={!stripe}
        className="w-full mt-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium disabled:opacity-50"
      >
        Pay ₱{amount}
      </button>
    </div>
  );
};

// STAR RATING COMPONENT
const StarRating = ({ rating, maxStars = 5, size = "sm", interactive = false, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <StarIcon 
            className={`${sizeClasses[size]} ${
              star <= (hoverRating || rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-600 fill-gray-600'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

// CUSTOM DATE PICKER
const CustomDatePicker = ({
  label,
  value,
  onChange,
  min,
  icon: Icon,
  bookedDates = [],
  currentMonth
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [displayMonth, setDisplayMonth] = useState(() => {
    const minDate = min ? new Date(min + "T00:00:00") : new Date();
    return new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  });

  useEffect(() => {
    if (currentMonth) {
      setDisplayMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      );
    }
  }, [currentMonth]);

  // ========================
  // GET DAYS IN MONTH
  // ========================
  const getDaysInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return days;
  };

  // ========================
  // FORMAT DISPLAY
  // ========================
  const formatDate = (dateStr) => {
    if (!dateStr) return '';

    const [y, m, d] = dateStr.split('-');
    const date = new Date(y, m - 1, d);

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // ========================
  // MIN DATE CHECK (SAFE)
  // ========================
  const isDateDisabled = (day) => {
    if (!day) return true;

    const [minY, minM, minD] = (min || '1900-01-01').split('-');
    const minDate = new Date(minY, minM - 1, minD);

    const date = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      day
    );

    minDate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return date < minDate;
  };

  // ========================
  // BOOKED DATE CHECK (FIXED - NO ISO)
  // ========================
  const isOccupied = (day) => {
    if (!day) return false;

    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');

    const dateStr = `${year}-${month}-${d}`;

    return bookedDates.includes(dateStr);
  };

  // ========================
  // SELECTED CHECK (FIXED)
  // ========================
  const isSelected = (day) => {
    if (!day || !value) return false;

    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');

    const dateStr = `${year}-${month}-${d}`;

    return value === dateStr;
  };

  // ========================
  // SELECT DATE (NO TIMEZONE BUG)
  // ========================
  const selectDate = (day) => {
    if (!day || isDateDisabled(day) || isOccupied(day)) return;

    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');

    const dateString = `${year}-${month}-${d}`;

    onChange(dateString);
    setIsOpen(false);
  };

  const days = getDaysInMonth(
    displayMonth.getFullYear(),
    displayMonth.getMonth()
  );

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return (
    <div className="relative">
      <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 pl-4 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white hover:bg-slate-800/50 transition-colors"
      >
        <Icon className="w-5 h-5 text-cyan-400" />
        {value ? formatDate(value) : "Select date"}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-slate-900 w-[380px] rounded-2xl border border-white/10 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() =>
                  setDisplayMonth(
                    new Date(
                      displayMonth.getFullYear(),
                      displayMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                className="p-2 rounded-lg hover:bg-white/10 text-white"
              >
                ‹
              </button>

              <h2 className="text-white font-semibold">
                {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
              </h2>

              <button
                onClick={() =>
                  setDisplayMonth(
                    new Date(
                      displayMonth.getFullYear(),
                      displayMonth.getMonth() + 1,
                      1
                    )
                  )
                }
                className="p-2 rounded-lg hover:bg-white/10 text-white"
              >
                ›
              </button>
            </div>

            {/* LEGEND */}
            <div className="flex items-center gap-4 mb-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-400">Available</span>
              </div>

              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-400">Occupied</span>
              </div>

              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-gray-400">Selected</span>
              </div>
            </div>

            {/* DAYS */}
            <div className="grid grid-cols-7 text-center text-gray-400 text-xs mb-2">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) =>
                day ? (
                  <button
                    key={idx}
                    disabled={isDateDisabled(day) || isOccupied(day)}
                    onClick={() => selectDate(day)}
                    className={`h-10 rounded-lg text-sm transition-all relative
                      ${
                        isSelected(day)
                          ? 'bg-cyan-500 text-white'
                          : isOccupied(day)
                          ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                          : isDateDisabled(day)
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                  >
                    {day}
                  </button>
                ) : (
                  <div key={idx} />
                )
              )}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ALERT MODAL
const AlertModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
  if (!isOpen) return null;
  
  const bgColor = type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30';
  const iconColor = type === 'error' ? 'text-red-400' : 'text-green-400';
  const buttonColor = type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600';
  
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className={`bg-slate-900 rounded-2xl p-6 max-w-md w-full border ${bgColor} shadow-2xl`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor}`}>
            <AlertCircle className={`w-6 h-6 ${iconColor}`} />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>
        <button 
          onClick={onClose}
          className={`w-full py-3 ${buttonColor} text-white rounded-xl font-medium transition-colors`}
        >
          OK, I Understand
        </button>
      </div>
    </div>
  );
};

// REVIEW MODAL WITH STAR RATING
const ReviewModal = ({ isOpen, onClose, hotel, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !hotel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(hotel.id, { rating, comment });
    setSubmitting(false);
    setRating(5);
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Review {hotel.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Rating</label>
            <div className="flex items-center gap-3">
              <StarRating rating={rating} size="lg" interactive onRate={setRating} />
              <span className="text-cyan-400 font-bold text-lg">{rating}/5</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none min-h-[100px]"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting || !comment.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// REVIEWS DISPLAY MODAL - Shows all public reviews for a hotel
const ReviewsDisplayModal = ({ isOpen, onClose, hotel }) => {
  if (!isOpen || !hotel) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold">Reviews for {hotel.name}</h3>
            <p className="text-gray-400 text-sm">{hotel.reviews?.length || 0} reviews</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {hotel.reviews && hotel.reviews.length > 0 ? (
            hotel.reviews.map((review, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                      {review.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.user?.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="font-bold">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">"{review.comment}"</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalCheckIn, setModalCheckIn] = useState('');
  const [modalCheckOut, setModalCheckOut] = useState('');
  const [bookingStep, setBookingStep] = useState('rooms');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [hoveredHotel, setHoveredHotel] = useState(null);
  
  const [bookedDates, setBookedDates] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  
  const [reviewModal, setReviewModal] = useState({ isOpen: false, hotel: null });
  const [reviewsModal, setReviewsModal] = useState({ isOpen: false, hotel: null });
  
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  const isAdmin = user?.role === 'admin';

  const numberOfNights = useMemo(() => {
    if (!modalCheckIn || !modalCheckOut) return 0;
    const start = new Date(modalCheckIn);
    const end = new Date(modalCheckOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [modalCheckIn, modalCheckOut]);

  useEffect(() => {
    fetchHotels();
    if (activeTab === 'bookings') {
      fetchMyBookings();
    }
    if (activeTab === 'favorites') {
      fetchFavorites();
    }
    if (activeTab === 'profile') {
      fetchUserProfile();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedRoom && bookingStep === 'dates') {
      fetchBookedDates();
    }
  }, [selectedRoom, bookingStep, calendarMonth]);

  const fetchBookedDates = async () => {
    try {
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const response = await getRoomBookedDates(selectedRoom._id, year, month);
      if (response.success) {
        setBookedDates(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch booked dates', err);
    }
  };

  // Fetch user profile to get latest data including phone
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const userData = response.data.data;
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          avatar: userData.avatar || ''
        });
        // Update localStorage user data too
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          localStorage.setItem('user', JSON.stringify({ ...currentUser, ...userData }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  // Calculate hotel max capacity from rooms
  const calculateHotelMaxCapacity = (hotelRooms) => {
    if (!hotelRooms || hotelRooms.length === 0) return 0;
    return Math.max(...hotelRooms.map(room => room.capacity || 0));
  };

 const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await getHotels();
      if (response.success) {
        const hotelsWithRooms = await Promise.all(
          response.data.map(async (hotel) => {
            try {
              const roomsRes = await getHotelRooms(hotel._id);
              const hotelRooms = roomsRes.success ? roomsRes.data : [];
              const bookedRes = await getHotelBookedDates(hotel._id);
              const maxCapacity = calculateHotelMaxCapacity(hotelRooms);
              
              // ✅ FIX: Flatten booking ranges into individual date strings
              let bookedDatesList = [];
              if (bookedRes.success && Array.isArray(bookedRes.data)) {
                bookedRes.data.forEach(booking => {
                  // Handle both object format {checkIn, checkOut} and string format
                  const checkIn = booking.checkIn || booking;
                  const checkOut = booking.checkOut || booking;
                  
                  if (checkIn && checkOut) {
                    const start = new Date(checkIn);
                    const end = new Date(checkOut);
                    
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                      // Generate all dates in the range
                      const current = new Date(start);
                      while (current <= end) {
                        const year = current.getFullYear();
                        const month = String(current.getMonth() + 1).padStart(2, '0');
                        const day = String(current.getDate()).padStart(2, '0');
                        bookedDatesList.push(`${year}-${month}-${day}`);
                        
                        current.setDate(current.getDate() + 1);
                      }
                    }
                  }
                });
              }
              
              return {
                id: hotel._id,
                name: hotel.name,
                location: `${hotel.location.city}, ${hotel.location.country}`,
                price: hotel.starRating * 500,
                rating: hotel.averageRating || hotel.starRating,
                reviewCount: hotel.reviewCount || 0,
                image: hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
                amenities: hotel.amenities,
                description: hotel.description,
                maxGuests: maxCapacity || hotel.maxGuests || 4,
                roomTypes: [...new Set(hotelRooms.map(r => r.type))] || ['Standard', 'Deluxe', 'Suite'],
                reviews: hotel.reviews || [],
                rooms: hotelRooms,
                bookedDates: bookedDatesList // ✅ Now contains ["2024-10-22", "2024-10-23", ...]
              };
            } catch (err) {
              return {
                id: hotel._id,
                name: hotel.name,
                location: `${hotel.location.city}, ${hotel.location.country}`,
                price: hotel.starRating * 500,
                rating: hotel.averageRating || hotel.starRating,
                reviewCount: hotel.reviewCount || 0,
                image: hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
                amenities: hotel.amenities,
                description: hotel.description,
                maxGuests: hotel.maxGuests || 4,
                roomTypes: ['Standard', 'Deluxe', 'Suite'],
                reviews: hotel.reviews || [],
                rooms: [],
                bookedDates: []
              };
            }
          })
        );
        setHotels(hotelsWithRooms);
      }
    } catch (err) {
      setError('Failed to load hotels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await getMyFavorites();
      if (response.success) {
        setFavorites(response.data);
        setFavoriteIds(new Set(response.data.map(h => h._id)));
      }
    } catch (err) {
      console.error('Failed to load favorites', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const response = await getMyBookings();
      if (response.success) {
        setMyBookings(response.data);
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelRooms = async (hotelId) => {
    try {
      setLoading(true);
      const response = await getHotelRooms(hotelId);
      if (response.success) {
        setRooms(response.data);
      }
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (hotelId, e) => {
    e.stopPropagation();
    try {
      const response = await toggleFavorite(hotelId);
      if (response.success) {
        if (response.isFavorite) {
          setFavoriteIds(prev => new Set([...prev, hotelId]));
        } else {
          setFavoriteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(hotelId);
            return newSet;
          });
        }
        if (activeTab === 'favorites') {
          fetchFavorites();
        }
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleDeleteHotel = async (hotelId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      await deleteHotel(hotelId);
      await fetchHotels();
      setAlertModal({
        isOpen: true,
        title: 'Deleted',
        message: 'Hotel has been deleted successfully',
        type: 'success'
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to delete hotel',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (hotelId, reviewData) => {
    try {
      await addReview(hotelId, reviewData);
      await fetchHotels(); // Refresh to show new review
      setAlertModal({
        isOpen: true,
        title: 'Review Submitted',
        message: 'Thank you for your review!',
        type: 'success'
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err.response?.data?.error || 'Failed to submit review',
        type: 'error'
      });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      setLoading(true);
      const response = await cancelBooking(bookingId);
      if (response.success) {
        await fetchMyBookings();
      }
    } catch (err) {
      alert('Failed to cancel booking: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to permanently delete this cancelled booking? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      const response = await deleteBooking(bookingId);
      if (response.success) {
        await fetchMyBookings();
        setAlertModal({
          isOpen: true,
          title: 'Deleted',
          message: 'Booking has been permanently deleted',
          type: 'success'
        });
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err.response?.data?.error || 'Failed to delete booking',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Profile update handlers
  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await api.put('/auth/me', {
        name: profileData.name,
        phone: profileData.phone
      });
      
      if (response.data.success) {
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Profile updated successfully',
          type: 'success'
        });
        setIsEditingProfile(false);
        fetchUserProfile(); // Refresh data
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err.response?.data?.error || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploadingPhoto(true);
      const response = await api.put('/auth/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, avatar: response.data.data.avatar }));
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Profile photo updated',
          type: 'success'
        });
        fetchUserProfile();
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to upload photo',
        type: 'error'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // FIXED: Filter hotels by actual room capacity, not hardcoded maxGuests
  const filteredHotels = useMemo(() => {
    let filtered = hotels;
    
    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(hotel => 
        hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Guest capacity filter - only show hotels that have at least one room fitting selected guests
    filtered = filtered.filter(hotel => {
      // If we have room data, check if any room can accommodate
      if (hotel.rooms && hotel.rooms.length > 0) {
        return hotel.rooms.some(room => room.capacity >= selectedGuests);
      }
      // Fallback to maxGuests if rooms not loaded
      return hotel.maxGuests >= selectedGuests;
    });
    
    return filtered;
  }, [searchQuery, selectedGuests, hotels]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleGuestSelect = useCallback((num) => {
    setSelectedGuests(num);
    setShowGuestDropdown(false);
  }, []);

  const toggleGuestDropdown = useCallback(() => {
    setShowGuestDropdown(prev => !prev);
  }, []);

  const handleBookNow = useCallback(async (hotel) => {
    setSelectedHotel(hotel);
    setBookingStep('rooms');
    setSelectedRoom(null);
    setModalCheckIn('');
    setModalCheckOut('');
    setBookedDates([]);
    await fetchHotelRooms(hotel.id);
  }, []);

  const handleSelectRoom = (room) => {
    if (room.capacity < selectedGuests) return;
    setSelectedRoom(room);
    setBookingStep('dates');
    setModalCheckIn('');
    setModalCheckOut('');
    setCalendarMonth(new Date());
  };

  const handleBackToRooms = () => {
    setBookingStep('rooms');
    setSelectedRoom(null);
    setModalCheckIn('');
    setModalCheckOut('');
    setBookedDates([]);
  };

  const handleCheckAvailability = async () => {
    if (!modalCheckIn || !modalCheckOut) {
      setAlertModal({
        isOpen: true,
        title: 'Dates Required',
        message: 'Please select both check-in and check-out dates',
        type: 'error'
      });
      return;
    }

    if (numberOfNights <= 0) {
      setAlertModal({
        isOpen: true,
        title: 'Invalid Dates',
        message: 'Check-out date must be after check-in date',
        type: 'error'
      });
      return;
    }

    const hasConflict = bookedDates.includes(modalCheckIn) || bookedDates.includes(modalCheckOut);
    
    if (hasConflict) {
      setAlertModal({
        isOpen: true,
        title: 'Dates Not Available',
        message: 'Your selected check-in or check-out date is already occupied. Please choose different dates.',
        type: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      await handleConfirmBooking();
    } catch (err) {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      const bookingData = {
        hotel: selectedHotel.id,
        room: selectedRoom._id,
        checkIn: modalCheckIn,
        checkOut: modalCheckOut,
        guests: selectedGuests,
        totalPrice: selectedRoom.pricePerNight * numberOfNights
      };
      
      const response = await createBooking(bookingData);
      if (response.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingSuccess(false);
          setSelectedHotel(null);
          setSelectedRoom(null);
          setModalCheckIn('');
          setModalCheckOut('');
          setBookingStep('rooms');
          setBookedDates([]);
          setActiveTab('bookings');
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 409) {
        const errorMsg = err.response?.data?.error || 'This room is already booked for these dates.';
        setAlertModal({
          isOpen: true,
          title: 'Room Already Occupied',
          message: errorMsg,
          type: 'error'
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Booking Failed',
          message: err.response?.data?.error || err.message,
          type: 'error'
        });
      }
    }
  };

  const closeAlertModal = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDateLong = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
// ✅ FIXED "today"
const now = new Date();
const today = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate()
).toISOString().split('T')[0];

  const Sidebar = () => (
    <div className="w-64 bg-slate-900/50 border-r border-white/10 p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => setActiveTab('browse')}>
        <Diamond className="w-8 h-8 text-cyan-400" />
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">AI STAY</span>
      </div>
      <nav className="space-y-2 flex-1">
        <SidebarItem icon={Home} label="Browse Hotels" active={activeTab === 'browse'} onClick={() => setActiveTab('browse')} />
        <SidebarItem icon={BookOpen} label="My Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
        <SidebarItem icon={Heart} label="Favorites" active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
        <SidebarItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>
      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold overflow-hidden">
            {profileData.avatar ? (
              <img src={profileData.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
            {profileData.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" /> {profileData.phone}
              </p>
            )}
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      active ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

 const MyBookings = () => {
  // ✅ Sort bookings: newest first (most recent createdAt)
  const sortedBookings = [...myBookings].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Bookings</h2>
        <span className="text-gray-400 text-sm">{sortedBookings.length} booking{sortedBookings.length !== 1 ? 's' : ''}</span>
      </div>
      
      {sortedBookings.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No bookings yet. Start exploring hotels!</p>
          <button onClick={() => setActiveTab('browse')} className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium hover:shadow-lg transition-all duration-300">
            Browse Hotels
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedBookings.map((booking) => {
            const nights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
            const pricePerNight = Math.round(booking.totalPrice / nights);
            
            return (
              <div key={booking._id} className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/30 transition-all">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-48 md:h-auto relative">
                    <img 
                      src={booking.hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} 
                      alt={booking.hotel?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <span className={`text-xs font-medium ${
                        booking.status === 'confirmed' ? 'text-green-400' : 
                        booking.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl mb-1">{booking.hotel?.name || 'Hotel'}</h3>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.hotel?.location?.city || 'Location'}, {booking.hotel?.location?.country || ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-cyan-400">₱{booking.totalPrice}</span>
                        <p className="text-gray-500 text-xs">total</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Bed className="w-3 h-3" /> Room
                        </p>
                        <p className="font-medium text-sm capitalize">{booking.room?.type || 'Standard'}</p>
                        <p className="text-xs text-gray-400">#{booking.room?.roomNumber || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Check-in
                        </p>
                        <p className="font-medium text-sm">{formatDate(booking.checkInDate)}</p>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Check-out
                        </p>
                        <p className="font-medium text-sm">{formatDate(booking.checkOutDate)}</p>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Moon className="w-3 h-3" /> Nights
                        </p>
                        <p className="font-medium text-sm">{nights} night{nights !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-400">₱{pricePerNight}/night</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Users className="w-4 h-4" /> {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400">
                        Booked on {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-end gap-3">
                      {booking.status === 'cancelled' && (
                        <button 
                          onClick={() => handleDeleteBooking(booking._id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Booking
                        </button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
  const Favorites = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Favorites</h2>
        <span className="text-gray-400 text-sm">{favorites.length} favorite{favorites.length !== 1 ? 's' : ''}</span>
      </div>
      
      {favorites.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No favorites yet. Start browsing and heart your favorite hotels!</p>
          <button onClick={() => setActiveTab('browse')} className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium hover:shadow-lg transition-all duration-300">
            Browse Hotels
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(hotel => {
            // Calculate max capacity for favorites too
            const maxCap = hotel.maxGuests || 4;
            
            return (
              <HotelCard 
                key={hotel._id} 
                hotel={{
                  id: hotel._id,
                  name: hotel.name,
                  location: `${hotel.location.city}, ${hotel.location.country}`,
                  price: hotel.starRating * 500,
                  rating: hotel.averageRating || hotel.starRating,
                  reviewCount: hotel.reviewCount || 0,
                  image: hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
                  amenities: hotel.amenities,
                  description: hotel.description,
                  maxGuests: maxCap,
                  roomTypes: ['Standard', 'Deluxe', 'Suite'],
                  reviews: hotel.reviews || [],
                  bookedDates: hotel.bookedDates || []
                 
                }} 
                onBookNow={handleBookNow}
                isHovered={hoveredHotel === hotel._id}
                onHover={() => setHoveredHotel(hotel._id)}
                onLeave={() => setHoveredHotel(null)}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  
  const BookingModal = () => {
  if (!selectedHotel) return null;

  const calculatedTotal =
    selectedRoom && numberOfNights > 0
      ? selectedRoom.pricePerNight * numberOfNights
      : 0;

  const canSelectRoom = (room) => room.capacity >= selectedGuests;

  const isReadyToPay =
    selectedRoom &&
    modalCheckIn &&
    modalCheckOut &&
    numberOfNights > 0 &&
    calculatedTotal > 0;

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      console.log("Payment success:", paymentIntent.id);

      const bookingPayload = {
        hotel: selectedHotel.id,
        room: selectedRoom._id,
        checkInDate: modalCheckIn,
        checkOutDate: modalCheckOut,
        guests: selectedGuests,
        totalPrice: calculatedTotal,
        paymentIntentId: paymentIntent.id,
      };

      const response = await api.post('/bookings', bookingPayload);

      if (response.data.success) {
        // Build receipt data
        setReceiptData({
          ...response.data.data,
          hotel: {
            name: selectedHotel.name,
            location: selectedHotel.location,
            image: selectedHotel.image,
            rating: selectedHotel.rating,
          },
          room: {
            type: selectedRoom.type,
            roomNumber: selectedRoom.roomNumber,
          },
          checkInDate: modalCheckIn,
          checkOutDate: modalCheckOut,
          guests: selectedGuests,
          totalPrice: calculatedTotal,
          paymentIntentId: paymentIntent.id,
        });
        
        setShowReceipt(true);
      }
    } catch (err) {
      console.error("Booking creation error:", err.response?.data || err.message);
      setAlertModal({
        isOpen: true,
        title: 'Critical Error',
        message: 'Payment was successful but we could not create your booking. Please contact support immediately with your payment reference: ' + paymentIntent.id,
        type: 'error'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">

        {bookingSuccess ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
            <p className="text-gray-400">Your payment and reservation are complete.</p>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">
                  {bookingStep === "rooms" ? "Select Room" : "Select Dates & Pay"}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{selectedHotel.name}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedHotel(null);
                  setSelectedRoom(null);
                  setBookingStep("rooms");
                  setBookedDates([]);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* HOTEL INFO */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl mb-6">
              <img
                src={selectedHotel.image}
                alt={selectedHotel.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-bold text-lg">{selectedHotel.name}</h4>
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {selectedHotel.location}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={Math.round(selectedHotel.rating)} size="sm" />
                  <span className="font-bold">{selectedHotel.rating}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400 text-sm">{selectedGuests} guests</span>
                </div>
              </div>
            </div>

            {/* ROOMS */}
            {bookingStep === "rooms" ? (
              <div className="mb-6">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-cyan-400" />
                  Available Rooms
                </h4>

                <div className="space-y-3">
                  {rooms.map((room) => {
                    const isSelectable = canSelectRoom(room);

                    return (
                      <div
                        key={room._id}
                        onClick={() => isSelectable && handleSelectRoom(room)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelectable
                            ? "border-white/10 hover:border-cyan-500/50 hover:bg-white/5"
                            : "border-red-500/30 bg-red-500/5 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h5 className="font-bold capitalize">{room.type}</h5>
                            <p className="text-sm text-gray-400">{room.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Capacity: {room.capacity} persons</p>
                          </div>
                          <span className="text-cyan-400 font-bold">
                            ₱{room.pricePerNight}<span className="text-gray-500 text-xs font-normal">/night</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* DATES */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <CustomDatePicker
                    label="Check In"
                    value={modalCheckIn}
                    onChange={(date) => {
                      setModalCheckIn(date);
                      if (modalCheckOut && modalCheckOut <= date) {
                        setModalCheckOut("");
                      }
                    }}
                    min={today}
                    icon={Calendar}
                    bookedDates={bookedDates}
                    currentMonth={calendarMonth}
                  />

                  <CustomDatePicker
                    label="Check Out"
                    value={modalCheckOut}
                    onChange={setModalCheckOut}
                    min={modalCheckIn || today}
                    icon={Calendar}
                    bookedDates={bookedDates}
                    currentMonth={calendarMonth}
                  />
                </div>

                {/* DATE VALIDATION ERRORS */}
                {modalCheckIn && modalCheckOut && numberOfNights <= 0 && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm">Check-out must be after check-in</p>
                  </div>
                )}

                {/* TOTAL */}
                {numberOfNights > 0 && (
                  <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">{selectedRoom.type} Room</span>
                      <span className="text-white">₱{selectedRoom.pricePerNight} × {numberOfNights} nights</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Total Price</span>
                      <span className="text-2xl font-bold text-cyan-400">
                        ₱{calculatedTotal}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBackToRooms}
                  className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  ← Back to rooms
                </button>
                
                {/* STRIPE PAYMENT */}
                {isReadyToPay && (
                  <div className="mb-6">
                    <Elements stripe={stripePromise}>
  <StripePaymentForm
    amount={calculatedTotal}
    room={selectedRoom}
    checkIn={modalCheckIn}
    checkOut={modalCheckOut}
    onSuccess={handlePaymentSuccess}
    onError={(message) => {
      setAlertModal({
        isOpen: true,
        title: 'Payment Error',
        message: message,
        type: 'error'
      });
    }}
  />
</Elements>
                  </div>
                )}

                {!isReadyToPay && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                    <p className="text-gray-400 text-sm">Select check-in and check-out dates to proceed with payment</p>
                  </div>
                )}
              </>
            )}

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedHotel(null);
                  setSelectedRoom(null);
                  setBookingStep("rooms");
                  setBookedDates([]);
                }}
                className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* RECEIPT MODAL - OUTSIDE the inner div so it overlays everything */}
      {showReceipt && receiptData && (
        <BookingReceipts
          booking={receiptData}
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
            setSelectedHotel(null);
            setSelectedRoom(null);
            setBookingStep('rooms');
            setModalCheckIn('');
            setModalCheckOut('');
            setBookedDates([]);
            setActiveTab('bookings');
          }}
        />
      )}
    </div>
  );
};

  const HotelCard = ({ hotel, onBookNow, isHovered, onHover, onLeave }) => {
    const isFav = favoriteIds.has(hotel.id);
    
    return (
      <div 
        className="group bg-slate-900/50 rounded-2xl overflow-visible border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-500/10 relative"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        <div className="relative h-48 overflow-hidden z-0">
          <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          
          <button
            onClick={(e) => handleToggleFavorite(hotel.id, e)}
            className="absolute top-4 left-4 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors z-10"
          >
            <HeartIcon className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>

          {isAdmin && (
            <button
              onClick={(e) => handleDeleteHotel(hotel.id, e)}
              className="absolute top-4 right-16 p-2 rounded-full bg-red-500/50 backdrop-blur-sm hover:bg-red-500/70 transition-colors z-10"
              title="Delete Hotel"
            >
              <Trash className="w-5 h-5 text-white" />
            </button>
          )}

          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
            <StarRating rating={Math.round(hotel.rating)} size="sm" />
            <span className="font-bold text-sm">{hotel.rating}</span>
            {hotel.reviewCount > 0 && (
              <span className="text-xs text-gray-400">({hotel.reviewCount})</span>
            )}
          </div>
          
          {isHovered && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
              <div className="text-center p-4">
                <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-lg font-bold mb-1">{hotel.maxGuests} Persons</p>
                <p className="text-sm text-gray-300">Maximum capacity per room</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {hotel.roomTypes.slice(0, 2).map((type, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/20 rounded text-xs">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">{hotel.name}</h3>
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <MapPin className="w-4 h-4" /> {hotel.location}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
              <Users className="w-3 h-3" />
              <span>Max {hotel.maxGuests}</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{hotel.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {hotel.amenities.map((amenity, idx) => (
              <span key={idx} className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-300 border border-white/10">
                {amenity}
              </span>
            ))}
          </div>

         {hotel.bookedDates && hotel.bookedDates.length > 0 && (
  <div className="mb-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
    <div className="flex items-center gap-1 mb-1">
      <Calendar className="w-3 h-3 text-red-400" />
      <span className="text-xs text-red-300">Booked Dates:</span>
    </div>

    <div className="flex flex-wrap gap-1">
      {hotel.bookedDates.slice(0, 5).map((dateStr, idx) => {
        // dateStr is now "YYYY-MM-DD" format
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = dateObj.toLocaleString('en-GB', { month: 'short' });
        
        return (
          <span key={idx} className="text-[10px] px-2 py-1 bg-red-500/20 text-red-300 rounded">
            {day} {month}
          </span>
        );
      })}
    </div>

    {hotel.bookedDates.length > 5 && (
      <p className="text-[10px] text-gray-400 mt-1">
        +{hotel.bookedDates.length - 5} more
      </p>
    )}
  </div>
)}
          
          {/* Show recent reviews preview */}
          {hotel.reviews && hotel.reviews.length > 0 && (
            <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-1 mb-1">
                <MessageSquare className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-gray-400">Latest review:</span>
              </div>
              <p className="text-xs text-gray-300 italic line-clamp-1">"{hotel.reviews[hotel.reviews.length - 1].comment}"</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  — {hotel.reviews[hotel.reviews.length - 1].user?.name || 'Guest'}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setReviewsModal({ isOpen: true, hotel });
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  View all {hotel.reviews.length} reviews
                </button>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <div>
              <span className="text-2xl font-bold text-cyan-400">₱{hotel.price}</span>
              <span className="text-gray-500 text-sm">/night</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setReviewModal({ isOpen: true, hotel });
                }}
                className="px-3 py-2 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                Review
              </button>
              
              <button 
                onClick={() => onBookNow(hotel)}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-cyan-500/25 text-white"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BrowseHotels = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 overflow-visible">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search hotels or destinations..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <div className="relative z-[100]">
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 ml-1">Guests</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
              <button
                type="button"
                onClick={toggleGuestDropdown}
                className="w-full pl-12 pr-10 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <span>{selectedGuests} Guests</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showGuestDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showGuestDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto z-[9999]">
                  {guestOptions.map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleGuestSelect(num)}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between ${
                        selectedGuests === num ? 'bg-cyan-500/20 text-cyan-400' : 'text-white'
                      }`}
                    >
                      <span>{num} Guests</span>
                      {selectedGuests === num && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-gray-400">
          Showing <span className="text-white font-bold">{filteredHotels.length}</span> properties
          <span className="text-cyan-400 text-sm ml-2">(for {selectedGuests} guests)</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map(hotel => (
            <HotelCard 
              key={hotel.id} 
              hotel={hotel} 
              onBookNow={handleBookNow}
              isHovered={hoveredHotel === hotel.id}
              onHover={() => setHoveredHotel(hotel.id)}
              onLeave={() => setHoveredHotel(null)}
            />
          ))}
        </div>
      )}
      
      {filteredHotels.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No hotels found for {selectedGuests} guests</p>
          <p className="text-gray-500 text-sm">Try selecting fewer guests or check back later</p>
        </div>
      )}
    </div>
  );

  // PROFILE COMPONENT
  // PROFILE COMPONENT
const Profile = () => {
  // Separate local form state from main profile state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: ''
  });
  
  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditingProfile) {
      setEditForm({
        name: profileData.name || '',
        phone: profileData.phone || ''
      });
    }
  }, [isEditingProfile]);

  // Handle input changes without losing focus
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save changes only when button is clicked
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const response = await api.put('/auth/me', {
        name: editForm.name,
        phone: editForm.phone
      });
      
      if (response.data.success) {
        // Update main state only after successful save
        setProfileData(prev => ({
          ...prev,
          name: editForm.name,
          phone: editForm.phone
        }));
        
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Profile updated successfully',
          type: 'success'
        });
        setIsEditingProfile(false);
        
        // Refresh user data in background
        fetchUserProfile();
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err.response?.data?.error || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Profile</h2>
      <p className="text-gray-400 text-sm">Manage your account</p>
      
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 max-w-2xl border border-white/10">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-3xl font-bold overflow-hidden">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profileData.name?.charAt(0) || 'U'
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer border border-white/20 hover:bg-slate-700 transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </label>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold">{profileData.name || 'User'}</h3>
            <p className="text-gray-400 text-sm">{profileData.email}</p>
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> {profileData.phone || 'No phone added'}
            </p>
          </div>
          
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
          >
            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {isEditingProfile ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full p-3 bg-slate-800/50 border border-white/10 rounded-xl text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="09123456789"
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</p>
                <p className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
                <p className="font-medium capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Account Stats</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-cyan-400">{myBookings.length}</p>
                  <p className="text-xs text-gray-400">Bookings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">{favorites.length}</p>
                  <p className="text-xs text-gray-400">Favorites</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {hotels.reduce((acc, hotel) => {
                      const userReviews = hotel.reviews?.filter(r => r.user?._id === user?._id).length || 0;
                      return acc + userReviews;
                    }, 0)}
                  </p>
                  <p className="text-xs text-gray-400">Reviews</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

  // MAIN RENDER
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-900/50 border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {activeTab === 'browse' && 'Discover Hotels'}
              {activeTab === 'bookings' && 'My Bookings'}
              {activeTab === 'favorites' && 'My Favorites'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'browse' && 'Find your perfect stay'}
              {activeTab === 'bookings' && 'Manage your reservations'}
              {activeTab === 'favorites' && 'Your saved hotels'}
              {activeTab === 'profile' && 'Manage your account'}
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">Admin</span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'browse' && <BrowseHotels />}
          {activeTab === 'bookings' && <MyBookings />}
          {activeTab === 'favorites' && <Favorites />}
          {activeTab === 'profile' && <Profile />}
        </main>
      </div>

      {selectedHotel && <BookingModal />}
      
      <ReviewModal 
        isOpen={reviewModal.isOpen} 
        onClose={() => setReviewModal({ isOpen: false, hotel: null })}
        hotel={reviewModal.hotel}
        onSubmit={handleSubmitReview}
      />
      
      <ReviewsDisplayModal
        isOpen={reviewsModal.isOpen}
        onClose={() => setReviewsModal({ isOpen: false, hotel: null })}
        hotel={reviewsModal.hotel}
      />
      
      <AlertModal 
        isOpen={alertModal.isOpen}
        onClose={closeAlertModal}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default Dashboard;

