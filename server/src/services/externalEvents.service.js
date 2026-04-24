const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

const categoryMap = {
  music: 'music',
  sports: 'sports',
  comedy: 'comedy',
  dance: 'dance',
  other: 'other',
};

const mapTicketmasterCategory = (event) => {
  const names = (event.classifications || [])
    .flatMap((classification) => [
      classification.segment?.name,
      classification.genre?.name,
      classification.subGenre?.name,
    ])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (names.includes('music')) {
    return 'music';
  }

  if (names.includes('sport')) {
    return 'sports';
  }

  if (names.includes('comedy')) {
    return 'comedy';
  }

  if (names.includes('dance')) {
    return 'dance';
  }

  return 'other';
};

const formatTicketmasterDateTime = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

const buildTicketmasterUrl = ({ lat, lng, radiusInMeters, category, startDateTime, endDateTime }) => {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    return null;
  }

  const radiusInKm = Math.max(Math.ceil(radiusInMeters / 1000), 1);
  const params = new URLSearchParams({
    apikey: apiKey,
    latlong: `${lat},${lng}`,
    radius: String(radiusInKm),
    unit: 'km',
    size: '100',
    sort: 'date,asc',
    startDateTime: formatTicketmasterDateTime(startDateTime),
    ...(endDateTime ? { endDateTime: formatTicketmasterDateTime(endDateTime) } : {}),
    ...(category && categoryMap[category] ? { classificationName: categoryMap[category] } : {}),
  });

  return `${TICKETMASTER_BASE_URL}?${params.toString()}`;
};

const mapTicketmasterEvent = (event) => {
  const venue = event._embedded?.venues?.[0];
  const venueLat = Number(venue?.location?.latitude);
  const venueLng = Number(venue?.location?.longitude);
  const dateTime = event.dates?.start?.dateTime;

  if (!venue || Number.isNaN(venueLat) || Number.isNaN(venueLng) || !dateTime) {
    return null;
  }

  return {
    _id: `ticketmaster_${event.id}`,
    externalId: event.id,
    source: 'ticketmaster',
    title: event.name,
    description: venue.name || '',
    category: mapTicketmasterCategory(event),
    dateTime,
    isPaid: Boolean(event.priceRanges?.length),
    ticketUrl: event.url || '',
    location: {
      type: 'Point',
      coordinates: [venueLng, venueLat],
    },
  };
};

const fetchExternalEvents = async ({ lat, lng, radiusInMeters, category, startDateTime, endDateTime }) => {
  const url = buildTicketmasterUrl({ lat, lng, radiusInMeters, category, startDateTime, endDateTime });

  if (!url) {
    return [];
  }

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ticketmaster request failed with status ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  const events = payload._embedded?.events || [];

  return events
    .map(mapTicketmasterEvent)
    .filter(Boolean)
    .filter((event) => new Date(event.dateTime) >= startDateTime);
};

module.exports = { fetchExternalEvents };
