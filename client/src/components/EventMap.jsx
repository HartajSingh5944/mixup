import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import EventMarkerPopup from './EventMarkerPopup';

const userMarkerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:999px;background:#111827;border:3px solid white;box-shadow:0 8px 22px rgba(17,24,39,.28);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const eventMarkerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:28px;height:28px;border-radius:999px;background:radial-gradient(circle at 30% 30%, #ffcab6, #f9735b 58%, #ef5e43 100%);border:3px solid rgba(255,255,255,.92);box-shadow:0 14px 34px rgba(17,24,39,.24);"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const mixupMarkerIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:28px;height:28px;border-radius:999px;background:radial-gradient(circle at 30% 30%, #a6d2ff, #2563eb 58%, #1d4ed8 100%);border:3px solid rgba(255,255,255,.92);box-shadow:0 14px 34px rgba(17,24,39,.24);"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const categories = [
  { value: '', label: 'All' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'dance', label: 'Dance' },
  { value: 'other', label: 'Other' },
];

const getMarkerPosition = (event) => {
  const [lng, lat] = event.location.coordinates;
  return [lat, lng];
};

const getEventMarkerIcon = (event) => (event.source === 'mixup' ? mixupMarkerIcon : eventMarkerIcon);

const RecenterMap = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [map, center]);

  return null;
};

const EventMap = ({
  mapCenter,
  radiusBaseLocation,
  radiusOrigin,
  onRadiusOriginChange,
  hasDeviceLocation,
  events,
  category,
  onCategoryChange,
  cityOptions,
  selectedCity,
  onCityChange,
  radiusKm,
  onRadiusChange,
    isLoading,
}) => {
  return (
    <section className="relative h-[calc(100vh-4rem)]">
      <div className="absolute left-3 right-3 top-3 z-[900] flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/65 p-2 shadow-soft backdrop-blur-xl sm:left-auto sm:right-6 sm:min-w-[22rem]">
        <label className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700">
          <span className="shrink-0">City</span>
          <select
            value={selectedCity}
            onChange={(event) => onCityChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-ink"
          >
            {cityOptions.map((location) => (
              <option key={`${location.state}-${location.city}`} value={location.city}>
                {location.city}, {location.state}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-xl bg-white/70 px-3 py-3 text-sm font-semibold text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span>Radius</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-ink shadow-sm">
              {radiusKm} km
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={radiusKm}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            className="mt-3 w-full accent-coral"
          />
        </label>

        <div className="rounded-xl bg-white/70 px-3 py-3 text-sm font-semibold text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span>Radius from</span>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              {radiusOrigin === 'user' && hasDeviceLocation ? 'Your location' : 'City center'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRadiusOriginChange(radiusOrigin === 'city' && hasDeviceLocation ? 'user' : 'city')}
            disabled={!hasDeviceLocation}
            className={`mt-3 flex w-full items-center justify-between rounded-full px-3 py-2 transition ${
              hasDeviceLocation ? 'bg-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span className="text-xs font-bold text-slate-600">City center</span>
            <span
              className={`relative mx-3 h-7 w-14 rounded-full transition ${
                radiusOrigin === 'user' && hasDeviceLocation ? 'bg-coral' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  radiusOrigin === 'user' && hasDeviceLocation ? 'left-8' : 'left-1'
                }`}
              />
            </span>
            <span className={`text-xs font-bold ${hasDeviceLocation ? 'text-slate-600' : 'text-slate-400'}`}>
              Your location
            </span>
          </button>
          {!hasDeviceLocation && (
            <p className="mt-2 text-xs font-medium text-slate-500">
              Turn on browser location if you want radius filtering from your real position.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onCategoryChange(item.value)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                category === item.value ? 'bg-ink text-white' : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 left-3 z-[900] max-w-[18rem] rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-soft backdrop-blur-xl sm:left-6">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-ink" />
            <span>Radius origin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-coral" />
            <span>SerpAPI events</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-blue-600" />
            <span>Hosted on MixUp</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">Tap a marker to open event details and jump to the listing link.</p>
      </div>

      {isLoading && (
        <div className="absolute bottom-5 left-1/2 z-[900] -translate-x-1/2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold shadow-soft backdrop-blur">
          Loading nearby events...
        </div>
      )}

      <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} scrollWheelZoom className="z-0">
        <RecenterMap center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[radiusBaseLocation.lat, radiusBaseLocation.lng]} icon={userMarkerIcon}>
          <Popup>{radiusOrigin === 'user' && hasDeviceLocation ? 'Radius is calculated from your location' : 'Radius is calculated from the selected city center'}</Popup>
        </Marker>
        {events.map((event) => (
          <Marker key={event._id || event.id} position={getMarkerPosition(event)} icon={getEventMarkerIcon(event)}>
            <Popup maxWidth={340}>
              <EventMarkerPopup event={event} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
};

export default EventMap;
