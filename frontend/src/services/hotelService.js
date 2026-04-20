import api from './api';

export const getHotels = async () => {
  const response = await api.get('/hotels');
  return response.data;
};

export const getHotel = async (id) => {
  const response = await api.get(`/hotels/${id}`);
  return response.data;
};

export const createHotel = async (hotelData) => {
  const response = await api.post('/hotels', hotelData);
  return response.data;
};

export const updateHotel = async (id, hotelData) => {
  const response = await api.put(`/hotels/${id}`, hotelData);
  return response.data;
};

export const deleteHotel = async (id) => {
  const response = await api.delete(`/hotels/${id}`);
  return response.data;
};

export const toggleFavorite = async (id) => {
  const response = await api.post(`/hotels/${id}/favorite`);
  return response.data;
};

export const getMyFavorites = async () => {
  const response = await api.get('/hotels/favorites/my');
  return response.data;
};

export const addReview = async (id, reviewData) => {
  const response = await api.post(`/hotels/${id}/reviews`, reviewData);
  return response.data;
};

export default { 
  getHotels, 
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel, 
  toggleFavorite, 
  getMyFavorites, 
  addReview 
};