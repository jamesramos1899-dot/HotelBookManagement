import api from './api';

export const getHotelRooms = async (hotelId, checkIn, checkOut) => {
  let url = `/rooms/hotel/${hotelId}`;
  
  if (checkIn && checkOut) {
    url += `?checkIn=${checkIn}&checkOut=${checkOut}`;
  }
  
  const response = await api.get(url);
  return response.data;
};

// ADD THIS NEW FUNCTION
export const getAllRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};

export const getRoom = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

export const createRoom = async (roomData) => {
  const response = await api.post('/rooms', roomData);
  return response.data;
};

export const updateRoom = async (roomId, roomData) => {
  const response = await api.put(`/rooms/${roomId}`, roomData);
  return response.data;
};

export const deleteRoom = async (roomId) => {
  const response = await api.delete(`/rooms/${roomId}`);
  return response.data;
};

export default { getHotelRooms, getAllRooms, getRoom, createRoom, updateRoom, deleteRoom };