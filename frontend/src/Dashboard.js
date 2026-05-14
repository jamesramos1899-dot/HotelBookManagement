import React, { useState, useMemo, useCallback, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Diamond,
  Search,
  Calendar,
  Users,
  MapPin,
  Star,
  LogOut,
  Home,
  BookOpen,
  Heart,
  User,
  Filter,
  ChevronRight,
  Check,
  ChevronDown,
  X,
  Bed,
  Loader2,
  Moon,
  Clock,
  CreditCard,
  Trash2,
  AlertCircle,
  Heart as HeartIcon,
  Star as StarIcon,
  MessageSquare,
  Trash,
  Phone,
  Camera,
  Upload,
  Eye,
} from "lucide-react";
import {
  getHotels,
  deleteHotel,
  toggleFavorite,
  getMyFavorites,
  addReview,
} from "./services/hotelService";
import { getHotelRooms } from "./services/roomService";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  deleteBooking,
  getRoomBookedDates,
  getHotelBookedDates,
} from "./services/bookingService";
import api from "./services/api";
import authService from "./services/authService";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import BookingReceipts from "./components/BookingReceipts";
import {
  getMyConversations,
  getConversation,
  sendMessage,
} from "./services/chatService";

// StripePayment
const stripePromise = loadStripe(
  "pk_test_51SWY09FDjQoE7GfAD7rORu9gP4QcTmCWWBTO5d3tFEwdA3xCs0Jf97tl8kOBTStxSVvXB3a1TSe53GD7x14Re8O1005shklq01",
);

