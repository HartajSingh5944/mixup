const { fetchSerpApiGoogleEvents } = require('../services/serpApiEvents.service');

const getGoogleEvents = async (req, res) => {
  try {
    const { city, q, start_date: startDate, end_date: endDate } = req.query;

    if (!city) {
      return res.status(400).json({ message: 'city query param is required' });
    }

    if (!process.env.SERPAPI_API_KEY) {
      return res.status(500).json({ message: 'SerpApi key not configured' });
    }

    const startDateTime = startDate ? new Date(startDate) : new Date();
    const endDateTime = endDate ? new Date(endDate) : null;

    // This endpoint is still available for tooling, but the same normalized
    // SerpApi events are also injected directly into the map feed.
    const normalized = await fetchSerpApiGoogleEvents({
      city,
      q,
      startDateTime,
      endDateTime,
      lat: 0,
      lng: 0,
      radiusInMeters: null,
    });

    res.json(normalized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch Google Events' });
  }
};

module.exports = { getGoogleEvents };
