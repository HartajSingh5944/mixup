import axiosInstance from './axiosInstance';

export const createUserReport = ({ conversationId, reportedUserId, category, details }) =>
  axiosInstance.post('/moderation/reports', {
    conversationId,
    reportedUserId,
    category,
    details,
  });

export const getReports = (status) =>
  axiosInstance.get('/moderation/reports', {
    params: status ? { status } : {},
  });

export const reviewReport = (reportId, payload) =>
  axiosInstance.patch(`/moderation/reports/${reportId}`, payload);

export const banUserFromReport = (reportId, reason) =>
  axiosInstance.post(`/moderation/reports/${reportId}/ban`, { reason });
