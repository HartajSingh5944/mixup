import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const selectedLocationIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:30px;height:30px;border-radius:999px;background:radial-gradient(circle at 30% 30%, #a6d2ff, #2563eb 58%, #1d4ed8 100%);border:3px solid rgba(255,255,255,.92);box-shadow:0 14px 34px rgba(17,24,39,.24);"></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const RecenterMap = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center?.lat !== undefined && center?.lng !== undefined) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);

  return null;
};

const RefreshMapSize = () => {
  const map = useMap();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 50);

    return () => window.clearTimeout(timeoutId);
  }, [map]);

  return null;
};

const LocationMarker = ({ selectedPosition, onSelect }) => {
  useMapEvents({
    click(event) {
      onSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  if (!selectedPosition) {
    return null;
  }

  return <Marker position={[selectedPosition.lat, selectedPosition.lng]} icon={selectedLocationIcon} />;
};

const EventLocationPicker = ({ center, selectedPosition, onSelect }) => {
  const fallbackCenter = center || { lat: 28.6139, lng: 77.209 };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <MapContainer
        center={[fallbackCenter.lat, fallbackCenter.lng]}
        zoom={13}
        scrollWheelZoom
        style={{ height: '18rem', width: '100%' }}
      >
        <RefreshMapSize />
        <RecenterMap center={selectedPosition || fallbackCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker selectedPosition={selectedPosition} onSelect={onSelect} />
      </MapContainer>
    </div>
  );
};

export default EventLocationPicker;
