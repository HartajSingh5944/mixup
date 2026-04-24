import axiosInstance from './axiosInstance';

export const getNearbyEvents = ({ lat, lng, radius = 30000, category, city, timeWindowHours }) =>
  axiosInstance.get('/events/near', {
    params: {
      lat,
      lng,
      radius,
      ...(category ? { category } : {}),
      ...(city ? { city } : {}),
      ...(timeWindowHours !== undefined && timeWindowHours !== null ? { timeWindowHours } : {}),
    },
  });

export const createEvent = (payload) => axiosInstance.post('/events', payload);

export const getMyHostedEvents = () => axiosInstance.get('/events/mine');

export const updateHostedEvent = (eventId, payload) => axiosInstance.put(`/events/${eventId}`, payload);

export const deleteHostedEvent = (eventId) => axiosInstance.delete(`/events/${eventId}`);

export const getGoogleEvents = ({ city, q }) =>
  axiosInstance.get('/integrations/google-events', {
    params: {
      city,
      ...(q ? { q } : {}),
    },
  });
