import { useEffect, useRef, useState } from 'react';
import EventMap from '../components/EventMap';
import { getNearbyEvents } from '../api/eventsApi';
import { useAuth } from '../context/useAuth';
import { cityLocations, findCityByName, findNearestCity } from '../data/cityLocations';

const defaultLocation = { lat: 28.6139, lng: 77.209 };
const DEFAULT_RADIUS_KM = 30;

const MapPage = () => {
  const { user } = useAuth();
  const initialCityLocation = findCityByName(user?.city) || defaultLocation;
  const [selectedCity, setSelectedCity] = useState(user?.city || 'New Delhi');
  const [cityCenter, setCityCenter] = useState({
    lat: initialCityLocation.lat,
    lng: initialCityLocation.lng,
  });
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [radiusOrigin, setRadiusOrigin] = useState('city');
  const [category, setCategory] = useState('');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const savedCity = findCityByName(user?.city);
    if (savedCity) {
      setSelectedCity(savedCity.city);
      setCityCenter({ lat: savedCity.lat, lng: savedCity.lng });
    }

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentDeviceLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDeviceLocation(currentDeviceLocation);

        const nearestCity = findNearestCity({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        if (!savedCity) {
          setSelectedCity(nearestCity?.city || 'New Delhi');
          setCityCenter({
            lat: nearestCity?.lat || position.coords.latitude,
            lng: nearestCity?.lng || position.coords.longitude,
          });
        }
      },
      () => {
        if (!savedCity) {
          setSelectedCity('New Delhi');
          setCityCenter(defaultLocation);
          setError('Using the default city location because browser location was not allowed.');
        }
      }
    );
  }, [user?.city]);

  useEffect(() => {
    const cityLocation = findCityByName(selectedCity);
    if (cityLocation) {
      setCityCenter({ lat: cityLocation.lat, lng: cityLocation.lng });
    }
  }, [selectedCity]);

  useEffect(() => {
    const fetchEvents = async () => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;
      setIsLoading(true);
      setError('');
      setNotice('');

      try {
        const city = selectedCity || user?.city || 'New Delhi';
        const radiusBaseLocation =
          radiusOrigin === 'user' && deviceLocation
            ? deviceLocation
            : cityCenter;
        const { data } = await getNearbyEvents({ ...radiusBaseLocation, radius: radiusKm * 1000, category, city });
        if (latestRequestRef.current !== requestId) {
          return;
        }
        setEvents(data);
        if (!data.length) {
          const radiusOriginLabel = radiusOrigin === 'user' && deviceLocation ? 'your location' : `${city} city center`;
          setNotice(`No SerpApi events were found within ${radiusKm} km of ${radiusOriginLabel} right now.`);
        }
      } catch (apiError) {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        const apiMessage = apiError.response?.data?.error || apiError.response?.data?.message;
        setError(apiMessage || 'Could not load events.');
        setEvents([]);
      } finally {
        if (latestRequestRef.current === requestId) {
          setIsLoading(false);
        }
      }
    };

    fetchEvents();
  }, [cityCenter, category, selectedCity, user?.city, radiusKm, deviceLocation, radiusOrigin]);

  const radiusBaseLocation =
    radiusOrigin === 'user' && deviceLocation
      ? deviceLocation
      : cityCenter;

  return (
    <main>
      {error && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="border-b border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700">
          {notice}
        </div>
      )}
      <EventMap
        mapCenter={cityCenter}
        radiusBaseLocation={radiusBaseLocation}
        radiusOrigin={radiusOrigin}
        onRadiusOriginChange={setRadiusOrigin}
        hasDeviceLocation={Boolean(deviceLocation)}
        events={events}
        category={category}
        onCategoryChange={setCategory}
        cityOptions={cityLocations}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        isLoading={isLoading}
      />
    </main>
  );
};

export default MapPage;
