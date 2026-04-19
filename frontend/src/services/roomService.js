import api from './api';

// Get all rooms for a specific hotel (without date filtering for initial load)
export const getHotelRooms = async (hotelId, checkIn, checkOut) => {
  let url = `/rooms/hotel/${hotelId}`;
  
  // Add date parameters only when checking availability
  if (checkIn && checkOut) {
    url += `?checkIn=${checkIn}&checkOut=${checkOut}`;
  }
  
  const response = await api.get(url);
  return response.data;
};

// Get single room details
export const getRoom = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

export default { getHotelRooms, getRoom };