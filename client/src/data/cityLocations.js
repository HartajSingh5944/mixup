export const cityLocations = [
  { state: 'Delhi', city: 'New Delhi', lat: 28.6139, lng: 77.209 },
  { state: 'Maharashtra', city: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { state: 'Maharashtra', city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { state: 'Karnataka', city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { state: 'Telangana', city: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { state: 'Tamil Nadu', city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { state: 'West Bengal', city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { state: 'Gujarat', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { state: 'Rajasthan', city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { state: 'Uttar Pradesh', city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { state: 'Goa', city: 'Panaji', lat: 15.4909, lng: 73.8278 },
  { state: 'Chandigarh', city: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
];

export const getStates = () => [...new Set(cityLocations.map((location) => location.state))].sort();

export const getCitiesForState = (state) =>
  cityLocations.filter((location) => location.state === state).sort((a, b) => a.city.localeCompare(b.city));

export const findCityLocation = (state, city) =>
  cityLocations.find((location) => location.state === state && location.city === city);

export const findCityByName = (city) => cityLocations.find((location) => location.city === city);

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceKm = (from, to) => {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearestCity = (coords) =>
  cityLocations
    .map((location) => ({ ...location, distanceKm: getDistanceKm(coords, location) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
