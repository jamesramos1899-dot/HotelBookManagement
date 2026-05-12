import api from './api';

export const getMyConversations = () => api.get('/chats').then(r => r.data);
export const getConversation = (hotelId) => api.get(`/chats/${hotelId}`).then(r => r.data);
export const sendMessage = (hotelId, message) => api.post(`/chats/${hotelId}`, { message }).then(r => r.data);
export const getHotelConversations = () => api.get('/chats/hotel/all').then(r => r.data);
export const getGuestConversation = (guestId) => api.get(`/chats/hotel/guest/${guestId}`).then(r => r.data);
export const replyToGuest = (guestId, message) => api.post(`/chats/hotel/guest/${guestId}`, { message }).then(r => r.data);