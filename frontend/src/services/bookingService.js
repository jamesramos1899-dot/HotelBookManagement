import api from './api';

export const getMyBookings = async () => {
  try {
    const response = await api.get('/bookings');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch bookings' };
  }
};

export const getMyHotelBookings = async () => {
  try {
    const response = await api.get('/bookings/my-hotel');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch hotel bookings' };
  }
};

export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to create booking' };
  }
};

export const cancelBooking = async (id) => {
  try {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to cancel booking' };
  }
};

export const deleteBooking = async (id) => {
  try {
    const response = await api.delete(`/bookings/${id}/delete`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to delete booking' };
  }
};

export const getRoomBookedDates = async (roomId) => {
  try {
    const response = await api.get(`/bookings/room/${roomId}/dates`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch booked dates' };
  }
};

export const getHotelBookedDates = async (hotelId) => {
  try {
    const response = await api.get(`/bookings/hotel/${hotelId}/dates`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch hotel booked dates' };
  }
};

export const checkAvailability = async (roomId, checkInDate, checkOutDate) => {
  try {
    const response = await api.post('/bookings/check-availability', {
      room: roomId,
      checkInDate,
      checkOutDate
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to check availability' };
  }
};