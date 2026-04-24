const cityCenters = {
  'new delhi': { lat: 28.6139, lng: 77.209 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  panaji: { lat: 15.4909, lng: 73.8278 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
};

const placeCoordinateCache = new Map();

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceMeters = (from, to) => {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getDeterministicFallbackCoordinates = (center, seed) => {
  const normalizedSeed = String(seed || 'mixup')
    .split('')
    .reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
  const angle = normalizedSeed % 360;
  const radiusMeters = 800 + (normalizedSeed % 2200);
  const angleRadians = (angle * Math.PI) / 180;
  const latOffset = (radiusMeters / 111320) * Math.cos(angleRadians);
  const lngOffset =
    (radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angleRadians);

  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset,
  };
};

const formatCategoryQuery = (category, city) => {
  if (!category) {
    return `events in ${city}`;
  }

  const categoryLabels = {
    music: 'music events',
    sports: 'sports events',
    comedy: 'comedy events',
    dance: 'dance events',
    other: 'festivals workshops events',
  };

  return `${categoryLabels[category] || 'events'} in ${city}`;
};

const eventCategoryMatchers = {
  comedy: [
    /\bcomedy\b/i,
    /\bcomic\b/i,
    /\bstand[\s-]?up\b/i,
    /\blaugh\b/i,
    /\bimprov\b/i,
    /\bfunny\b/i,
  ],
  music: [
    /\bmusic\b/i,
    /\bconcert\b/i,
    /\bsinger\b/i,
    /\bband\b/i,
    /\bdj\b/i,
    /\btribute\b/i,
    /\borchestra\b/i,
    /\bgig\b/i,
    /\blive\b/i,
    /\bfolk\b/i,
  ],
  sports: [
    /\bsport\b/i,
    /\bsports\b/i,
    /\bstadium\b/i,
    /\bchampionship\b/i,
    /\btournament\b/i,
    /\brun\b/i,
    /\bmarathon\b/i,
    /\bmatch\b/i,
    /\bfitness\b/i,
    /\bcricket\b/i,
    /\bfootball\b/i,
    /\btennis\b/i,
    /\bbadminton\b/i,
    /\brace\b/i,
    /\bcycling\b/i,
    /\bkempo\b/i,
  ],
  dance: [
    /\bdance\b/i,
    /\bsalsa\b/i,
    /\bballet\b/i,
    /\bchoreography\b/i,
    /\bhip hop\b/i,
    /\bhip-hop\b/i,
  ],
};

const blockedEventPatterns = [
  /\bbet(?:ting)?\b/i,
  /\bodds\b/i,
  /\bprediction(?:s)?\b/i,
  /\bsportsbook\b/i,
  /\bfantasy\b/i,
  /\bwager\b/i,
  /\bpicks\b/i,
];

const blockedDomains = [
  'predicthq.com',
  'tradefest.io',
  'neventum.com',
  'ntradeshows.com',
];

const inferSerpCategory = (event, requestedCategory) => {
  const searchableText = [
    event.title,
    event.description,
    event.venue?.name,
    ...(Array.isArray(event.address) ? event.address : [event.address]),
  ]
    .filter(Boolean)
    .join(' ');

  for (const category of ['comedy', 'music', 'sports', 'dance']) {
    if (eventCategoryMatchers[category].some((pattern) => pattern.test(searchableText))) {
      return category;
    }
  }

  return requestedCategory || 'other';
};

const shouldFilterEvent = (event) => {
  const ticketInfo = event.ticketInfo || event.ticket_info || [];
  const urls = [event.link, event.ticketUrl, ...(ticketInfo || []).map((item) => item.link)].filter(Boolean);
  const text = [
    event.title,
    event.description,
    ...(ticketInfo || []).map((item) => item.source),
    ...urls,
  ]
    .filter(Boolean)
    .join(' ');

  if (blockedEventPatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  return urls.some((url) => {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      return blockedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    } catch {
      return false;
    }
  });
};

const monthMap = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const buildDateFromParts = ({ monthName, day, fallbackDate, timeText = '' }) => {
  const month = monthMap[monthName.toLowerCase().slice(0, 3)];
  if (month === undefined) {
    return null;
  }

  const year = fallbackDate.getFullYear();
  const parsedDay = Number(day);
  if (Number.isNaN(parsedDay)) {
    return null;
  }

  let hours = 12;
  let minutes = 0;
  const normalizedTime = timeText.trim().toUpperCase();
  const timeMatch = normalizedTime.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);

  if (timeMatch) {
    hours = Number(timeMatch[1]);
    minutes = Number(timeMatch[2] || 0);
    const meridiem = timeMatch[3];

    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    }

    if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  const candidate = new Date(year, month, parsedDay, hours, minutes, 0, 0);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }

  if (candidate < fallbackDate && month < fallbackDate.getMonth() - 1) {
    candidate.setFullYear(year + 1);
  }

  return candidate;
};

const parsePartialSerpDate = (value, fallbackDate) => {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/^[A-Za-z]{3},\s*/, '')
    .replace(/\s+[–-]\s+.*$/, '')
    .trim();

  const match = cleaned.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:,\s*(.+))?$/);
  if (!match) {
    return null;
  }

  return buildDateFromParts({
    monthName: match[1],
    day: match[2],
    timeText: match[3] || '',
    fallbackDate,
  });
};

