import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Star,
  LogOut,
  Plus,
  Trash2,
  X,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Check,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  ThumbsUp,
  Flag,
  Eye,
  User,
  CheckCircle,
  XCircle,
  Users,
  Shield,
  Crown,
  EyeOff,
} from "lucide-react";
import { getHotels, deleteHotel } from "./services/hotelService";
import { getAllRooms } from "./services/roomService";
import { getMyBookings } from "./services/bookingService";
import api from "./services/api";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
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
          OK
        </button>
      </div>
    </div>
  );
};

// HOTEL MODAL
const HotelModal = ({
  showHotelModal,
  setShowHotelModal,
  editingHotel,
  hotelForm,
  setHotelForm,
  loading,
  handleCreateHotel,
  handleUpdateHotel,
}) => {
  const [localForm, setLocalForm] = useState({
    name: "",
    description: "",
    location: { address: "", city: "", country: "" },
    images: [""],
    amenities: [],
    starRating: 5,
    contact: { phone: "", email: "" },
  });

  useEffect(() => {
    if (showHotelModal) {
      if (editingHotel) {
        setLocalForm({
          name: editingHotel.name || "",
          description: editingHotel.description || "",
          location: editingHotel.location || {
            address: "",
            city: "",
            country: "",
          },
          images: editingHotel.images?.length > 0 ? editingHotel.images : [""],
          amenities: editingHotel.amenities || [],
          starRating: editingHotel.starRating || 5,
          contact: editingHotel.contact || { phone: "", email: "" },
        });
      } else {
        setLocalForm({
          name: "",
          description: "",
          location: { address: "", city: "", country: "" },
          images: [""],
          amenities: [],
          starRating: 5,
          contact: { phone: "", email: "" },
        });
      }
    }
  }, [showHotelModal, editingHotel]);

  const updateLocalForm = (field, value) => {
    setLocalForm((prev) => {
      const newForm = { ...prev };
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        newForm[parent] = { ...newForm[parent], [child]: value };
      } else {
        newForm[field] = value;
      }
      return newForm;
    });
  };

  const toggleAmenity = (amenityValue) => {
    setLocalForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityValue)
        ? prev.amenities.filter((a) => a !== amenityValue)
        : [...prev.amenities, amenityValue],
    }));
  };

  const addImageField = () => {
    setLocalForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const removeImageField = (idx) => {
    setLocalForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const updateImage = (idx, value) => {
    setLocalForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === idx ? value : img)),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setHotelForm(localForm);
    if (editingHotel) {
      handleUpdateHotel(e, localForm);
    } else {
      handleCreateHotel(e, localForm);
    }
  };

  if (!showHotelModal) return null;

  const HOTEL_AMENITIES = [
    "WiFi",
    "Parking",
    "Breakfast",
    "Pool",
    "Gym",
    "SPA",
    "AC",
    "Heating",
    "TV",
    "Entertainment",
    "Restaurant",
    "Bar",
    "Pet Friendly",
    "Family Friendly",
    "Accessible",
    "Business Center",
    "24/7 Service",
    "Security",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">
            {editingHotel ? "Edit Hotel" : "Add New Hotel"}
          </h3>
          <button
            onClick={() => setShowHotelModal(false)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Hotel Name
            </label>
            <input
              type="text"
              value={localForm.name}
              onChange={(e) => updateLocalForm("name", e.target.value)}
              className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={localForm.description}
              onChange={(e) => updateLocalForm("description", e.target.value)}
              className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none min-h-[100px]"
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Address
              </label>
              <input
                type="text"
                value={localForm.location.address}
                onChange={(e) =>
                  updateLocalForm("location.address", e.target.value)
                }
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">City</label>
              <input
                type="text"
                value={localForm.location.city}
                onChange={(e) =>
                  updateLocalForm("location.city", e.target.value)
                }
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Country
              </label>
              <input
                type="text"
                value={localForm.location.country}
                onChange={(e) =>
                  updateLocalForm("location.country", e.target.value)
                }
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone</label>
              <input
                type="tel"
                value={localForm.contact.phone}
                onChange={(e) =>
                  updateLocalForm("contact.phone", e.target.value)
                }
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={localForm.contact.email}
                onChange={(e) =>
                  updateLocalForm("contact.email", e.target.value)
                }
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Star Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateLocalForm("starRating", star)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    localForm.starRating >= star
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-white/5 text-gray-400"
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Images</label>
            <div className="space-y-2">
              {localForm.images.map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => updateImage(idx, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                  />
                  {localForm.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(idx)}
                      className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-sm hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Image URL
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">
              Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {HOTEL_AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-2 rounded-xl border transition-all text-sm ${
                    localForm.amenities.includes(amenity)
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowHotelModal(false)}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingHotel
                  ? "Update Hotel"
                  : "Create Hotel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// REVIEWS MODAL
const ReviewsModal = ({
  showReviewsModal,
  setShowReviewsModal,
  selectedHotelForReviews,
}) => {
  if (!showReviewsModal || !selectedHotelForReviews) return null;
  const reviews = selectedHotelForReviews.reviews || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold">
              Reviews: {selectedHotelForReviews.name}
            </h3>
            <p className="text-gray-400">
              {reviews.length} reviews • Average:{" "}
              {selectedHotelForReviews.averageRating}★
            </p>
          </div>
          <button
            onClick={() => setShowReviewsModal(false)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
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
                      {review.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <span className="font-medium">
                        {review.user?.name || "Unknown"}
                      </span>
                      {review.user?.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {review.user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="font-bold">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-2">{review.comment}</p>
                <p className="text-gray-500 text-xs">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
// USER MODAL
const UserModal = ({
  showUserModal,
  setShowUserModal,
  editingUser,
  userForm,
  setUserForm,
  loading,
  handleUpdateUser,
}) => {
  if (!showUserModal) return null;

  const updateForm = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Edit User</h3>
          <button
            onClick={() => setShowUserModal(false)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpdateUser} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => updateForm("name", e.target.value)}
              className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => updateForm("email", e.target.value)}
              className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Phone</label>
            <input
              type="tel"
              value={userForm.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Role</label>
            <select
              value={userForm.role}
              onChange={(e) => updateForm("role", e.target.value)}
              className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="user">User (Guest)</option>
              <option value="hotel_admin">Hotel Admin</option>
              <option value="system_admin">System Admin</option>
            </select>
          </div>

          {userForm.role === "hotel_admin" && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <input
                type="checkbox"
                id="isApproved"
                checked={userForm.isApproved}
                onChange={(e) => updateForm("isApproved", e.target.checked)}
                className="w-5 h-5 rounded border-white/10 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isApproved" className="text-sm text-gray-300">
                Approved / Active
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update User"}
            </button>
          </div>
        </form>
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
      <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded-full">
        {badge}
      </span>
    )}
  </button>
);
const Sidebar = ({
  activeTab,
  setActiveTab,
  pendingPartners,
  allUsers,
  stats,
  user,
  currentUser,
  handleSignOut,
  onEditProfile,
}) => (
  <div className="w-64 bg-slate-900/50 border-r border-white/10 p-6 flex flex-col min-h-screen h-full">
    <div className="flex items-center gap-2 mb-8">
      <Building2 className="w-8 h-8 text-cyan-400" />
      <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        System Admin
      </span>
    </div>

    <nav className="space-y-2 flex-1">
      <SidebarItem
        icon={LayoutDashboard}
        label="Dashboard"
        active={activeTab === "dashboard"}
        onClick={() => setActiveTab("dashboard")}
      />
      <SidebarItem
        icon={Building2}
        label="Manage Hotels"
        active={activeTab === "hotels"}
        onClick={() => setActiveTab("hotels")}
      />
      <SidebarItem
        icon={User}
        label="Pending Partners"
        active={activeTab === "partners"}
        onClick={() => setActiveTab("partners")}
        badge={pendingPartners.length}
      />
      <SidebarItem
        icon={Users}
        label="Manage Users"
        active={activeTab === "users"}
        onClick={() => setActiveTab("users")}
        badge={allUsers.length}
      />
      <SidebarItem
        icon={MessageSquare}
        label="All Reviews"
        active={activeTab === "reviews"}
        onClick={() => setActiveTab("reviews")}
        badge={stats.totalReviews}
      />
      <SidebarItem
        icon={TrendingUp}
        label="Reports"
        active={activeTab === "reports"}
        onClick={() => setActiveTab("reports")}
      />
    </nav>

    <div className="pt-6 border-t border-white/10">
      <button
        onClick={onEditProfile}
        className="flex items-center gap-3 mb-4 w-full hover:bg-white/5 p-2 rounded-xl transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold overflow-hidden">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt="avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : null}
          <span
            className={`${currentUser?.avatar ? "hidden" : "flex"} items-center justify-center w-full h-full`}
          >
            {currentUser?.name?.charAt(0) || "S"}
          </span>
        </div>
        <div className="text-left">
          <p className="font-medium text-sm">
            {currentUser?.name || "System Admin"}
          </p>
          <p className="text-xs text-purple-400">Edit Profile</p>
        </div>
      </button>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm w-full"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  </div>
);
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    cyan: "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400",
    purple:
      "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
    pink: "from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400",
    green:
      "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} backdrop-blur-xl rounded-2xl p-6 border`}
    >
      <Icon className="w-8 h-8 mb-3" />
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};
const DashboardView = ({ stats, hotels, allReviews }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">System Dashboard</h2>

    <div className="grid md:grid-cols-2 gap-4">
      <StatCard
        icon={Building2}
        label="Total Hotels"
        value={stats.totalHotels}
        color="cyan"
      />
      <StatCard
        icon={Star}
        label="Avg Rating"
        value={`${stats.averageRating}★`}
        color="pink"
      />
    </div>

    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-400" /> Reviews Overview
      </h3>
      {hotels.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No hotels available.</p>
      ) : (
        <div className="space-y-4">
          {hotels.map((hotel) => (
            <div
              key={hotel._id}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <img
                src={
                  hotel.images?.[0] ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                }
                alt={hotel.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h4 className="font-bold text-white">{hotel.name}</h4>
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {hotel.location?.city},{" "}
                  {hotel.location?.country}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                  <Star className="w-5 h-5 fill-yellow-400" />
                  {hotel.averageRating || hotel.starRating || 0}
                </div>
                <p className="text-gray-400 text-sm">
                  {hotel.reviewCount || 0} reviews
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-cyan-400" /> Recent Reviews
      </h3>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {allReviews.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No reviews yet.</p>
        ) : (
          allReviews.slice(0, 10).map((review, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-xl"
            >
              <img
                src={
                  review.hotelImage ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                }
                alt={review.hotelName}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-cyan-400">
                      {review.hotelName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
                        {review.user?.name?.charAt(0) || "U"}
                      </div>
                      <span className="text-xs text-gray-300">
                        {review.user?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    {review.rating}
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                  {review.comment}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);
const HotelsView = ({
  hotels,
  openViewReviews,
  openEditHotel,
  handleDeleteHotel,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHotels = useMemo(
    () =>
      hotels.filter(
        (h) =>
          h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.location.city.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [hotels, searchQuery],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Hotels</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search hotels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
        />
      </div>

      <div className="grid gap-4">
        {filteredHotels.map((hotel) => (
          <div
            key={hotel._id}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={
                  hotel.images[0] ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                }
                alt={hotel.name}
                className="w-full md:w-48 h-32 object-cover rounded-xl"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold">{hotel.name}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {hotel.location.city},{" "}
                      {hotel.location.country}
                    </p>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" /> Owner:{" "}
                      {hotel.owner?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openViewReviews(hotel)}
                      className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors"
                      title="View Reviews"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHotel(hotel._id)}
                      className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {hotel.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {hotel.amenities?.slice(0, 5).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300"
                    >
                      {amenity}
                    </span>
                  ))}
                  {hotel.amenities?.length > 5 && (
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
                      +{hotel.amenities.length - 5} more
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" />{" "}
                    {hotel.averageRating || hotel.starRating} (
                    {hotel.reviewCount || 0} reviews)
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-cyan-400 font-medium">
                    {hotel.starRating}-Star
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-400 font-medium">
                    {hotel.roomCount || 0} rooms
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const PartnersView = ({
  pendingPartners,
  handleRejectPartner,
  handleApprovePartner,
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Pending Hotel Partners</h2>
      <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm">
        {pendingPartners.length} Pending
      </span>
    </div>

    {pendingPartners.length === 0 ? (
      <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <p className="text-gray-400">No pending partner applications.</p>
      </div>
    ) : (
      <div className="grid gap-4">
        {pendingPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-lg font-bold">
                  {partner.name?.charAt(0) || "P"}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{partner.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" /> {partner.email}
                    </span>
                    {partner.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" /> {partner.phone}
                      </span>
                    )}
                    {partner.hotelName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {partner.hotelName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                    {partner.propertyLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{" "}
                        {partner.propertyLocation}
                      </span>
                    )}
                    {partner.businessLicense && (
                      <span>📋 License: {partner.businessLicense}</span>
                    )}
                    {partner.taxInformation && (
                      <span>🧾 TIN: {partner.taxInformation}</span>
                    )}
                    {partner.numberOfUnits && (
                      <span>🏨 Units: {partner.numberOfUnits}</span>
                    )}
                    {partner.validId && (
                      <a
                        href={partner.validId}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        <Eye className="w-3 h-3" /> View Valid ID
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Applied: {new Date(partner.appliedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleRejectPartner(partner.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleApprovePartner(partner)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Create Account
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
const ReviewsView = ({ stats, allReviews }) => {
  const [reviewFilter, setReviewFilter] = useState("all");
  const [searchReview, setSearchReview] = useState("");

  const filteredReviews = allReviews.filter((review) => {
    const matchesSearch =
      review.hotelName?.toLowerCase().includes(searchReview.toLowerCase()) ||
      review.user?.name?.toLowerCase().includes(searchReview.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchReview.toLowerCase());
    if (reviewFilter === "positive") return matchesSearch && review.rating >= 4;
    if (reviewFilter === "negative") return matchesSearch && review.rating <= 2;
    return matchesSearch;
  });

  const reviewStats = {
    total: allReviews.length,
    fiveStar: allReviews.filter((r) => r.rating === 5).length,
    fourStar: allReviews.filter((r) => r.rating === 4).length,
    threeStar: allReviews.filter((r) => r.rating === 3).length,
    twoStar: allReviews.filter((r) => r.rating === 2).length,
    oneStar: allReviews.filter((r) => r.rating === 1).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">All Reviews & Experiences</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm">
            {stats.totalReviews} Total
          </span>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm">
            {stats.averageRating}★ Avg
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[5, 4, 3, 2, 1].map((stars) => (
          <div key={stars} className="bg-white/5 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{stars}</span>
            </div>
            <p className="text-2xl font-bold text-gray-400">
              {stars === 5
                ? reviewStats.fiveStar
                : stars === 4
                  ? reviewStats.fourStar
                  : stars === 3
                    ? reviewStats.threeStar
                    : stars === 2
                      ? reviewStats.twoStar
                      : reviewStats.oneStar}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchReview}
            onChange={(e) => setSearchReview(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
          />
        </div>
        <select
          value={reviewFilter}
          onChange={(e) => setReviewFilter(e.target.value)}
          className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Reviews</option>
          <option value="positive">Positive (4-5★)</option>
          <option value="negative">Negative (1-2★)</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review, idx) => (
          <div
            key={idx}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={
                  review.hotelImage ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                }
                alt={review.hotelName}
                className="w-full md:w-32 h-24 object-cover rounded-xl"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-cyan-400">
                      {review.hotelName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                        {review.user?.name?.charAt(0) || "U"}
                      </div>
                      <span className="text-sm text-gray-300">
                        {review.user?.name || "Unknown User"}
                      </span>
                      {review.user?.phone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {review.user.phone}
                        </span>
                      )}
                      <span className="text-gray-600">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                      review.rating >= 4
                        ? "bg-green-500/20 text-green-400"
                        : review.rating === 3
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold">{review.rating}.0</span>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3">
                  {review.comment}
                </p>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                    <ThumbsUp className="w-4 h-4" /> Helpful
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors">
                    <Flag className="w-4 h-4" /> Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              No reviews found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
const UsersView = ({
  allUsers,
  getRoleBadge,
  openEditUser,
  handleDeleteUser,
}) => {
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");

  const filteredUsers = useMemo(() => {
    let filtered = allUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(userSearchQuery.toLowerCase()),
    );

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortFilter === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortFilter === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortFilter === "name_az")
        return (a.name || "").localeCompare(b.name || "");
      if (sortFilter === "name_za")
        return (b.name || "").localeCompare(a.name || "");
      return 0;
    });

    return filtered;
  }, [allUsers, userSearchQuery, roleFilter, sortFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Users</h2>
        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm">
          {allUsers.length} Total
        </span>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="hotel_admin">Hotel Admins</option>
          <option value="system_admin">System Admins</option>
        </select>
        <select
          value={sortFilter}
          onChange={(e) => setSortFilter(e.target.value)}
          className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_az">Name A-Z</option>
          <option value="name_za">Name Z-A</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((userData) => {
          const roleBadge = getRoleBadge(userData.role);
          const RoleIcon = roleBadge.icon;

          return (
            <div
              key={userData._id}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-lg font-bold">
                    {userData.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{userData.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" /> {userData.email}
                      </span>
                      {userData.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" /> {userData.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${roleBadge.color}`}
                      >
                        <RoleIcon className="w-3 h-3" /> {roleBadge.label}
                      </span>
                      {userData.role === "hotel_admin" && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs border ${
                            userData.isApproved
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                          }`}
                        >
                          {userData.isApproved ? "Approved" : "Pending"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteUser(userData._id)}
                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
const ReportsView = ({
  stats,
  hotels,
  allReviews,
  allUsers,
  bookings,
  pendingPartners,
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("System Administration Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Platform Stats
    doc.setFontSize(14);
    doc.text("Platform Overview", 14, 45);
    doc.setFontSize(11);
    doc.text(`Total Hotels: ${stats.totalHotels}`, 14, 55);
    doc.text(`Total Rooms: ${stats.totalRooms}`, 14, 63);
    doc.text(`Total Reviews: ${stats.totalReviews}`, 14, 71);
    doc.text(`Average Rating: ${stats.averageRating} stars`, 14, 79);
    doc.text(`Pending Partners: ${pendingPartners.length}`, 14, 87);

    // Hotels Table
    doc.setFontSize(14);
    doc.text("All Hotels", 14, 102);

    const hotelData = hotels.map((h) => [
      h.name,
      h.location?.city || "",
      h.starRating,
      h.averageRating || h.starRating || 0,
      h.reviewCount || 0,
      h.roomCount || 0,
    ]);

    autoTable(doc, {
      startY: 108,
      head: [["Hotel Name", "City", "Stars", "Rating", "Reviews", "Rooms"]],
      body: hotelData,
      theme: "striped",
      headStyles: { fillColor: [6, 182, 212] },
    });

    // Users Table
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("User Accounts", 14, finalY);

    const userData = allUsers.map((u) => [
      u.name,
      u.email,
      u.role,
      u.role === "system_admin"
        ? "Active"
        : u.isApproved
          ? "Active"
          : "Pending",
    ]);

    autoTable(doc, {
      startY: finalY + 6,
      head: [["Name", "Email", "Role", "Status"]],
      body: userData,
      theme: "striped",
      headStyles: { fillColor: [168, 85, 247] },
    });

    doc.save(`system-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Generate System Report</h2>
        <button
          onClick={generatePDF}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white hover:shadow-lg transition-all"
        >
          <TrendingUp className="w-5 h-5" /> Download PDF
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          label="Total Hotels"
          value={stats.totalHotels}
          color="cyan"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={allUsers.length}
          color="purple"
        />
        <StatCard
          icon={MessageSquare}
          label="Total Reviews"
          value={stats.totalReviews}
          color="pink"
        />
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold mb-4">Report Preview</h3>
        <div className="space-y-4 text-gray-400">
          <p>This system report will include:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Platform statistics (hotels, rooms, reviews, ratings)</li>
            <li>Complete hotels directory with ratings</li>
            <li>All registered user accounts</li>
            <li>Pending partner applications count</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
const SystemAdminProfileModal = ({
  show,
  onClose,
  currentUser,
  onPhotoUpload,
  uploadingPhoto,
  fileInputRef,
  api,
  showAlert,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && currentUser) {
      setForm({ name: currentUser.name || "", phone: currentUser.phone || "" });
    }
  }, [show, currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/me", {
        name: form.name,
        phone: form.phone,
      });
      if (res.data.success) {
        showAlert("Success", "Profile updated successfully", "success");
        onClose(res.data.data);
      }
    } catch (err) {
      showAlert("Error", err.response?.data?.error || "Failed to update");
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return showAlert("Error", "Passwords do not match");
    setLoading(true);
    try {
      const res = await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data.success) {
        showAlert("Success", "Password changed successfully", "success");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      showAlert(
        "Error",
        err.response?.data?.error || "Failed to change password",
      );
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">My Profile</h3>
          <button
            onClick={() => onClose(null)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl ${activeTab === "profile" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400"}`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-4 py-2 rounded-xl ${activeTab === "password" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400"}`}
          >
            Change Password
          </button>
        </div>
        {activeTab === "profile" ? (
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="flex justify-center mb-4">
              <div
                className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-2xl font-bold relative overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : null}
                <span
                  className={`${currentUser?.avatar ? "hidden" : "flex"} items-center justify-center w-full h-full`}
                >
                  {form.name?.charAt(0) || "A"}
                </span>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingPhoto ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <User className="w-6 h-6 text-white" />
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
              <label className="block text-sm text-gray-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update Profile"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                  className="w-full p-3 pr-10 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrentPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password"
                  className="w-full p-3 pr-10 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  className="w-full p-3 pr-10 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-white disabled:opacity-50"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
const SystemAdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [pendingPartners, setPendingPartners] = useState([]);

  useEffect(() => {
    fetchPendingPartners();
  }, []);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    isApproved: true,
  });

  const fetchPendingPartners = async () => {
    try {
      const response = await api.get("/auth/pending-hotel-admins");
      if (response.data.success) {
        // Map backend format to frontend format
        const mapped = response.data.data.map((user) => ({
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          hotelName: user.hotelName,
          hotelAddress: user.hotelAddress,
          hotelCity: user.hotelCity,
          hotelCountry: user.hotelCountry,
          propertyLocation: user.propertyLocation,
          businessLicense: user.businessLicense,
          taxInformation: user.taxInformation,
          numberOfUnits: user.numberOfUnits,
          validId: user.validId,
          appliedAt: user.createdAt,
        }));
        setPendingPartners(mapped);
        localStorage.setItem("pendingPartners", JSON.stringify(mapped));
      }
    } catch (err) {
      console.error("Failed to fetch pending partners", err);
      // Fallback to localStorage
      const stored = JSON.parse(localStorage.getItem("pendingPartners")) || [];
      setPendingPartners(stored);
    }
  };
  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/auth/all-users");
      if (response.data.success) {
        setAllUsers(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
      showAlert("Error", "Failed to fetch users");
    }
  };
  // Modal states
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [selectedHotelForReviews, setSelectedHotelForReviews] = useState(null);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef(null);

  const [hotelForm, setHotelForm] = useState({
    name: "",
    description: "",
    location: { address: "", city: "", country: "" },
    images: [""],
    amenities: [],
    starRating: 5,
    contact: { phone: "", email: "" },
  });

  useEffect(() => {
    fetchData();
    fetchAllUsers();
  }, [activeTab]);
  useEffect(() => {
    // Restore avatar immediately from cache before API call
    const cachedAvatar = localStorage.getItem("systemAdminAvatar");
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    if (cachedAvatar) {
      setCurrentUser((prev) => ({ ...prev, ...stored, avatar: cachedAvatar }));
    } else if (stored.avatar) {
      setCurrentUser((prev) => ({ ...prev, avatar: stored.avatar }));
    }
    fetchCurrentUser();
  }, []);

  // Real-time polling for pending partners, users, and reviews
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingPartners();
      fetchAllUsers();
      fetchData(); // Re-fetches hotels which includes nested reviews
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);
  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data.success) {
        const userData = res.data.data;
        let avatarUrl = userData.avatar || "";
        if (avatarUrl && !avatarUrl.startsWith("http")) {
          let baseUrl = api.defaults.baseURL || window.location.origin;
          baseUrl = baseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
          avatarUrl = baseUrl + "/" + avatarUrl.replace(/^\//, "");
        }
        // Cache bust to always show latest
        if (avatarUrl) avatarUrl = avatarUrl.split("?")[0] + "?t=" + Date.now();
        const updated = { ...userData, avatar: avatarUrl };
        setCurrentUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        // Persist avatar separately so it survives logout/login
        if (avatarUrl) localStorage.setItem("systemAdminAvatar", avatarUrl);
      }
    } catch (err) {
      console.error("Failed to fetch current user", err);
      // On error, restore avatar from localStorage
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const cachedAvatar = localStorage.getItem("systemAdminAvatar");
      if (cachedAvatar)
        setCurrentUser((prev) => ({ ...prev, avatar: cachedAvatar }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return showAlert("File Too Large", "Photo must be less than 5MB");
    if (!file.type.startsWith("image/"))
      return showAlert("Invalid File", "Please upload an image");
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      setUploadingPhoto(true);
      const response = await api.put("/auth/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        let avatarUrl = response.data.data.avatar;
        if (avatarUrl && !avatarUrl.startsWith("http")) {
          let baseUrl = api.defaults.baseURL || window.location.origin;
          baseUrl = baseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
          avatarUrl = baseUrl + "/" + avatarUrl.replace(/^\//, "");
        }
        const newAvatarUrl = avatarUrl + "?t=" + Date.now();
        setCurrentUser((prev) => ({ ...prev, avatar: newAvatarUrl }));
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, avatar: newAvatarUrl }),
        );
        showAlert("Success", "Profile photo updated", "success");
      }
    } catch (err) {
      showAlert("Error", err.response?.data?.error || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const hotelsRes = await getHotels();
      if (hotelsRes.success) setHotels(hotelsRes.data);

      const bookingsRes = await getMyBookings();
      if (bookingsRes.success) setBookings(bookingsRes.data);

      const allRoomsRes = await getAllRooms();
      if (allRoomsRes.success) setRooms(allRoomsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message, type = "error") => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () =>
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
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

  // AUTO-CREATE HOTEL ADMIN ACCOUNT AFTER APPROVAL
  const createHotelAdminAccount = async (partnerData) => {
    try {
      // Generate a temporary password
      const tempPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);

      const adminData = {
        name: partnerData.name,
        email: partnerData.email,
        password: tempPassword,
        role: "hotel_admin",
        hotelId: partnerData.hotelId || null,
        phone: partnerData.phone || "",
        status: "active",
      };

      const response = await api.post("/auth/register-hotel-admin", adminData);

      if (response.data.success) {
        // Send email notification with credentials
        await api.post("/notifications/send-credentials", {
          email: partnerData.email,
          name: partnerData.name,
          password: tempPassword,
          role: "Hotel Administrator",
        });

        return { success: true, tempPassword };
      }
    } catch (err) {
      console.error("Failed to create hotel admin account:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Failed to create account",
      };
    }
  };

  const handleApprovePartner = async (partner) => {
    try {
      setLoading(true);

      // Approve via backend API
      const response = await api.put(
        `/auth/approve-hotel-admin/${partner._id || partner.id}`,
      );

      if (response.data.success) {
        // Remove from pending
        const updated = pendingPartners.filter(
          (p) => p.id !== partner.id && p._id !== partner._id,
        );
        setPendingPartners(updated);
        localStorage.setItem("pendingPartners", JSON.stringify(updated));

        Swal.fire({
          icon: "success",
          title: "Approved!",
          html: `Hotel admin account approved for <b>${partner.name}</b>.<br>Temporary password: <b>${response.data.data.tempPassword}</b>`,
          confirmButtonColor: "#06b6d4",
        });
      } else {
        showAlert("Error", response.data.error || "Failed to approve partner");
      }
    } catch (err) {
      showAlert(
        "Error",
        err.response?.data?.error || "Failed to approve partner",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPartner = (id) => {
    const updated = pendingPartners.filter((p) => p.id !== id);
    setPendingPartners(updated);
    localStorage.setItem("pendingPartners", JSON.stringify(updated));
    Swal.fire("Rejected", "Application has been removed.", "info");
  };
  // USER CRUD
  const openEditUser = (userData) => {
    setEditingUser(userData);
    setUserForm({
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
      role: userData.role || "user",
      isApproved: userData.isApproved !== false,
    });
    setShowUserModal(true);
  };

  const resetUserForm = () => {
    setUserForm({
      name: "",
      email: "",
      phone: "",
      role: "user",
      isApproved: true,
    });
    setEditingUser(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put(
        `/auth/users/${editingUser._id}`,
        userForm,
      );
      if (response.data.success) {
        showAlert("Success", "User updated successfully", "success");
        setShowUserModal(false);
        resetUserForm();
        fetchAllUsers();
      }
    } catch (err) {
      showAlert("Error", err.response?.data?.error || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete!",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await api.delete(`/auth/users/${userId}`);
      showAlert("Success", "User deleted successfully", "success");
      fetchAllUsers();
    } catch (err) {
      showAlert("Error", err.response?.data?.error || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "system_admin":
        return {
          color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
          icon: Crown,
          label: "System Admin",
        };
      case "hotel_admin":
        return {
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
          icon: Shield,
          label: "Hotel Admin",
        };
      default:
        return {
          color: "text-green-400 bg-green-500/10 border-green-500/30",
          icon: User,
          label: "User",
        };
    }
  };

  // HOTEL CRUD
  const handleCreateHotel = async (e, localForm) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post("/hotels", localForm || hotelForm);
      if (response.data.success) {
        showAlert("Success", "Hotel created successfully", "success");
        setShowHotelModal(false);
        resetHotelForm();
        fetchData();
      }
    } catch (err) {
      showAlert("Error", err.response?.data?.error || "Failed to create hotel");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHotel = async (e, localForm) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put(
        `/hotels/${editingHotel._id}`,
        localForm || hotelForm,
      );
      if (response.data.success) {
        showAlert("Success", "Hotel updated successfully", "success");
        setShowHotelModal(false);
        setEditingHotel(null);
        resetHotelForm();
        fetchData();
      }
    } catch (err) {
      showAlert("Error", err.response?.data?.error || "Failed to update hotel");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this hotel? This will also delete all its rooms.",
      )
    )
      return;
    try {
      setLoading(true);
      await deleteHotel(hotelId);
      showAlert("Success", "Hotel deleted successfully", "success");
      fetchData();
    } catch (err) {
      showAlert("Error", "Failed to delete hotel");
    } finally {
      setLoading(false);
    }
  };

  const resetHotelForm = () => {
    setHotelForm({
      name: "",
      description: "",
      location: { address: "", city: "", country: "" },
      images: [""],
      amenities: [],
      starRating: 5,
      contact: { phone: "", email: "" },
    });
  };

  const openEditHotel = (hotel) => {
    setEditingHotel(hotel);
    setHotelForm({
      name: hotel.name,
      description: hotel.description,
      location: hotel.location,
      images: hotel.images.length > 0 ? hotel.images : [""],
      amenities: hotel.amenities || [],
      starRating: hotel.starRating,
      contact: hotel.contact || { phone: "", email: "" },
    });
    setShowHotelModal(true);
  };

  const openViewReviews = (hotel) => {
    setSelectedHotelForReviews(hotel);
    setShowReviewsModal(true);
  };

  // STATS
  const stats = useMemo(() => {
    const totalRevenue = bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const totalRooms = hotels.reduce((sum, h) => sum + (h.roomCount || 0), 0);
    const totalReviews = hotels.reduce(
      (sum, h) => sum + (h.reviewCount || 0),
      0,
    );
    const averageRating =
      hotels.length > 0
        ? (
            hotels.reduce((sum, h) => sum + (h.averageRating || 0), 0) /
            hotels.length
          ).toFixed(1)
        : 0;

    return {
      totalHotels: hotels.length,
      totalRooms,
      totalBookings: bookings.length,
      totalRevenue,
      totalReviews,
      averageRating,
      cancelledBookings: bookings.filter((b) => b.status === "cancelled")
        .length,
      confirmedBookings: bookings.filter((b) => b.status === "confirmed")
        .length,
    };
  }, [hotels, bookings]);

  const allReviews = useMemo(() => {
    const reviews = [];
    hotels.forEach((hotel) => {
      if (hotel.reviews?.length > 0) {
        hotel.reviews.forEach((review) => {
          reviews.push({
            ...review,
            hotelId: hotel._id,
            hotelName: hotel.name,
            hotelImage: hotel.images?.[0],
          });
        });
      }
    });
    return reviews.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [hotels]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      <SystemAdminProfileModal
        show={showProfile}
        onClose={(updatedUser) => {
          setShowProfile(false);
          if (updatedUser)
            setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
        }}
        currentUser={currentUser}
        onPhotoUpload={handlePhotoUpload}
        uploadingPhoto={uploadingPhoto}
        fileInputRef={fileInputRef}
        api={api}
        showAlert={showAlert}
      />
      <HotelModal
        showHotelModal={showHotelModal}
        setShowHotelModal={setShowHotelModal}
        editingHotel={editingHotel}
        hotelForm={hotelForm}
        setHotelForm={setHotelForm}
        loading={loading}
        handleCreateHotel={handleCreateHotel}
        handleUpdateHotel={handleUpdateHotel}
      />
      <ReviewsModal
        showReviewsModal={showReviewsModal}
        setShowReviewsModal={setShowReviewsModal}
        selectedHotelForReviews={selectedHotelForReviews}
      />
      <UserModal
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        editingUser={editingUser}
        userForm={userForm}
        setUserForm={setUserForm}
        loading={loading}
        handleUpdateUser={handleUpdateUser}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingPartners={pendingPartners}
        allUsers={allUsers}
        stats={stats}
        user={user}
        currentUser={currentUser}
        handleSignOut={handleSignOut}
        onEditProfile={() => setShowProfile(true)}
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              stats={stats}
              hotels={hotels}
              allReviews={allReviews}
            />
          )}
          {activeTab === "hotels" && (
            <HotelsView
              hotels={hotels}
              openViewReviews={openViewReviews}
              openEditHotel={openEditHotel}
              handleDeleteHotel={handleDeleteHotel}
            />
          )}
          {activeTab === "partners" && (
            <PartnersView
              pendingPartners={pendingPartners}
              handleRejectPartner={handleRejectPartner}
              handleApprovePartner={handleApprovePartner}
            />
          )}
          {activeTab === "users" && (
            <UsersView
              allUsers={allUsers}
              getRoleBadge={getRoleBadge}
              openEditUser={openEditUser}
              handleDeleteUser={handleDeleteUser}
            />
          )}
          {activeTab === "reviews" && (
            <ReviewsView stats={stats} allReviews={allReviews} />
          )}
          {activeTab === "reports" && (
            <ReportsView
              stats={stats}
              hotels={hotels}
              allReviews={allReviews}
              allUsers={allUsers}
              bookings={bookings}
              pendingPartners={pendingPartners}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemAdminDashboard;
