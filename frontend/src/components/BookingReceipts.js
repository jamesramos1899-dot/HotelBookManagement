import React, { useRef } from 'react';
import { Check, Calendar, Users, Bed, MapPin, CreditCard, Download, Home, Printer, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BookingReceipt = ({ booking, onClose, onDownload }) => {
  const receiptRef = useRef(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const nights = Math.ceil(
    (new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)
  );

  const pricePerNight = Math.round(booking.totalPrice / nights);
  const bookingRef = booking._id || 'BK-' + Date.now().toString(36).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AI-Stay-Receipt-${bookingRef}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      // Fallback to JSON download
      handleDownloadJSON();
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(booking, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-receipt-${bookingRef}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">

      {/* Receipt Container - ref for PDF capture */}
      <div ref={receiptRef} className="bg-slate-900 rounded-3xl max-w-lg w-full border border-white/10 shadow-2xl overflow-hidden">

        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-8 text-center border-b border-white/10">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-gray-400">Your reservation is complete</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Payment Received</span>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-6">

          {/* Hotel Info */}
          <div className="flex items-start gap-4">
            <img 
              src={booking.hotel?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} 
              alt={booking.hotel?.name}
              className="w-24 h-24 rounded-xl object-cover"
              crossOrigin="anonymous"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{booking.hotel?.name || 'Hotel'}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {booking.hotel?.location || 'Location'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < (booking.hotel?.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-yellow-400 font-bold text-sm">{booking.hotel?.rating || 5}</span>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Booking Details</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Calendar className="w-4 h-4" />
                  Check-in
                </div>
                <p className="text-white font-semibold">{formatDate(booking.checkInDate)}</p>
                <p className="text-gray-500 text-xs">After 2:00 PM</p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Calendar className="w-4 h-4" />
                  Check-out
                </div>
                <p className="text-white font-semibold">{formatDate(booking.checkOutDate)}</p>
                <p className="text-gray-500 text-xs">Before 12:00 PM</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Bed className="w-4 h-4" />
                  Room Type
                </div>
                <p className="text-white font-semibold capitalize">{booking.room?.type || 'Standard'}</p>
                <p className="text-gray-500 text-xs">Room #{booking.room?.roomNumber || 'N/A'}</p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Users className="w-4 h-4" />
                  Guests
                </div>
                <p className="text-white font-semibold">{booking.guests} Guest{booking.guests !== 1 ? 's' : ''}</p>
                <p className="text-gray-500 text-xs">Maximum capacity</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <CreditCard className="w-4 h-4" />
                Payment Reference
              </div>
              <p className="text-white font-mono text-sm break-all">{booking.paymentIntentId || booking.paymentId || 'N/A'}</p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Price Details</h4>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Room Rate</span>
                <span className="text-white">₱{pricePerNight} × {nights} night{nights !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">₱{booking.totalPrice}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Taxes & Fees</span>
                <span className="text-green-400">Included</span>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-gray-400 font-medium">Total Paid</span>
                <span className="text-2xl font-bold text-cyan-400">₱{booking.totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Booking ID */}
          <div className="text-center bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10">
            <p className="text-gray-500 text-xs uppercase tracking-wider">Booking Reference</p>
            <p className="text-white font-mono text-lg tracking-widest">{bookingRef}</p>
            <p className="text-gray-500 text-xs mt-1">Booked on {new Date().toLocaleDateString('en-GB')}</p>
          </div>

          {/* Terms */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Please present this receipt at check-in</p>
            <p>Cancellation policy: Free cancellation up to 24 hours before check-in</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 bg-white/5">
          <div className="grid grid-cols-4 gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <button 
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>

            <button 
              onClick={handleDownloadJSON}
              className="flex items-center justify-center gap-2 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>

            <button 
              onClick={onClose}
              className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl hover:shadow-lg transition-all text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingReceipt;