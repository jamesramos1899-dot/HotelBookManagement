import api from './api';

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get('/bookings');
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}/delete`);
  return response.data;
};

export const getRoomBookedDates = async (roomId, year, month) => {
  const response = await api.get(`/bookings/room/${roomId}/dates?year=${year}&month=${month}`);
  return response.data;
};

export default { createBooking, getMyBookings, cancelBooking, deleteBooking, getRoomBookedDates };