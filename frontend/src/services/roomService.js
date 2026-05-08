import api from './api';

export const getAllRooms = async () => {
  try {
    const response = await api.get('/rooms');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch rooms' };
  }
};

export const getHotelRooms = async (hotelId, checkIn, checkOut) => {
  try {
    let url = `/rooms/hotel/${hotelId}`;
    if (checkIn && checkOut) {
      url += `?checkIn=${checkIn}&checkOut=${checkOut}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch hotel rooms' };
  }
};

export const getRoom = async (id) => {
  try {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch room' };
  }
};

export const createRoom = async (roomData) => {
  try {
    const response = await api.post('/rooms', roomData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to create room' };
  }
};

export const updateRoom = async (id, roomData) => {
  try {
    const response = await api.put(`/rooms/${id}`, roomData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to update room' };
  }
};

export const deleteRoom = async (id) => {
  try {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to delete room' };
  }
};

export const getMyRooms = async () => {
  try {
    const response = await api.get('/rooms/my');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch my rooms' };
  }
};