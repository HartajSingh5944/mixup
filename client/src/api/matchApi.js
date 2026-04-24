import axiosInstance from './axiosInstance';

export const getCandidates = ({ interest, radius } = {}) =>
  axiosInstance.get('/match/candidates', {
    params: {
      ...(interest ? { interest } : {}),
      ...(radius ? { radius } : {}),
    },
  });

export const sendMatchAction = ({ targetUserId, action }) =>
  axiosInstance.post('/match/like', { targetUserId, action });
