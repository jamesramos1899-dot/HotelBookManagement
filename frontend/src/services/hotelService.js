import api from './api';

export const getHotels = async () => {
  try {
    const response = await api.get('/hotels');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch hotels' };
  }
};

export const getHotel = async (id) => {
  try {
    const response = await api.get(`/hotels/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch hotel' };
  }
};

export const createHotel = async (hotelData) => {
  try {
    const response = await api.post('/hotels', hotelData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to create hotel' };
  }
};

export const updateHotel = async (id, hotelData) => {
  try {
    const response = await api.put(`/hotels/${id}`, hotelData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to update hotel' };
  }
};

export const deleteHotel = async (id) => {
  try {
    const response = await api.delete(`/hotels/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to delete hotel' };
  }
};

export const addReview = async (id, reviewData) => {
  try {
    const response = await api.post(`/hotels/${id}/reviews`, reviewData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to add review' };
  }
};

export const toggleFavorite = async (id) => {
  try {
    const response = await api.post(`/hotels/${id}/favorite`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to toggle favorite' };
  }
};

export const getMyFavorites = async () => {
  try {
    const response = await api.get('/hotels/favorites/my');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to fetch favorites' };
  }
};