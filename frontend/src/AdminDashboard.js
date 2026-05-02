import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Building2, BedDouble, Calendar, Star,
  LogOut, Plus, Edit2, Trash2, X, ChevronLeft, Users,
  MapPin, Phone, Mail, Search, Filter, DollarSign,
  TrendingUp, AlertCircle, Check, Image as ImageIcon,
  Wifi, Car, Coffee, Waves, Dumbbell, Sparkles, Wind,
  Thermometer, Tv, Music, UtensilsCrossed, Wine, PawPrint,
  Baby, Accessibility, Briefcase, Clock, Shield, MessageSquare,
  ThumbsUp, Flag, Eye, User, Download, FileText, BarChart3,
  PhilippinePeso
} from 'lucide-react';
import { getHotels, deleteHotel } from './services/hotelService';
import { getHotelRooms, getAllRooms, deleteRoom } from './services/roomService';
import { getMyBookings, cancelBooking, deleteBooking } from './services/bookingService';
import api from './services/api';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== CONSTANTS ====================
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

// ==================== STANDALONE COMPONENTS (no state dependency) ====================

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
const HotelModal = ({ isOpen, onClose, onSubmit, editingHotel, hotelForm, setHotelForm }) => {
  if (!isOpen) return null;

  const handleAmenityToggle = (amenityValue) => {
    setHotelForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityValue)
        ? prev.amenities.filter(a => a !== amenityValue)
        : [...prev.amenities, amenityValue]
    }));
  };

  const addImageField = () => {
    setHotelForm(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    setHotelForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const updateImage = (index, value) => {
    setHotelForm(prev => {
      const newImages = [...prev.images];
      newImages[index] = value;
      return { ...prev, images: newImages };
    });
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</h3>
              <p className="text-gray-400 text-sm">{editingHotel ? 'Update hotel details' : 'Create a new hotel listing'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hotel Name *</label>
            <input type="text" required value={hotelForm.name}
              onChange={(e) => setHotelForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
              placeholder="Enter hotel name" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea rows={3} value={hotelForm.description}
              onChange={(e) => setHotelForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white resize-none"
              placeholder="Describe your hotel..." />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Address</label>
              <input type="text" value={hotelForm.location.address}
                onChange={(e) => setHotelForm(prev => ({ ...prev, location: { ...prev.location, address: e.target.value } }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                placeholder="Street address" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">City *</label>
              <input type="text" required value={hotelForm.location.city}
                onChange={(e) => setHotelForm(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                placeholder="City" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Country *</label>
              <input type="text" required value={hotelForm.location.country}
                onChange={(e) => setHotelForm(prev => ({ ...prev, location: { ...prev.location, country: e.target.value } }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                placeholder="Country" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Star Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button"
                  onClick={() => setHotelForm(prev => ({ ...prev, starRating: star }))}
                  className={`p-2 rounded-lg transition-all ${star <= hotelForm.starRating ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-600 hover:text-yellow-400'}`}>
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone</label>
              <input type="tel" value={hotelForm.contact.phone}
                onChange={(e) => setHotelForm(prev => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                placeholder="+63..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input type="email" value={hotelForm.contact.email}
                onChange={(e) => setHotelForm(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                placeholder="hotel@email.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Amenities</label>
            <div className="grid grid-cols-3 gap-2">
              {HOTEL_AMENITIES.map(({ icon: Icon, label, value }) => (
                <button key={value} type="button" onClick={() => handleAmenityToggle(value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${hotelForm.amenities.includes(value)
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}>
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Images</label>
            <div className="space-y-2">
              {hotelForm.images.map((img, index) => (
                <div key={index} className="flex gap-2">
                  <input type="url" value={img}
                    onChange={(e) => updateImage(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white text-sm"
                    placeholder="https://example.com/image.jpg" />
                  {hotelForm.images.length > 1 && (
                    <button type="button" onClick={() => removeImageField(index)}
                      className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addImageField}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:bg-white/10 transition-colors">
                <Plus className="w-4 h-4" /> Add Image URL
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">Cancel</button>
            <button type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all">
              {editingHotel ? 'Update Hotel' : 'Create Hotel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RoomModal = ({ isOpen, onClose, onSubmit, editingRoom, roomForm, setRoomForm, selectedHotel }) => {
  if (!isOpen) return null;

  const handleAmenityToggle = (amenity) => {
    setRoomForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addImageField = () => {
    setRoomForm(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    setRoomForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const updateImage = (index, value) => {
    setRoomForm(prev => {
      const newImages = [...prev.images];
      newImages[index] = value;
      return { ...prev, images: newImages };
    });
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <p className="text-gray-400 text-sm">{selectedHotel?.name || 'Select a hotel'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Number *</label>
              <input type="text" required value={roomForm.roomNumber}
                onChange={(e) => setRoomForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                placeholder="e.g. 101, A-1" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Type *</label>
              <select required value={roomForm.type}
                onChange={(e) => setRoomForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white">
                {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Price per Night (PHP) *</label>
              <input type="number" required min="1" value={roomForm.pricePerNight}
                onChange={(e) => setRoomForm(prev => ({ ...prev, pricePerNight: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Capacity (Guests) *</label>
              <select required value={roomForm.capacity}
                onChange={(e) => setRoomForm(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white">
                {GUEST_OPTIONS.map(n => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea rows={3} value={roomForm.description}
              onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white resize-none"
              placeholder="Describe the room..." />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Room Amenities</label>
            <div className="grid grid-cols-3 gap-2">
              {['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Sea View', 'City View', 'Bathtub', 'Kitchenette'].map(amenity => (
                <button key={amenity} type="button" onClick={() => handleAmenityToggle(amenity)}
                  className={`px-3 py-2 rounded-xl border transition-all text-sm ${roomForm.amenities.includes(amenity)
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}>
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2"></label>
            <div className="space-y-2">
              {roomForm.images.map((img, index) => (
                <div key={index} className="flex gap-2">

                  {roomForm.images.length > 1 && (
                    <button type="button" onClick={() => removeImageField(index)}
                      className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">Cancel</button>
            <button type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all">
              {editingRoom ? 'Update Room' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const ReportModal = ({ isOpen, onClose, hotels, rooms, bookings, stats }) => {
  const [reportType, setReportType] = useState('summary');
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // HEADER
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(34, 211, 238);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('AI STAY', margin, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Admin Dashboard Report', margin, 26);
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 32);
      yPos = 45;

      // SUMMARY
      if (reportType === 'summary' || reportType === 'all') {
        doc.setTextColor(34, 211, 238);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Executive Summary', margin, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: [
            ['Total Hotels', stats.totalHotels.toString()],
            ['Total Rooms', stats.totalRooms.toString()],
            ['Total Bookings', stats.totalBookings.toString()],
            ['Total Revenue', `PHP ${stats.totalRevenue.toLocaleString('en-US')}`],
            ['Total Reviews', stats.totalReviews.toString()],
            ['Average Rating', `${stats.averageRating} / 5`],
            ['Confirmed Bookings', stats.confirmedBookings.toString()],
            ['Cancelled Bookings', stats.cancelledBookings.toString()],
          ],
          theme: 'grid',
          headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 10, cellPadding: 4 },
          margin: { left: margin, right: margin }
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // HOTELS
      if (reportType === 'hotels' || reportType === 'all') {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setTextColor(34, 211, 238);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Hotels Directory', margin, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Hotel Name', 'Location', 'Rating', 'Rooms', 'Avg Score', 'Reviews', 'Price/Night']],
          body: hotels.map(h => [
            h.name,
            `${h.location.city}, ${h.location.country}`,
            `${h.starRating} / 5`,
            h.roomCount || 0,
            h.averageRating || h.starRating,
            h.reviewCount || 0,
            `PHP ${(h.starRating * 500).toLocaleString('en-US')}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: margin, right: margin }
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // BOOKINGS
      if (reportType === 'bookings' || reportType === 'all') {
        if (yPos > 220) { doc.addPage(); yPos = 20; }
        doc.setTextColor(34, 211, 238);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Booking Records', margin, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Hotel', 'Guest', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Total', 'Status']],
          body: bookings.map(b => {
            const nights = Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24));
            return [
              b.hotel?.name || 'N/A',
              b.user?.name || 'Guest',
              new Date(b.checkInDate).toLocaleDateString(),
              new Date(b.checkOutDate).toLocaleDateString(),
              nights.toString(),
              b.guests.toString(),
              `PHP ${(b.totalPrice || 0).toLocaleString('en-US')}`,
              (b.status || 'unknown').toUpperCase()
            ];
          }),
          theme: 'grid',
          headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 8, cellPadding: 3 },
          margin: { left: margin, right: margin },
          didParseCell: (data) => {
            if (data.column.index === 7) {
              const status = data.cell.raw;
              if (status === 'CONFIRMED') data.cell.styles.textColor = [34, 197, 94];
              else if (status === 'CANCELLED') data.cell.styles.textColor = [239, 68, 68];
            }
          }
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // REVENUE
      if (reportType === 'revenue' || reportType === 'all') {
        if (yPos > 220) { doc.addPage(); yPos = 20; }
        doc.setTextColor(34, 211, 238);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Revenue Analysis', margin, yPos);
        yPos += 8;

        const revenueByHotel = {};
        bookings.filter(b => b.status && b.status.toLowerCase() === 'confirmed').forEach(b => {
          const name = b.hotel?.name || 'Unknown';
          revenueByHotel[name] = (revenueByHotel[name] || 0) + (b.totalPrice || 0);
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Hotel', 'Revenue']],
          body: Object.entries(revenueByHotel)
            .sort((a, b) => b[1] - a[1])
            .map(([name, amount]) => [name, `PHP ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]),
          theme: 'grid',
          headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 10, cellPadding: 4 },
          margin: { left: margin, right: margin }
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // FOOTER
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 287, { align: 'center' });
        doc.text('AI STAY Admin Dashboard - Confidential', margin, 287);
      }

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`AI-STAY-Report-${reportType}-${timestamp}.pdf`);

      Swal.fire({ icon: 'success', title: 'Report Generated!', text: `Your ${reportType} report has been downloaded.`, timer: 2000, showConfirmButton: false });
    } catch (err) {
      console.error('PDF generation failed:', err);
      Swal.fire({ icon: 'error', title: 'Generation Failed', text: 'Could not generate PDF report.' });
    } finally {
      setGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Generate Report</h3>
              <p className="text-gray-400 text-sm">Export dashboard data to PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'summary', label: 'Summary', icon: BarChart3 },
                { value: 'hotels', label: 'Hotels', icon: Building2 },
                { value: 'bookings', label: 'Bookings', icon: Calendar },
                { value: 'revenue', label: 'Revenue', icon: PhilippinePeso },
                { value: 'all', label: 'Complete Report', icon: FileText },
              ].map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setReportType(value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${reportType === value ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Preview</p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between"><span>Hotels:</span><span className="text-cyan-400 font-medium">{hotels.length}</span></div>
              <div className="flex justify-between"><span>Rooms:</span><span className="text-cyan-400 font-medium">{rooms.length}</span></div>
              <div className="flex justify-between"><span>Bookings:</span><span className="text-cyan-400 font-medium">{bookings.length}</span></div>
              <div className="flex justify-between"><span>Revenue:</span><span className="text-green-400 font-medium">₱{stats.totalRevenue.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">
              Cancel
            </button>
            <button onClick={generatePDF} disabled={generating}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4" /> Generate PDF</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN DASHBOARD ====================

const AdminDashboard = ({ user, onLogout }) => {
  // ---- STATE HOOKS (top level) ----
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingPartners, setPendingPartners] = useState([]);

  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);
  const [selectedHotelForReviews, setSelectedHotelForReviews] = useState(null);

  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const [hotelForm, setHotelForm] = useState({
    name: '', description: '', location: { address: '', city: '', country: '' },
    images: [''], amenities: [], starRating: 5, contact: { phone: '', email: '' }
  });

  const [roomForm, setRoomForm] = useState({
    hotel: '', roomNumber: '', type: 'double', pricePerNight: '',
    capacity: 2, description: '', amenities: [], images: ['']
  });

  // ---- EFFECTS ----
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('pendingPartners')) || [];
    setPendingPartners(stored);
  }, []);

  useEffect(() => { fetchData(); }, [activeTab]);

  // ---- DATA FUNCTIONS ----
  const fetchData = async () => {
    setLoading(true);
    try {
      const hotelsRes = await getHotels();
      if (hotelsRes.success) setHotels(hotelsRes.data);

      if (activeTab === 'bookings' || activeTab === 'dashboard') {
        const bookingsRes = await getMyBookings();
        if (bookingsRes.success) setBookings(bookingsRes.data);
      }

      if (activeTab === 'rooms' || activeTab === 'dashboard') {
        const allRoomsRes = await getAllRooms();
        if (allRoomsRes.success) setRooms(allRoomsRes.data);
      }

      if (selectedHotelForRooms) {
        const roomsRes = await getHotelRooms(selectedHotelForRooms._id);
        if (roomsRes.success) {
          const hotelSpecificRooms = roomsRes.data;
          setRooms(prev => {
            const existingIds = new Set(prev.map(r => r._id));
            return [...prev, ...hotelSpecificRooms.filter(r => !existingIds.has(r._id))];
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

  const closeAlert = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  // ---- HOTEL CRUD ----
  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post('/hotels', hotelForm);
      if (response.data.success) {
        showAlert('Success', 'Hotel created successfully', 'success');
        setShowHotelModal(false);
        resetHotelForm();
        fetchData();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHotel = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put(`/hotels/${editingHotel._id}`, hotelForm);
      if (response.data.success) {
        showAlert('Success', 'Hotel updated successfully', 'success');
        setShowHotelModal(false);
        setEditingHotel(null);
        resetHotelForm();
        fetchData();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to update hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) return;
    try {
      setLoading(true);
      await deleteHotel(hotelId);
      showAlert('Success', 'Hotel deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showAlert('Error', 'Failed to delete hotel');
    } finally {
      setLoading(false);
    }
  };

  // ---- ROOM CRUD ----
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const roomData = { ...roomForm, hotel: selectedHotelForRooms._id };
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

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put(`/rooms/${editingRoom._id}`, roomForm);
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
    if (!window.confirm('Are you sure?')) return;
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

  // ---- BOOKING MANAGEMENT ----
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
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
    if (!window.confirm('Permanently delete?')) return;
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

  const resetHotelForm = () => {
    setHotelForm({ name: '', description: '', location: { address: '', city: '', country: '' }, images: [''], amenities: [], starRating: 5, contact: { phone: '', email: '' } });
  };

  const resetRoomForm = () => {
    setRoomForm({ hotel: '', roomNumber: '', type: 'double', pricePerNight: '', capacity: 2, description: '', amenities: [], images: [''] });
  };

  const openEditHotel = (hotel) => {
    setEditingHotel(hotel);
    setHotelForm({ name: hotel.name, description: hotel.description, location: hotel.location, images: hotel.images.length > 0 ? hotel.images : [''], amenities: hotel.amenities || [], starRating: hotel.starRating, contact: hotel.contact || { phone: '', email: '' } });
    setShowHotelModal(true);
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({ hotel: room.hotel, roomNumber: room.roomNumber, type: room.type, pricePerNight: room.pricePerNight, capacity: room.capacity, description: room.description || '', amenities: room.amenities || [], images: room.images || [''] });
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

  // ---- STATS ----
  // ---- STATS ----
  const stats = useMemo(() => {
    // Compute reviews and average rating from actual embedded reviews data
    let totalReviews = 0;
    let totalRatingSum = 0;

    hotels.forEach(hotel => {
      if (hotel.reviews && hotel.reviews.length > 0) {
        totalReviews += hotel.reviews.length;
        const hotelRatingSum = hotel.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        totalRatingSum += hotelRatingSum;
      }
    });

    // Average rating: average of all individual review ratings across all hotels
    const averageRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '0.0';

    // Total revenue: case-insensitive status check + fallback for undefined totalPrice
    const totalRevenue = bookings
      .filter(b => b.status && b.status.toLowerCase() === 'confirmed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const totalRooms = hotels.reduce((sum, h) => sum + (h.roomCount || h.rooms?.length || 0), 0);

    return {
      totalHotels: hotels.length,
      totalRooms,
      totalBookings: bookings.length,
      totalRevenue,
      totalReviews,
      averageRating,
      cancelledBookings: bookings.filter(b => b.status && b.status.toLowerCase() === 'cancelled').length,
      confirmedBookings: bookings.filter(b => b.status && b.status.toLowerCase() === 'confirmed').length
    };
  }, [hotels, bookings]);

  const filteredHotels = hotels.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allReviews = useMemo(() => {
    const reviews = [];
    hotels.forEach(hotel => {
      if (hotel.reviews?.length > 0) {
        hotel.reviews.forEach(review => {
          reviews.push({ ...review, hotelId: hotel._id, hotelName: hotel.name, hotelImage: hotel.images?.[0] });
        });
      }
    });
    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [hotels]);

  // ---- PDF EXPORT FUNCTIONS ----
  const exportHotelsPDF = () => {
    const doc = new jsPDF();
    doc.setTextColor(34, 211, 238);
    doc.setFontSize(20);
    doc.text('Hotels Directory', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Name', 'Location', 'Stars', 'Rooms', 'Rating', 'Reviews']],
      body: hotels.map(h => [h.name, `${h.location.city}, ${h.location.country}`, h.starRating, h.roomCount || 0, h.averageRating || h.starRating, h.reviewCount || 0]),
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], textColor: 255 },
      styles: { fontSize: 10 }
    });
    doc.save(`hotels-directory-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportBookingsPDF = () => {
    const doc = new jsPDF();
    doc.setTextColor(34, 211, 238);
    doc.setFontSize(20);
    doc.text('Booking Records', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Hotel', 'Guest', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Total', 'Status']],
      body: bookings.map(b => {
        const nights = Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24));
        return [b.hotel?.name || 'N/A', b.user?.name || 'Guest', new Date(b.checkInDate).toLocaleDateString(), new Date(b.checkOutDate).toLocaleDateString(), nights, b.guests, `PHP ${(b.totalPrice || 0).toLocaleString('en-US')}`, b.status];
      }),
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], textColor: 255 },
      styles: { fontSize: 9 }
    });
    doc.save(`bookings-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ---- NESTED COMPONENTS (have access to all above) ----

  const Sidebar = () => (
    <div className="w-64 bg-slate-900/50 border-r border-white/10 p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-8">
        <Building2 className="w-8 h-8 text-cyan-400" />
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Admin Panel</span>
      </div>

      <nav className="space-y-2 flex-1">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSelectedHotelForRooms(null); }} />
        <SidebarItem icon={Building2} label="Manage Hotels" active={activeTab === 'hotels'} onClick={() => { setActiveTab('hotels'); setSelectedHotelForRooms(null); }} />
        <SidebarItem icon={BedDouble} label="Manage Rooms" active={activeTab === 'rooms'} onClick={() => { setActiveTab('rooms'); setSelectedHotelForRooms(null); }} />
        <SidebarItem icon={Calendar} label="All Bookings" active={activeTab === 'bookings'} onClick={() => { setActiveTab('bookings'); setSelectedHotelForRooms(null); }} />
        <SidebarItem icon={MessageSquare} label="All Reviews" active={activeTab === 'reviews'} onClick={() => { setActiveTab('reviews'); setSelectedHotelForRooms(null); }} badge={stats.totalReviews} />

        {/* ✅ GENERATE REPORT BUTTON */}
        <button onClick={() => setShowReportModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-gray-400 hover:bg-white/5 hover:text-white">
          <FileText className="w-5 h-5" />
          <span className="font-medium">Generate Report</span>
        </button>
      </nav>

      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="font-medium text-sm">{user?.name || 'Admin'}</p>
            <p className="text-xs text-purple-400">Administrator</p>
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
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
      green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400'
    };
    return (
      <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-xl rounded-2xl p-6 border`}>
        <Icon className="w-8 h-8 mb-3" />
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    );
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Hotels" value={stats.totalHotels} color="cyan" />
        <StatCard icon={BedDouble} label="Total Rooms" value={stats.totalRooms} color="purple" />
        <StatCard icon={Calendar} label="Total Bookings" value={stats.totalBookings} color="pink" />
        <StatCard icon={PhilippinePeso} label="Total Revenue" value={`₱${stats.totalRevenue.toLocaleString()}`} color="green" />
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
            <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-xl border border-red-500/30">
              <span className="text-red-400">Cancelled</span>
              <span className="font-bold text-xl">{stats.cancelledBookings}</span>
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
              <span className="text-purple-400">Avg Rating</span>
              <span className="font-bold text-xl flex items-center gap-1">{stats.averageRating} <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /></span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {bookings.slice(0, 5).map(booking => (
              <div key={booking._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="font-medium text-sm">{booking.hotel?.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <User className="w-3 h-3" /> {booking.user?.name || 'Guest'}
                    {booking.user?.phone && <span className="flex items-center gap-1 ml-1"><Phone className="w-3 h-3" /> {booking.user.phone}</span>}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const HotelsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Hotels</h2>
        <div className="flex gap-2">
          <button onClick={exportHotelsPDF} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => { setEditingHotel(null); resetHotelForm(); setShowHotelModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium hover:shadow-lg transition-all">
            <Plus className="w-5 h-5" /> Add Hotel
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search hotels..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
          autoComplete="off" spellCheck="false" />
      </div>

      <div className="grid gap-4">
        {[...filteredHotels]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .map(hotel => (
          <div key={hotel._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all">
            <div className="flex flex-col md:flex-row gap-6">
              <img src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} alt={hotel.name}
                className="w-full md:w-48 h-32 object-cover rounded-xl" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold">{hotel.name}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1"><MapPin className="w-4 h-4" /> {hotel.location.city}, {hotel.location.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openViewReviews(hotel)} className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors" title="View Reviews"><Star className="w-5 h-5" /></button>
                    <button onClick={() => openManageRooms(hotel)} className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors" title="Manage Rooms"><BedDouble className="w-5 h-5" /></button>
                    <button onClick={() => openEditHotel(hotel)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors" title="Edit"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteHotel(hotel._id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors" title="Delete"><Trash2 className="w-5 h-5" /></button>
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
                  <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" /> {hotel.averageRating || hotel.starRating} ({hotel.reviewCount || 0} reviews)</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-cyan-400 font-medium">{hotel.starRating}-Star</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-400 font-medium">{hotel.roomCount || 0} rooms</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-green-400 font-medium">Max {hotel.maxCapacity || 4} guests</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

const BookingsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">All Bookings</h2>
        <button onClick={exportBookingsPDF} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      <div className="grid gap-4">
        {[...bookings]
          .sort((a, b) => {
            const getTime = (item) => {
              if (item.createdAt) return new Date(item.createdAt).getTime();
              if (item._id && typeof item._id === 'string' && item._id.length === 24) {
                return parseInt(item._id.substring(0, 8), 16) * 1000;
              }
              return 0;
            };
            return getTime(b) - getTime(a);
          })
          .map(booking => {
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
                        <User className="w-4 h-4" /><span>{booking.user?.name || 'Guest'}</span>
                        <span className="text-gray-600">•</span>
                        <Mail className="w-3 h-3" /><span>{booking.user?.email || 'No email'}</span>
                      </div>
                      {booking.user?.phone && (
                        <div className="flex items-center gap-1 text-sm text-cyan-400 mt-1"><Phone className="w-3 h-3" /><span>{booking.user.phone}</span></div>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{booking.status}</span>
                    <div className="flex gap-2">
                      {booking.status !== 'cancelled' && (
                        <button onClick={() => handleCancelBooking(booking._id)} className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/20 transition-colors">Cancel</button>
                      )}
                      {booking.status === 'cancelled' && (
                        <button onClick={() => handleDeleteBooking(booking._id)} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  const RoomsView = () => {
    if (!selectedHotelForRooms) {
      const roomsByHotel = rooms.reduce((acc, room) => {
        const hotelId = room.hotel?._id || room.hotel;
        const hotelName = room.hotel?.name || 'Unknown Hotel';
        if (!acc[hotelId]) acc[hotelId] = { name: hotelName, rooms: [] };
        acc[hotelId].rooms.push(room);
        return acc;
      }, {});

      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Manage All Rooms</h2>
            <p className="text-gray-400">{rooms.length} total rooms across all hotels</p>
          </div>
          {Object.entries(roomsByHotel).map(([hotelId, hotelData]) => (
            <div key={hotelId} className="space-y-4">
              <h3 className="text-xl font-semibold text-cyan-400 border-b border-white/10 pb-2">{hotelData.name} ({hotelData.rooms.length} rooms)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {hotelData.rooms.map(room => (
                  <div key={room._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold capitalize">{room.type} Room #{room.roomNumber}</h3>
                        <p className="text-cyan-400 text-2xl font-bold">₱{room.pricePerNight}<span className="text-sm text-gray-400 font-normal">/night</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedHotelForRooms({ _id: hotelId, name: hotelData.name }); openEditRoom(room); }}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteRoom(room._id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                        <p className={`font-medium ${room.isAvailable !== false ? 'text-green-400' : 'text-red-400'}`}>{room.isAvailable !== false ? 'Available' : 'Unavailable'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities?.map((amenity, idx) => <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300">{amenity}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No rooms found in the system.</p>
              <button onClick={() => setActiveTab('hotels')} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-colors mx-auto">
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
          <button onClick={() => setSelectedHotelForRooms(null)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
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
                  <button onClick={() => openEditRoom(room)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteRoom(room._id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                  <p className={`font-medium ${room.isAvailable !== false ? 'text-green-400' : 'text-red-400'}`}>{room.isAvailable !== false ? 'Available' : 'Unavailable'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {room.amenities?.map((amenity, idx) => <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300">{amenity}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ReviewsView = () => {
    const [reviewFilter, setReviewFilter] = useState('all');
    const [searchReview, setSearchReview] = useState('');

    const filteredReviews = allReviews.filter(review => {
      const matchesSearch = review.hotelName?.toLowerCase().includes(searchReview.toLowerCase()) ||
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
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
              autoComplete="off" spellCheck="false" />
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
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${review.rating >= 4 ? 'bg-green-500/20 text-green-400' : review.rating === 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{review.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-3">{review.comment}</p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-cyan-400 transition-colors"><ThumbsUp className="w-4 h-4" /> Helpful</button>
                    <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors"><Flag className="w-4 h-4" /> Report</button>
                    <button onClick={() => { setSelectedHotelForReviews(hotels.find(h => h._id === review.hotelId)); setShowReviewsModal(true); }}
                      className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors ml-auto"><Eye className="w-4 h-4" /> View Hotel</button>
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

  // ---- RETURN ----
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <AlertModal isOpen={alertModal.isOpen} onClose={closeAlert} title={alertModal.title} message={alertModal.message} type={alertModal.type} />

      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} hotels={hotels} rooms={rooms} bookings={bookings} stats={stats} />

      <HotelModal
        isOpen={showHotelModal}
        onClose={() => { setShowHotelModal(false); setEditingHotel(null); resetHotelForm(); }}
        onSubmit={editingHotel ? handleUpdateHotel : handleCreateHotel}
        editingHotel={editingHotel}
        hotelForm={hotelForm}
        setHotelForm={setHotelForm}
      />

      <RoomModal
        isOpen={showRoomModal}
        onClose={() => { setShowRoomModal(false); setEditingRoom(null); resetRoomForm(); }}
        onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom}
        editingRoom={editingRoom}
        roomForm={roomForm}
        setRoomForm={setRoomForm}
        selectedHotel={selectedHotelForRooms}
      />

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

export default AdminDashboard;