const StripePaymentForm = ({
  amount,
  room,
  checkIn,
  checkOut,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handlePay = async () => {
    try {
      if (!stripe || !elements) return;

      // 1. Check availability first
      try {
        const checkResponse = await api.post("/bookings/check-availability", {
          room: room._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
        });

        if (!checkResponse.data.available) {
          onError(
            "This room was just booked by someone else. Please select different dates.",
          );
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
        // ✅ Show SweetAlert with NO timer — user must click OK
        await Swal.fire({
          icon: "success",
          title: "Payment Successful!",
          text: `₱${amount} has been charged to your card.`,
          confirmButtonText: "View Receipt",
          confirmButtonColor: "#f59e0b",
          showConfirmButton: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          background: "#0f172a",
          color: "#fff",
          customClass: {
            popup: "rounded-2xl border border-white/10",
            confirmButton: "rounded-xl px-6 py-2",
          },
        });

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
        <CardElement
          options={{
            style: {
              base: {
                color: "#fff",
                fontSize: "16px",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: {
                color: "#ef4444",
                iconColor: "#ef4444",
              },
            },
          }}
        />
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
const StarRating = ({
  rating,
  maxStars = 5,
  size = "sm",
  interactive = false,
  onRate,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
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
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <StarIcon
            className={`${sizeClasses[size]} ${
              star <= (hoverRating || rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-600 fill-gray-600"
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
  currentMonth,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [displayMonth, setDisplayMonth] = useState(() => {
    const minDate = min ? new Date(min + "T00:00:00") : new Date();
    return new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  });

  useEffect(() => {
    if (currentMonth) {
      setDisplayMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
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
    if (!dateStr) return "";

    const [y, m, d] = dateStr.split("-");
    const date = new Date(y, m - 1, d);

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ========================
  // MIN DATE CHECK (SAFE)
  // ========================
  const isDateDisabled = (day) => {
    if (!day) return true;

    const [minY, minM, minD] = (min || "1900-01-01").split("-");
    const minDate = new Date(minY, minM - 1, minD);

    const date = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      day,
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
    const month = String(displayMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");

    const dateStr = `${year}-${month}-${d}`;

    return bookedDates.includes(dateStr);
  };

  // ========================
  // SELECTED CHECK (FIXED)
  // ========================
  const isSelected = (day) => {
    if (!day || !value) return false;

    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");

    const dateStr = `${year}-${month}-${d}`;

    return value === dateStr;
  };

  // ========================
  // SELECT DATE (NO TIMEZONE BUG)
  // ========================
  const selectDate = (day) => {
    if (!day || isDateDisabled(day) || isOccupied(day)) return;

    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");

    const dateString = `${year}-${month}-${d}`;

    onChange(dateString);
    setIsOpen(false);
  };

  const days = getDaysInMonth(
    displayMonth.getFullYear(),
    displayMonth.getMonth(),
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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
                      1,
                    ),
                  )
                }
                className="p-2 rounded-lg hover:bg-white/10 text-white"
              >
                ‹
              </button>

              <h2 className="text-white font-semibold">
                {monthNames[displayMonth.getMonth()]}{" "}
                {displayMonth.getFullYear()}
              </h2>

              <button
                onClick={() =>
                  setDisplayMonth(
                    new Date(
                      displayMonth.getFullYear(),
                      displayMonth.getMonth() + 1,
                      1,
                    ),
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
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
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
                          ? "bg-cyan-500 text-white"
                          : isOccupied(day)
                            ? "bg-red-500/20 text-red-400 cursor-not-allowed"
                            : isDateDisabled(day)
                              ? "text-gray-600 cursor-not-allowed"
                              : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      }`}
                  >
                    {day}
                  </button>
                ) : (
                  <div key={idx} />
                ),
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
const AlertModal = ({ isOpen, onClose, title, message, type = "error" }) => {
  if (!isOpen) return null;

  const bgColor =
    type === "error"
      ? "bg-red-500/10 border-red-500/30"
      : "bg-green-500/10 border-green-500/30";
  const iconColor = type === "error" ? "text-red-400" : "text-green-400";
  const buttonColor =
    type === "error"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-green-500 hover:bg-green-600";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`bg-slate-900 rounded-2xl p-6 max-w-md w-full border ${bgColor} shadow-2xl`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor}`}
          >
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
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  if (!isOpen || !hotel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(hotel.id, { rating, comment, isAnonymous });
    setSubmitting(false);
    setRating(5);
    setComment("");
    setIsAnonymous(false);
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

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="text-sm font-medium text-white">Post anonymously</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isAnonymous ? 'Your name will be hidden' : 'Your real name will be shown'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                isAnonymous ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  isAnonymous ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
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
              {submitting ? "Submitting..." : "Submit Review"}
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
            <p className="text-gray-400 text-sm">
              {hotel.reviews?.length || 0} reviews
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {hotel.reviews && hotel.reviews.length > 0 ? (
            hotel.reviews.map((review, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                      {review.isAnonymous ? "A" : (review.user?.name?.charAt(0) || "U")}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {review.isAnonymous ? "Anonymous" : (review.user?.name || "Guest")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="font-bold">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  "{review.comment}"
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                No reviews yet. Be the first to review!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// PROFILE COMPONENT - Defined outside Dashboard to prevent re-mounting
const Profile = ({
  user,
  profileData,
  setProfileData,
  isEditingProfile,
  setIsEditingProfile,
  uploadingPhoto,
  setUploadingPhoto,
  editForm,
  setEditForm,
  loading,
  setLoading,
  api,
  authService,
  setAlertModal,
  fetchUserProfile,
  myBookings,
  favorites,
  hotels,
  handlePhotoUpload,
}) => {
  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditingProfile) {
      setEditForm({
        name: profileData.name || "",
        phone: profileData.phone || "",
      });
    }
  }, [isEditingProfile, profileData.name, profileData.phone, setEditForm]);

  // Handle input changes
  const handleInputChange = useCallback(
    (field, value) => {
      setEditForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setEditForm],
  );

  // Save changes
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'New passwords do not match', type: 'error' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    try {
      setChangingPassword(true);
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setAlertModal({ isOpen: true, title: 'Success', message: 'Password changed successfully', type: 'success' });
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setAlertModal({ isOpen: true, title: 'Error', message: err.response?.data?.error || 'Failed to change password', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const response = await api.put("/auth/me", {
        name: editForm.name,
        phone: editForm.phone,
      });

      if (response.data.success) {
        setProfileData((prev) => ({
          ...prev,
          name: editForm.name,
          phone: editForm.phone,
        }));

        // Update localStorage so sidebar reflects new name immediately
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...currentUser,
              name: editForm.name,
              phone: editForm.phone,
            }),
          );
        }

        setAlertModal({
          isOpen: true,
          title: "Success",
          message: "Profile updated successfully",
          type: "success",
        });
        setIsEditingProfile(false);
        fetchUserProfile();
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.error || "Failed to update profile",
        type: "error",
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
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-3xl font-bold overflow-hidden">
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(
                      "Profile avatar failed to load:",
                      profileData.avatar,
                    );
                    console.error("Full src attribute:", e.target.src);
                    e.target.alt = "Failed to load";
                  }}
                />
              ) : (
                profileData.name?.charAt(0) || "U"
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer border-2 border-slate-900 hover:bg-slate-700 transition-colors shadow-lg z-10"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                id="avatar-upload"
              />
              {uploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </label>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold">{profileData.name || "User"}</h3>
            <p className="text-gray-400 text-sm">{profileData.email}</p>
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
              <Phone className="w-3 h-3" />{" "}
              {profileData.phone || "No phone added"}
            </p>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
          >
            {isEditingProfile ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {isEditingProfile ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
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
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
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
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Member Since
                </p>
                <p className="font-medium">
                  {profileData.createdAt
                    ? new Date(profileData.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Role
                </p>
                <p className="font-medium capitalize">{user?.role || "User"}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Account Stats
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-cyan-400">
                    {myBookings.length}
                  </p>
                  <p className="text-xs text-gray-400">Bookings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {favorites.length}
                  </p>
                  <p className="text-xs text-gray-400">Favorites</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {hotels.reduce((acc, hotel) => {
                      const userReviews =
                        hotel.reviews?.filter((r) => r.user?._id === user?._id)
                          .length || 0;
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
    {/* Change Password Card */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 max-w-2xl border border-white/10 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Password & Security</h3>
            <p className="text-sm text-gray-400 mt-0.5">Update your password</p>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                placeholder="Repeat new password"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPasswordForm(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium disabled:opacity-50"
              >
                {changingPassword ? 'Changing...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const HotelCard = ({
  hotel,
  onBookNow,
  onInquire,
  isHovered,
  onHover,
  onLeave,
  handleToggleFavorite,
  favoriteIds,
  isAdmin,
  handleDeleteHotel,
  setReviewModal,
  setReviewsModal,
}) => {
  const isFav = favoriteIds.has(hotel.id);
  const [expandedBookings, setExpandedBookings] = useState({});

  const toggleExpand = (roomType) => {
    setExpandedBookings((prev) => ({
      ...prev,
      [roomType]: !prev[roomType],
    }));
  };

  return (
    <div
      className="group bg-slate-900/50 rounded-2xl overflow-visible border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-500/10 relative isolate"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <button
          onClick={(e) => handleToggleFavorite(hotel.id, e)}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors z-10"
        >
          <HeartIcon
            className={`w-5 h-5 ${isFav ? "fill-red-500 text-red-500" : "text-white"}`}
          />
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
              <p className="text-lg font-bold mb-1">
                {hotel.maxGuests} Persons
              </p>
              <p className="text-sm text-gray-300">Maximum capacity per room</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1">
                {hotel.roomTypes.slice(0, 2).map((type, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white/20 rounded text-xs"
                  >
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
            <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">
              {hotel.name}
            </h3>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <MapPin className="w-4 h-4" /> {hotel.location}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
            <Users className="w-3 h-3" />
            <span>Max {hotel.maxGuests}</span>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {hotel.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {hotel.amenities.map((amenity, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-300 border border-white/10"
            >
              {amenity}
            </span>
          ))}
        </div>

        {hotel.bookedDatesByRoomType &&
          Object.keys(hotel.bookedDatesByRoomType).length > 0 && (
            <div className="mb-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-1 mb-2">
                <Calendar className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-300 font-medium">
                  Booked Dates by Room:
                </span>
              </div>

              <div className="space-y-2">
                {Object.entries(hotel.bookedDatesByRoomType).map(
                  ([roomType, dates]) => {
                    const isExpanded = expandedBookings[roomType];
                    const visibleDates = isExpanded ? dates : dates.slice(0, 5);
                    const hiddenCount = dates.length - 5;

                    return (
                      <div key={roomType} className="flex items-start gap-2">
                        <span className="text-[10px] text-gray-400 font-medium min-w-[45px] mt-0.5">
                          {roomType}:
                        </span>
                        <div className="flex flex-wrap gap-1 items-center">
                          {visibleDates.map((dateStr, idx) => {
                            const [y, m, d] = dateStr.split("-").map(Number);
                            const dateObj = new Date(y, m - 1, d);
                            const day = String(dateObj.getDate()).padStart(
                              2,
                              "0",
                            );
                            const month = dateObj.toLocaleString("en-GB", {
                              month: "short",
                            });

                            return (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-1 bg-red-500/20 text-red-300 rounded"
                              >
                                {day} {month}
                              </span>
                            );
                          })}

                          {!isExpanded && hiddenCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(roomType);
                              }}
                              className="text-[10px] px-2 py-1 bg-red-500/30 text-red-300 rounded hover:bg-red-500/40 transition-colors cursor-pointer"
                            >
                              +{hiddenCount} more
                            </button>
                          )}

                          {isExpanded && hiddenCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(roomType);
                              }}
                              className="text-[10px] px-2 py-1 bg-gray-500/30 text-gray-300 rounded hover:bg-gray-500/40 transition-colors cursor-pointer"
                            >
                              show less
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

        {/* Show recent reviews preview */}
        {hotel.reviews && hotel.reviews.length > 0 && (
          <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-gray-400">Latest review:</span>
            </div>
            <p className="text-xs text-gray-300 italic line-clamp-1">
              "{hotel.reviews[hotel.reviews.length - 1].comment}"
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                —{" "}
                {hotel.reviews[hotel.reviews.length - 1].isAnonymous
                  ? "Anonymous"
                  : (hotel.reviews[hotel.reviews.length - 1].user?.name || "Guest")}
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

        <div className="pt-4 border-t border-white/10">
  <div className="flex gap-1">
  <button
    onClick={(e) => { e.stopPropagation(); setReviewModal({ isOpen: true, hotel }); }}
    className="px-2 py-1.5 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-1 text-xs"
  >
    <MessageSquare className="w-3 h-3" />
    Review
  </button>
  <button
    onClick={() => onInquire && onInquire(hotel)}
    className="px-2 py-1.5 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-1 text-xs"
  >
    <MessageSquare className="w-3 h-3" />
    Inquire
  </button>
  <button
    onClick={() => onBookNow(hotel)}
    className="px-3 py-1.5 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-cyan-500/25 text-white text-xs"
  >
    Book Now
  </button>
</div>
        </div>
      </div>
    </div>
  );
};
const BrowseHotels = ({
  searchQuery,
  setSearchQuery,
  selectedGuests,
  setSelectedGuests,
  showGuestDropdown,
  setShowGuestDropdown,
  filteredHotels,
  loading,
  handleBookNow,
  hoveredHotel,
  setHoveredHotel,
  handleToggleFavorite,
  favoriteIds,
  isAdmin,
  handleDeleteHotel,
  setReviewModal,
  setReviewsModal,
  guestOptions,
  openChat,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 overflow-visible relative z-10">
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 relative">
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 ml-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search hotels or destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>

          <div className="relative z-20 overflow-visible">
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 ml-1">
              Guests
            </label>
            <div className="relative overflow-visible">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowGuestDropdown((prev) => !prev)}
                className="w-full pl-12 pr-10 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <span>{selectedGuests} Guests</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${showGuestDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showGuestDropdown && (
                <div className="absolute right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto z-30 w-full min-w-[200px]">
                  {guestOptions.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setSelectedGuests(num);
                        setShowGuestDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between ${
                        selectedGuests === num
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "text-white"
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
          Showing{" "}
          <span className="text-white font-bold">{filteredHotels.length}</span>{" "}
          properties
          <span className="text-cyan-400 text-sm ml-2">
            (for {selectedGuests} guests)
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              onBookNow={handleBookNow}
              onInquire={(h) => openChat(h.id, h.name)}
              isHovered={hoveredHotel === hotel.id}
              onHover={() => setHoveredHotel(hotel.id)}
              onLeave={() => setHoveredHotel(null)}
              handleToggleFavorite={handleToggleFavorite}
              favoriteIds={favoriteIds}
              isAdmin={isAdmin}
              handleDeleteHotel={handleDeleteHotel}
              setReviewModal={setReviewModal}
              setReviewsModal={setReviewsModal}
            />
          ))}
        </div>
      )}

      {filteredHotels.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">
            No hotels found for {selectedGuests} guests
          </p>
          <p className="text-gray-500 text-sm">
            Try selecting fewer guests or check back later
          </p>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalCheckIn, setModalCheckIn] = useState("");
  const [modalCheckOut, setModalCheckOut] = useState("");
  const [bookingStep, setBookingStep] = useState("rooms");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [hoveredHotel, setHoveredHotel] = useState(null);

  const [bookedDates, setBookedDates] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    hotel: null,
  });
  const [reviewsModal, setReviewsModal] = useState({
    isOpen: false,
    hotel: null,
  });

  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeChatHotelId, setActiveChatHotelId] = useState(null);
  const [activeChatHotelName, setActiveChatHotelName] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Profile edit form state - moved here to prevent re-initialization
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
  });

  const [seenBookings, setSeenBookings] = useState(() => parseInt(localStorage.getItem('seenBookings') || '0'));
  const [seenFavorites, setSeenFavorites] = useState(() => parseInt(localStorage.getItem('seenFavorites') || '0'));
  const [seenMessages, setSeenMessages] = useState(() => parseInt(localStorage.getItem('seenMessages') || '0'));

  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load cached user data immediately on mount to prevent empty sidebar
  useEffect(() => {
    const cachedUser = authService.getCurrentUser();
    if (cachedUser) {
      let avatarUrl = cachedUser.avatar || "";
      if (avatarUrl && !avatarUrl.startsWith("http") && api.defaults.baseURL) {
        let baseUrl = api.defaults.baseURL
          .replace(/\/api\/?$/, "")
          .replace(/\/$/, "");
        avatarUrl = baseUrl + "/" + avatarUrl.replace(/^\//, "");
      }
      setProfileData((prev) => ({
        ...prev,
        name: cachedUser.name || prev.name,
        email: cachedUser.email || prev.email,
        phone: cachedUser.phone || prev.phone,
        avatar: avatarUrl || prev.avatar,
      }));
    }
  }, []);

  const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  const isAdmin = user?.role === "admin";

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
    fetchMyBookings();
    fetchFavorites();
    fetchUserProfile();
    fetchConversations();
  }, []);

  // Re-fetch favorites when navigating to favorites tab to ensure sync
  useEffect(() => {
  if (activeTab === 'favorites') {
    fetchFavorites();
  }
  // Stop polling when leaving chat tab
  if (activeTab !== 'chat' && chatPollingRef.current) {
    clearInterval(chatPollingRef.current);
    chatPollingRef.current = null;
  }
}, [activeTab]);

  useEffect(() => {
    if (selectedRoom && bookingStep === "dates") {
      fetchBookedDates();
    }
  }, [selectedRoom, bookingStep, calendarMonth]);

  const fetchBookedDates = async () => {
    try {
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const response = await getRoomBookedDates(selectedRoom._id, year, month);
      if (response.success) {
        // Flatten date ranges into individual YYYY-MM-DD strings
        let dates = [];
        if (Array.isArray(response.data)) {
          response.data.forEach((booking) => {
            const checkIn = booking.checkIn || booking.checkInDate || booking;
            const checkOut =
              booking.checkOut || booking.checkOutDate || booking;

            if (checkIn && checkOut) {
              const start = new Date(checkIn);
              const end = new Date(checkOut);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const current = new Date(start);
                while (current <= end) {
                  const y = current.getFullYear();
                  const m = String(current.getMonth() + 1).padStart(2, "0");
                  const d = String(current.getDate()).padStart(2, "0");
                  dates.push(`${y}-${m}-${d}`);
                  current.setDate(current.getDate() + 1);
                }
              }
            }
          });
        }
        setBookedDates(dates);
      }
    } catch (err) {
      console.error("Failed to fetch booked dates", err);
    }
  };

  // Fetch user profile to get latest data including phone
  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data.success) {
        const userData = response.data.data;
        let avatarUrl = userData.avatar || "";
        if (avatarUrl && !avatarUrl.startsWith("http")) {
          let baseUrl =
            api.defaults.baseURL || process.env.REACT_APP_API_URL || "";
          baseUrl = baseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
          avatarUrl = baseUrl + "/" + avatarUrl.replace(/^\//, "");
        }

        const updatedProfile = {
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          avatar: avatarUrl,
          createdAt: userData.createdAt || userData.created_at || "",
        };

        setProfileData(updatedProfile);

        // Update localStorage user data too
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            ...userData,
            avatar: avatarUrl,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await getMyConversations();
      if (res.success) setConversations(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  const chatPollingRef = React.useRef(null);

const openChat = async (hotelId, hotelName) => {
  setActiveChatHotelId(hotelId);
  setActiveChatHotelName(hotelName);
  setActiveTab('chat');
  try {
    const res = await getConversation(hotelId);
    if (res.success) setChatMessages(res.data.messages || []);
  } catch (err) {
    setChatMessages([]);
  }

  // Clear any existing polling
  if (chatPollingRef.current) clearInterval(chatPollingRef.current);

  // Poll every 3 seconds
  chatPollingRef.current = setInterval(async () => {
    try {
      const res = await getConversation(hotelId);
      if (res.success) setChatMessages(res.data.messages || []);
    } catch (err) {}
  }, 3000);
};

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChatHotelId) return;
    setChatLoading(true);
    try {
      const res = await sendMessage(activeChatHotelId, chatInput.trim());
      if (res.success) {
        setChatMessages((prev) => [...prev, res.data]);
        setChatInput("");
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
    setChatLoading(false);
  };

  // Calculate hotel max capacity from rooms
  const calculateHotelMaxCapacity = (hotelRooms) => {
    if (!hotelRooms || hotelRooms.length === 0) return 0;
    return Math.max(...hotelRooms.map((room) => room.capacity || 0));
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

              // ✅ FIX: Group booked dates by room type
              let bookedDatesByRoomType = {};
              let bookedDatesList = [];

              if (bookedRes.success && Array.isArray(bookedRes.data)) {
                bookedRes.data.forEach((booking) => {
                  const checkIn =
                    booking.checkIn || booking.checkInDate || booking;
                  const checkOut =
                    booking.checkOut || booking.checkOutDate || booking;
                  const roomType =
                    booking.room?.type || booking.roomType || "Room";

                  if (checkIn && checkOut) {
                    const start = new Date(checkIn);
                    const end = new Date(checkOut);

                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                      const current = new Date(start);
                      while (current <= end) {
                        const year = current.getFullYear();
                        const month = String(current.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        const day = String(current.getDate()).padStart(2, "0");
                        const dateStr = `${year}-${month}-${day}`;

                        bookedDatesList.push(dateStr);

                        if (!bookedDatesByRoomType[roomType]) {
                          bookedDatesByRoomType[roomType] = new Set();
                        }
                        bookedDatesByRoomType[roomType].add(dateStr);

                        current.setDate(current.getDate() + 1);
                      }
                    }
                  }
                });
              }

              // Convert Sets to sorted arrays
              Object.keys(bookedDatesByRoomType).forEach((type) => {
                bookedDatesByRoomType[type] = Array.from(
                  bookedDatesByRoomType[type],
                ).sort();
              });

              return {
                id: hotel._id,
                name: hotel.name,
                location: `${hotel.location.city}, ${hotel.location.country}`,
                price: hotel.starRating * 500,
                rating: hotel.averageRating || hotel.starRating,
                reviewCount: hotel.reviewCount || 0,
                image:
                  hotel.images[0] ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
                amenities: hotel.amenities,
                description: hotel.description,
                maxGuests: maxCapacity || hotel.maxGuests || 4,
                roomTypes: [...new Set(hotelRooms.map((r) => r.type))] || [
                  "Standard",
                  "Deluxe",
                  "Suite",
                ],
                reviews: hotel.reviews || [],
                rooms: hotelRooms,
                bookedDates: bookedDatesList,
                bookedDatesByRoomType: bookedDatesByRoomType,
              };
            } catch (err) {
              return {
                id: hotel._id,
                name: hotel.name,
                location: `${hotel.location.city}, ${hotel.location.country}`,
                price: hotel.starRating * 500,
                rating: hotel.averageRating || hotel.starRating,
                reviewCount: hotel.reviewCount || 0,
                image:
                  hotel.images[0] ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
                amenities: hotel.amenities,
                description: hotel.description,
                maxGuests: hotel.maxGuests || 4,
                roomTypes: ["Standard", "Deluxe", "Suite"],
                reviews: hotel.reviews || [],
                rooms: [],
                bookedDates: [],
                bookedDatesByRoomType: {},
              };
            }
          }),
        );
        setHotels(hotelsWithRooms);
      }
    } catch (err) {
      setError("Failed to load hotels");
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
        // Sync favoriteIds with server response to ensure consistency
        const serverFavoriteIds = new Set(response.data.map((h) => h._id));
        setFavoriteIds(serverFavoriteIds);
      }
    } catch (err) {
      console.error("Failed to load favorites", err);
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
      console.error("Failed to load bookings", err);
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
      setError("Failed to load rooms");
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
          // Add to favoriteIds
          setFavoriteIds((prev) => new Set([...prev, hotelId]));
          // Add the hotel object to favorites array immediately
          const hotelToAdd = hotels.find((h) => h.id === hotelId);
          if (hotelToAdd) {
            setFavorites((prev) => [
              ...prev,
              {
                _id: hotelToAdd.id,
                name: hotelToAdd.name,
                location: {
                  city: hotelToAdd.location.split(",")[0]?.trim(),
                  country: hotelToAdd.location.split(",")[1]?.trim(),
                },
                starRating: Math.round(hotelToAdd.price / 500),
                averageRating: hotelToAdd.rating,
                reviewCount: hotelToAdd.reviewCount,
                images: [hotelToAdd.image],
                amenities: hotelToAdd.amenities,
                description: hotelToAdd.description,
                maxGuests: hotelToAdd.maxGuests,
                reviews: hotelToAdd.reviews,
                bookedDates: hotelToAdd.bookedDates,
                bookedDatesByRoomType: hotelToAdd.bookedDatesByRoomType,
              },
            ]);
          }
        } else {
          // Remove from favoriteIds
          setFavoriteIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(hotelId);
            return newSet;
          });
          // Remove from favorites array immediately
          setFavorites((prev) => prev.filter((f) => f._id !== hotelId));
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const handleDeleteHotel = async (hotelId, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this hotel? This action cannot be undone.",
      )
    )
      return;

    try {
      setLoading(true);
      await deleteHotel(hotelId);
      await fetchHotels();
      setAlertModal({
        isOpen: true,
        title: "Deleted",
        message: "Hotel has been deleted successfully",
        type: "success",
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to delete hotel",
        type: "error",
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
        title: "Review Submitted",
        message: "Thank you for your review!",
        type: "success",
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.error || "Failed to submit review",
        type: "error",
      });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      setLoading(true);
      const response = await cancelBooking(bookingId);
      if (response.success) {
        // Update local state immediately for instant feedback
        setMyBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId ? { ...b, status: "cancelled" } : b,
          ),
        );
        // Re-fetch hotels to free up cancelled dates
        fetchHotels();
        setAlertModal({
          isOpen: true,
          title: "Cancelled",
          message: "Booking has been cancelled successfully",
          type: "success",
        });
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.error || "Failed to cancel booking",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteBooking = async (bookingId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this cancelled booking? This action cannot be undone.",
      )
    )
      return;

    try {
      setLoading(true);
      const response = await deleteBooking(bookingId);
      if (response.success) {
        // Remove from local state immediately for instant feedback
        setMyBookings((prev) => prev.filter((b) => b._id !== bookingId));
        // Re-fetch hotels to free up deleted dates
        fetchHotels();
        setAlertModal({
          isOpen: true,
          title: "Deleted",
          message: "Booking has been permanently deleted",
          type: "success",
        });
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.error || "Failed to delete booking",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: "Sign Out?",
      text: "Are you sure you want to sign out of your account?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Sign Out",
      cancelButtonText: "Cancel",
      background: "#0f172a",
      color: "#fff",
      customClass: {
        popup: "rounded-2xl border border-white/10",
        confirmButton: "rounded-xl",
        cancelButton: "rounded-xl",
      },
    });

    if (result.isConfirmed) {
      onLogout();
    }
  };
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlertModal({
        isOpen: true,
        title: "File Too Large",
        message: "Profile photo must be less than 5MB",
        type: "error",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAlertModal({
        isOpen: true,
        title: "Invalid File",
        message: "Please upload an image file",
        type: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploadingPhoto(true);
      const response = await api.put("/auth/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        let avatarUrl = response.data.data.avatar;
        // Convert relative URL to absolute URL
        if (avatarUrl && !avatarUrl.startsWith("http")) {
          const baseUrl = api.defaults.baseURL || window.location.origin;
          avatarUrl =
            baseUrl.replace(/\/$/, "") + "/" + avatarUrl.replace(/^\//, "");
        }
        const newAvatarUrl = avatarUrl + "?t=" + Date.now();
        console.log("Avatar URL set to:", newAvatarUrl);
        console.log("Avatar URL length:", newAvatarUrl.length);
        setProfileData((prev) => ({ ...prev, avatar: newAvatarUrl }));
        setAlertModal({
          isOpen: true,
          title: "Success",
          message: "Profile photo updated",
          type: "success",
        });
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          localStorage.setItem(
            "user",
            JSON.stringify({ ...currentUser, avatar: newAvatarUrl }),
          );
        }
        fetchUserProfile();
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Error",
        message:
          err.response?.data?.error || err.message || "Failed to upload photo",
        type: "error",
      });
      console.error("Photo upload error:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // FIXED: Filter hotels by actual room capacity, not hardcoded maxGuests
  const filteredHotels = useMemo(() => {
    let filtered = hotels;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (hotel) =>
          hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hotel.location.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Guest capacity filter - only show hotels that have at least one room fitting selected guests
    filtered = filtered.filter((hotel) => {
      // If we have room data, check if any room can accommodate
      if (hotel.rooms && hotel.rooms.length > 0) {
        return hotel.rooms.some((room) => room.capacity >= selectedGuests);
      }
      // Fallback to maxGuests if rooms not loaded
      return hotel.maxGuests >= selectedGuests;
    });

    return filtered;
  }, [searchQuery, selectedGuests, hotels]);

  const handleBookNow = useCallback(
    async (hotel) => {
      setSelectedHotel(hotel);
      setBookingStep("rooms");
      setSelectedRoom(null);
      setModalCheckIn("");
      setModalCheckOut("");
      setBookedDates([]);
      await fetchHotelRooms(hotel.id);
    },
    [fetchHotelRooms],
  );

  const handleSelectRoom = (room) => {
    if (room.capacity < selectedGuests) return;
    setSelectedRoom(room);
    setBookingStep("dates");
    setModalCheckIn("");
    setModalCheckOut("");
    setCalendarMonth(new Date());
  };

  const handleBackToRooms = () => {
    setBookingStep("rooms");
    setSelectedRoom(null);
    setModalCheckIn("");
    setModalCheckOut("");
    setBookedDates([]);
  };

  const handleCheckAvailability = async () => {
    if (!modalCheckIn || !modalCheckOut) {
      setAlertModal({
        isOpen: true,
        title: "Dates Required",
        message: "Please select both check-in and check-out dates",
        type: "error",
      });
      return;
    }

    if (numberOfNights <= 0) {
      setAlertModal({
        isOpen: true,
        title: "Invalid Dates",
        message: "Check-out date must be after check-in date",
        type: "error",
      });
      return;
    }

    const hasConflict =
      bookedDates.includes(modalCheckIn) || bookedDates.includes(modalCheckOut);

    if (hasConflict) {
      setAlertModal({
        isOpen: true,
        title: "Dates Not Available",
        message:
          "Your selected check-in or check-out date is already occupied. Please choose different dates.",
        type: "error",
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
        totalPrice: selectedRoom.pricePerNight * numberOfNights,
      };

      const response = await createBooking(bookingData);
      if (response.success) {
        fetchHotels(); // Re-fetch to update booked dates
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingSuccess(false);
          setSelectedHotel(null);
          setSelectedRoom(null);
          setModalCheckIn("");
          setModalCheckOut("");
          setBookingStep("rooms");
          setBookedDates([]);
          setActiveTab("bookings");
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 409) {
        const errorMsg =
          err.response?.data?.error ||
          "This room is already booked for these dates.";
        setAlertModal({
          isOpen: true,
          title: "Room Already Occupied",
          message: errorMsg,
          type: "error",
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: "Booking Failed",
          message: err.response?.data?.error || err.message,
          type: "error",
        });
      }
    }
  };

  const closeAlertModal = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  };
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  // ✅ FIXED "today"
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .split("T")[0];

  const Sidebar = () => {
    const newBookings = Math.max(0, myBookings.length - seenBookings);
    const newFavorites = Math.max(0, favorites.length - seenFavorites);
    const newMessages = Math.max(0, conversations.length - seenMessages);

    return (
    <div className="w-64 bg-slate-900/50 border-r border-white/10 p-6 flex flex-col h-full">
      <div
        className="flex items-center gap-2 mb-8 cursor-pointer"
        onClick={() => setActiveTab("browse")}
      >
        <Diamond className="w-8 h-8 text-cyan-400" />
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          AI STAY
        </span>
      </div>
      <nav className="space-y-2 flex-1">
        <SidebarItem
          icon={Home}
          label="Browse Hotels"
          active={activeTab === "browse"}
          onClick={() => setActiveTab("browse")}
        />
        <SidebarItem
          icon={BookOpen}
          label="My Bookings"
          active={activeTab === "bookings"}
          onClick={() => { setActiveTab("bookings"); setSeenBookings(myBookings.length); localStorage.setItem('seenBookings', myBookings.length); }}
          badge={newBookings}
        />
        <SidebarItem
          icon={Heart}
          label="Favorites"
          active={activeTab === "favorites"}
          onClick={() => { setActiveTab("favorites"); setSeenFavorites(favorites.length); fetchFavorites(); localStorage.setItem('seenFavorites', favorites.length); }}
          badge={newFavorites}
        />
        <SidebarItem
          icon={MessageSquare}
          label="Messages"
          active={activeTab === "chat"}
          onClick={() => { setActiveTab("chat"); fetchConversations(); setSeenMessages(conversations.length); localStorage.setItem('seenMessages', conversations.length); }}
          badge={newMessages}
        />
        <SidebarItem
          icon={User}
          label="Profile"
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
        />
      </nav>
      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold overflow-hidden ring-2 ring-white/20">
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <span
              className={`text-white ${profileData.avatar ? "hidden" : "flex"}`}
            >
              {(profileData?.name || user?.name)?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm">
              {profileData?.name || user?.name || "User"}
            </p>
            <p className="text-xs text-gray-400">
              {user?.email || "user@example.com"}
            </p>
            {profileData.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" /> {profileData.phone}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {myBookings.length}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {favorites.length}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />{" "}
            {hotels.reduce((acc, hotel) => {
              const userReviews =
                hotel.reviews?.filter((r) => r.user?._id === user?._id)
                  .length || 0;
              return acc + userReviews;
            }, 0)}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
    );
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
        active
          ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </div>
      {badge > 0 && (
        <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </button>
  );

  const MyBookings = () => {
    // ✅ Sort bookings: newest first (most recent createdAt)
    const sortedBookings = [...myBookings].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Bookings</h2>
          <span className="text-gray-400 text-sm">
            {sortedBookings.length} booking
            {sortedBookings.length !== 1 ? "s" : ""}
          </span>
        </div>

        {sortedBookings.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              No bookings yet. Start exploring hotels!
            </p>
            <button
              onClick={() => setActiveTab("browse")}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            >
              Browse Hotels
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedBookings.map((booking) => {
              const nights = Math.ceil(
                (new Date(booking.checkOutDate) -
                  new Date(booking.checkInDate)) /
                  (1000 * 60 * 60 * 24),
              );
              const pricePerNight = Math.round(booking.totalPrice / nights);

              return (
                <div
                  key={booking._id}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-48 md:h-auto relative">
                      <img
                        src={
                          booking.hotel?.images?.[0] ||
                          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                        }
                        alt={booking.hotel?.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span
                          className={`text-xs font-medium ${
                            booking.status === "confirmed"
                              ? "text-green-400"
                              : booking.status === "cancelled"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-xl mb-1">
                            {booking.hotel?.name || "Hotel"}
                          </h3>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.hotel?.location?.city || "Location"},{" "}
                            {booking.hotel?.location?.country || ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-cyan-400">
                            ₱{booking.totalPrice}
                          </span>
                          <p className="text-gray-500 text-xs">total</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Bed className="w-3 h-3" /> Room
                          </p>
                          <p className="font-medium text-sm capitalize">
                            {booking.room?.type || "Standard"}
                          </p>
                          <p className="text-xs text-gray-400">
                            #{booking.room?.roomNumber || "N/A"}
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Check-in
                          </p>
                          <p className="font-medium text-sm">
                            {formatDate(booking.checkInDate)}
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Check-out
                          </p>
                          <p className="font-medium text-sm">
                            {formatDate(booking.checkOutDate)}
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Moon className="w-3 h-3" /> Nights
                          </p>
                          <p className="font-medium text-sm">
                            {nights} night{nights !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-gray-400">
                            ₱{pricePerNight}/night
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                        <span className="flex items-center gap-1 text-gray-400">
                          <Users className="w-4 h-4" /> {booking.guests} guest
                          {booking.guests !== 1 ? "s" : ""}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">
                          Booked on{" "}
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex justify-end gap-3">
                        {booking.status === "cancelled" ? (
                          <button
                            onClick={() => handleDeleteBooking(booking._id)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 hover:scale-105 active:scale-95 text-red-400 border border-red-500/30 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            {loading ? "Deleting..." : "Delete Booking"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/25 hover:scale-105 active:scale-95 text-red-400 rounded-lg transition-all duration-200 text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            {loading ? "Cancelling..." : "Cancel Booking"}
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
        <span className="text-gray-400 text-sm">
          {favorites.length} favorite{favorites.length !== 1 ? "s" : ""}
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            No favorites yet. Start browsing and heart your favorite hotels!
          </p>
          <button
            onClick={() => setActiveTab("browse")}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            Browse Hotels
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((hotel) => {
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
                  image:
                    hotel.images[0] ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
                  amenities: hotel.amenities,
                  description: hotel.description,
                  maxGuests: maxCap,
                  roomTypes: ["Standard", "Deluxe", "Suite"],
                  reviews: hotel.reviews || [],
                  bookedDates: hotel.bookedDates || [],
                  bookedDatesByRoomType: hotel.bookedDatesByRoomType || {},
                }}
                onBookNow={handleBookNow}
                isHovered={hoveredHotel === hotel._id}
                onHover={() => setHoveredHotel(hotel._id)}
                onLeave={() => setHoveredHotel(null)}
                handleToggleFavorite={handleToggleFavorite}
                favoriteIds={favoriteIds}
                isAdmin={isAdmin}
                handleDeleteHotel={handleDeleteHotel}
                setReviewModal={setReviewModal}
                setReviewsModal={setReviewsModal}
                onInquire={(h) => openChat(h.id, h.name)}
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

        const response = await api.post("/bookings", bookingPayload);

        if (response.data.success) {
          // ✅ Immediately add to myBookings so it shows without refresh
          const newBooking = {
            _id: response.data.data._id || response.data.data.id,
            hotel: {
              _id: selectedHotel.id,
              name: selectedHotel.name,
              location: {
                city: selectedHotel.location.split(",")[0]?.trim(),
                country: selectedHotel.location.split(",")[1]?.trim(),
              },
              images: [selectedHotel.image],
            },
            room: {
              type: selectedRoom.type,
              roomNumber: selectedRoom.roomNumber,
            },
            checkInDate: modalCheckIn,
            checkOutDate: modalCheckOut,
            guests: selectedGuests,
            totalPrice: calculatedTotal,
            status: "confirmed",
            createdAt: new Date().toISOString(),
          };

          setMyBookings((prev) => [newBooking, ...prev]);

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

          // Update booked dates in hotels state immediately
setHotels(prev => prev.map(h => {
  if (h.id !== selectedHotel.id) return h;
  const roomType = selectedRoom.type || 'Room';
  const newDates = [];
  const start = new Date(modalCheckIn);
  const end = new Date(modalCheckOut);
  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    newDates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  const updatedByRoomType = { ...h.bookedDatesByRoomType };
  updatedByRoomType[roomType] = [...new Set([...(updatedByRoomType[roomType] || []), ...newDates])].sort();
  return { ...h, bookedDates: [...new Set([...h.bookedDates, ...newDates])], bookedDatesByRoomType: updatedByRoomType };
}));

setShowReceipt(true);
        }
      } catch (err) {
        console.error(
          "Booking creation error:",
          err.response?.data || err.message,
        );
        setAlertModal({
          isOpen: true,
          title: "Critical Error",
          message:
            "Payment was successful but we could not create your booking. Please contact support immediately with your payment reference: " +
            paymentIntent.id,
          type: "error",
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
              <p className="text-gray-400">
                Your payment and reservation are complete.
              </p>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">
                    {bookingStep === "rooms"
                      ? "Select Room"
                      : "Select Dates & Pay"}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedHotel.name}
                  </p>
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
                    <StarRating
                      rating={Math.round(selectedHotel.rating)}
                      size="sm"
                    />
                    <span className="font-bold">{selectedHotel.rating}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400 text-sm">
                      {selectedGuests} guests
                    </span>
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
                              <h5 className="font-bold capitalize">
                                {room.type}
                              </h5>
                              <p className="text-sm text-gray-400">
                                {room.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Capacity: {room.capacity} persons
                              </p>
                            </div>
                            <span className="text-cyan-400 font-bold">
                              ₱{room.pricePerNight}
                              <span className="text-gray-500 text-xs font-normal">
                                /night
                              </span>
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
                      <p className="text-red-400 text-sm">
                        Check-out must be after check-in
                      </p>
                    </div>
                  )}

                  {/* TOTAL */}
                  {numberOfNights > 0 && (
                    <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">
                          {selectedRoom.type} Room
                        </span>
                        <span className="text-white">
                          ₱{selectedRoom.pricePerNight} × {numberOfNights}{" "}
                          nights
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                        <span className="text-gray-400 font-medium">
                          Total Price
                        </span>
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
                              title: "Payment Error",
                              message: message,
                              type: "error",
                            });
                          }}
                        />
                      </Elements>
                    </div>
                  )}

                  {!isReadyToPay && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      <p className="text-gray-400 text-sm">
                        Select check-in and check-out dates to proceed with
                        payment
                      </p>
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
              setBookingStep("rooms");
              setModalCheckIn("");
              setModalCheckOut("");
              setBookedDates([]);
              setActiveTab("bookings");
              // ✅ Re-fetch to ensure server state matches
              fetchMyBookings();
            }}
          />
        )}
      </div>
    );
  };

  // BROWSE HOTELS - Moved outside Dashboard to prevent re-mounting on search

  // MAIN RENDER
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-900/50 border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {activeTab === "browse" && "Discover Hotels"}
              {activeTab === "bookings" && "My Bookings"}
              {activeTab === "favorites" && "My Favorites"}
              {activeTab === "profile" && "My Profile"}
              {activeTab === "chat" && "Messages"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === "browse" && "Find your perfect stay"}
              {activeTab === "bookings" && "Manage your reservations"}
              {activeTab === "favorites" && "Your saved hotels"}
              {activeTab === "profile" && "Manage your account"}
              {activeTab === "chat" && "Chat with hotels"}
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
          {activeTab === "browse" && (
            <BrowseHotels
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedGuests={selectedGuests}
              setSelectedGuests={setSelectedGuests}
              showGuestDropdown={showGuestDropdown}
              setShowGuestDropdown={setShowGuestDropdown}
              filteredHotels={filteredHotels}
              loading={loading}
              handleBookNow={handleBookNow}
              hoveredHotel={hoveredHotel}
              setHoveredHotel={setHoveredHotel}
              handleToggleFavorite={handleToggleFavorite}
              favoriteIds={favoriteIds}
              isAdmin={isAdmin}
              handleDeleteHotel={handleDeleteHotel}
              setReviewModal={setReviewModal}
              setReviewsModal={setReviewsModal}
              guestOptions={guestOptions}
              openChat={openChat}
            />
          )}
          {activeTab === "bookings" && <MyBookings />}
          {activeTab === "chat" && (
            <div className="flex h-full gap-4">
              {/* Conversations list */}
              <div className="w-64 bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col gap-2 overflow-y-auto">
                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Conversations
                </h3>
                {conversations.length === 0 && (
                  <p className="text-gray-500 text-sm text-center mt-4">
                    No conversations yet. Click Inquire on a hotel to start
                    chatting.
                  </p>
                )}
                {conversations.map((conv) => (
                  <button
                    key={conv.hotelId}
                    onClick={() => openChat(conv.hotelId, conv.hotelName)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${activeChatHotelId === conv.hotelId ? "bg-cyan-500/20 border border-cyan-500/30" : "bg-white/5 hover:bg-white/10"}`}
                  >
                    <p className="font-medium text-sm">{conv.hotelName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </button>
                ))}
              </div>
              {/* Chat window */}
              <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 flex flex-col">
                {!activeChatHotelId ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">
                        Select a conversation or inquire about a hotel
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-bold">{activeChatHotelName}</h3>
                      <p className="text-xs text-gray-400">
                        Hotel support chat
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${msg.senderRole === "user" ? "items-end" : "items-start"}`}
                        >
                          <p className="text-xs text-gray-500 mb-1 px-1">
                            {msg.senderRole === "user"
                              ? "You"
                              : activeChatHotelName}
                          </p>
                          <div
                            className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.senderRole === "user" ? "bg-cyan-500/30 text-white" : "bg-white/10 text-gray-200"}`}
                          >
                            <p>{msg.message}</p>
                            <p className="text-xs opacity-50 mt-1">
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString()
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                      {chatMessages.length === 0 && (
                        <p className="text-center text-gray-500 text-sm mt-8">
                          No messages yet. Say hello!
                        </p>
                      )}
                    </div>
                    <div className="p-4 border-t border-white/10 flex gap-3">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        placeholder="Type a message..."
                        className="flex-1 p-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={chatLoading || !chatInput.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium disabled:opacity-50 transition-all"
                      >
                        Send
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {activeTab === "favorites" && <Favorites />}
          {activeTab === "profile" && (
            <Profile
              user={user}
              profileData={profileData}
              setProfileData={setProfileData}
              isEditingProfile={isEditingProfile}
              setIsEditingProfile={setIsEditingProfile}
              uploadingPhoto={uploadingPhoto}
              setUploadingPhoto={setUploadingPhoto}
              editForm={editForm}
              setEditForm={setEditForm}
              loading={loading}
              setLoading={setLoading}
              api={api}
              authService={authService}
              setAlertModal={setAlertModal}
              fetchUserProfile={fetchUserProfile}
              myBookings={myBookings}
              favorites={favorites}
              hotels={hotels}
              handlePhotoUpload={handlePhotoUpload}
            />
          )}
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