const normalizeDateTime = (event, fallbackDate) => {
  const fromStartDate = parsePartialSerpDate(event.date?.start_date, fallbackDate);
  if (fromStartDate && !Number.isNaN(fromStartDate.getTime())) {
    return fromStartDate;
  }

  const fromWhen = parsePartialSerpDate(event.date?.when, fallbackDate);
  if (fromWhen && !Number.isNaN(fromWhen.getTime())) {
    return fromWhen;
  }

  return fallbackDate;
};

const geocodeAddress = async (query) => {
  if (!query) {
    return null;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MixUp/1.0',
    },
  });

  if (!response.ok) {
    return null;
  }

  let results;
  try {
    results = await response.json();
  } catch {
    return null;
  }

  const firstResult = results[0];
  if (!firstResult) {
    return null;
  }

  return {
    lat: Number(firstResult.lat),
    lng: Number(firstResult.lon),
  };
};

const getCoordinatesFromPlaceLink = async (serpapiLink) => {
  if (!serpapiLink || !process.env.SERPAPI_API_KEY) {
    return null;
  }

  if (placeCoordinateCache.has(serpapiLink)) {
    return placeCoordinateCache.get(serpapiLink);
  }

  const separator = serpapiLink.includes('?') ? '&' : '?';
  const lookupUrl = `${serpapiLink}${separator}api_key=${process.env.SERPAPI_API_KEY}&z=15`;
  const response = await fetch(lookupUrl);

  if (!response.ok) {
    placeCoordinateCache.set(serpapiLink, null);
    return null;
  }

  const payload = await response.json().catch(() => null);
  const latitude = payload?.place_results?.gps_coordinates?.latitude;
  const longitude = payload?.place_results?.gps_coordinates?.longitude;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    placeCoordinateCache.set(serpapiLink, null);
    return null;
  }

  const coordinates = { lat: latitude, lng: longitude };
  placeCoordinateCache.set(serpapiLink, coordinates);
  return coordinates;
};

const fetchSerpApiGoogleEvents = async ({
  city,
  q,
  category,
  startDateTime,
  endDateTime,
  lat,
  lng,
  radiusInMeters,
}) => {
  if (!process.env.SERPAPI_API_KEY || !city) {
    return [];
  }

  const params = new URLSearchParams({
    engine: 'google_events',
    q: q || formatCategoryQuery(category, city),
    hl: 'en',
    location: `${city}, India`,
    api_key: process.env.SERPAPI_API_KEY,
  });

  const serpResponse = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  if (!serpResponse.ok) {
    let details = '';
    try {
      const errorPayload = await serpResponse.json();
      details = errorPayload.error || errorPayload.message || JSON.stringify(errorPayload);
    } catch {
      details = await serpResponse.text().catch(() => '');
    }

    throw new Error(
      `SerpApi request failed with status ${serpResponse.status}${details ? `: ${details}` : ''}`
    );
  }

  const payload = await serpResponse.json();
  const rawEvents = payload.events_results || [];
  const fallbackCenter = cityCenters[city.trim().toLowerCase()] || { lat, lng };

  const normalized = await Promise.all(
    rawEvents.slice(0, 20).map(async (event, index) => {
      const dateTime = normalizeDateTime(event, startDateTime);
      const addressParts = Array.isArray(event.address) ? event.address : [event.address].filter(Boolean);
      const geocodeQuery = [event.venue?.name, ...addressParts].filter(Boolean).join(', ');
      const placeCoordinates = await getCoordinatesFromPlaceLink(event.event_location_map?.serpapi_link).catch(
        () => null
      );
      const geocoded = placeCoordinates || (await geocodeAddress(geocodeQuery).catch(() => null));
      const coordinates =
        geocoded || getDeterministicFallbackCoordinates(fallbackCenter, event.link || event.title || index);
      const distanceMeters = getDistanceMeters({ lat, lng }, coordinates);
      const inferredCategory = inferSerpCategory(event, category);

      return {
        _id: `serpapi_${event.link || event.title || index}`,
        source: 'serpapi_google_events',
        externalSource: 'serpapi_google_events',
        title: event.title || '',
        description: event.description || event.venue?.name || '',
        category: inferredCategory,
        dateTime,
        isPaid: Boolean(event.ticket_info?.length),
        link: event.link || '',
        ticketUrl: event.link || '',
        ticketInfo: event.ticket_info || [],
        city,
        address: event.address || '',
        when: event.date?.when || '',
        venue: event.venue?.name || '',
        location: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],
        },
        distanceMeters,
      };
    })
  );

  return normalized.filter((event) => {
    if (shouldFilterEvent(event)) {
      return false;
    }

    const eventTime = new Date(event.dateTime);
    if (Number.isNaN(eventTime.getTime()) || eventTime < startDateTime) {
      return false;
    }

    if (category && event.category !== category) {
      return false;
    }

    if (endDateTime && eventTime > endDateTime) {
      return false;
    }

    if (radiusInMeters && event.distanceMeters > radiusInMeters) {
      return false;
    }

    return true;
  });
};

module.exports = { fetchSerpApiGoogleEvents };
