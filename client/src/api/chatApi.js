import axiosInstance from './axiosInstance';

export const getConversations = () => axiosInstance.get('/chat/conversations');

export const getMessages = (conversationId) =>
  axiosInstance.get(`/chat/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId, text) =>
  axiosInstance.post(`/chat/conversations/${conversationId}/messages`, { text });

export const blockUser = (targetUserId) => axiosInstance.post('/chat/blocks', { targetUserId });

export const unblockUser = (targetUserId) =>
  axiosInstance.delete('/chat/blocks', { data: { targetUserId } });

export const leaveConversation = (conversationId) =>
  axiosInstance.post(`/chat/conversations/${conversationId}/leave`);

export const deleteConversation = (conversationId) =>
  axiosInstance.delete(`/chat/conversations/${conversationId}`);
