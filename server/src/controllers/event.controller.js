const Event = require('../models/Event');
const { fetchSerpApiGoogleEvents } = require('../services/serpApiEvents.service');

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      dateTime,
      isPaid,
      priceAmount,
      ticketUrl,
      contactNumber,
      city,
      address,
      location,
      maxAttendees,
      bookedSlots,
      bookingsOpen,
      participationType,
      minTeamSize,
      durationMinutes,
      ageMin,
      ageMax,
      genderPreference,
      tags = [],
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !dateTime ||
      location?.lat === undefined ||
      location?.lng === undefined
    ) {
      return res.status(400).json({
        message: 'Title, description, category, dateTime, and location {lat,lng} are required',
      });
    }

    const parsedDateTime = new Date(dateTime);
    if (Number.isNaN(parsedDateTime.getTime())) {
      return res.status(400).json({ message: 'dateTime must be a valid date' });
    }

    if (durationMinutes !== undefined && (!Number.isFinite(Number(durationMinutes)) || Number(durationMinutes) < 15)) {
      return res.status(400).json({ message: 'durationMinutes must be at least 15 minutes' });
    }

    if (
      maxAttendees !== undefined &&
      (!Number.isFinite(Number(maxAttendees)) || Number(maxAttendees) < 1)
    ) {
      return res.status(400).json({ message: 'maxAttendees must be at least 1' });
    }

    // Convert the form payload into the Event model shape used by MongoDB.
    const event = await Event.create({
      title,
      description,
      category,
      dateTime: parsedDateTime,
      isPaid,
      priceAmount: isPaid ? Number(priceAmount || 0) : 0,
      ticketUrl,
      contactNumber,
      city,
      address,
      maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
      bookedSlots: bookedSlots !== undefined && bookedSlots !== '' ? Number(bookedSlots) : 0,
      bookingsOpen: bookingsOpen !== undefined ? Boolean(bookingsOpen) : true,
      participationType: participationType === 'team' ? 'team' : 'individual',
      minTeamSize: participationType === 'team' ? Number(minTeamSize || 2) : 1,
      durationMinutes: Number(durationMinutes || 60),
      ageMin: ageMin !== undefined && ageMin !== '' ? Number(ageMin) : 0,
      ageMax: ageMax !== undefined && ageMax !== '' ? Number(ageMax) : 99,
      genderPreference: genderPreference || 'any',
      tags: Array.isArray(tags) ? tags : [],
      // Convert UI-friendly {lat,lng} into GeoJSON [lng,lat].
      location: {
        type: 'Point',
        coordinates: [Number(location.lng), Number(location.lat)],
      },
      createdBy: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Could not create event', error: error.message });
  }
};

const getMyHostedEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }).sort({ dateTime: 1 }).lean();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Could not load hosted events', error: error.message });
  }
};

const updateHostedEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!event) {
      return res.status(404).json({ message: 'Hosted event not found' });
    }

    const allowedFields = [
      'title',
      'description',
      'category',
      'dateTime',
      'isPaid',
      'priceAmount',
      'ticketUrl',
      'contactNumber',
      'city',
      'address',
      'maxAttendees',
      'bookedSlots',
      'bookingsOpen',
      'participationType',
      'minTeamSize',
      'durationMinutes',
      'ageMin',
      'ageMax',
      'genderPreference',
      'tags',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    }

    if (req.body.location?.lat !== undefined && req.body.location?.lng !== undefined) {
      event.location = {
        type: 'Point',
        coordinates: [Number(req.body.location.lng), Number(req.body.location.lat)],
      };
    }

    if (req.body.dateTime !== undefined) {
      const parsedDateTime = new Date(req.body.dateTime);
      if (Number.isNaN(parsedDateTime.getTime())) {
        return res.status(400).json({ message: 'dateTime must be a valid date' });
      }

      event.dateTime = parsedDateTime;
    }

    if (req.body.maxAttendees !== undefined && Number(req.body.maxAttendees) < 1) {
      return res.status(400).json({ message: 'maxAttendees must be at least 1' });
    }

    if (req.body.bookedSlots !== undefined && Number(req.body.bookedSlots) < 0) {
      return res.status(400).json({ message: 'bookedSlots must be 0 or higher' });
    }

    if (
      req.body.maxAttendees !== undefined &&
      req.body.bookedSlots !== undefined &&
      Number(req.body.bookedSlots) > Number(req.body.maxAttendees)
    ) {
      return res.status(400).json({ message: 'bookedSlots cannot exceed maxAttendees' });
    }

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Could not update hosted event', error: error.message });
  }
};

const deleteHostedEvent = async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: 'Hosted event not found' });
    }

    res.json({ message: 'Hosted event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete hosted event', error: error.message });
  }
};

const getNearbyEvents = async (req, res) => {
  try {
    const { lat, lng, radius = 30000, category, city, timeWindowHours: rawTimeWindowHours } = req.query;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const parsedRadius = Number(radius) || 30000;

    if (lat === undefined || lng === undefined || Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      return res.status(400).json({ message: 'Valid lat and lng query params are required' });
    }

    const now = new Date();
    const timeWindowHours =
      rawTimeWindowHours !== undefined && rawTimeWindowHours !== ''
        ? Number(rawTimeWindowHours)
        : null;

    if (timeWindowHours !== null && (Number.isNaN(timeWindowHours) || timeWindowHours < 0)) {
      return res.status(400).json({ message: 'timeWindowHours must be a non-negative number when provided' });
    }

    // By default, only show upcoming events. If a time window is provided,
    // narrow the external provider query to now through the computed end time.
    let endTime = null;
    if (timeWindowHours !== null) {
      endTime = new Date(now.getTime() + timeWindowHours * 60 * 60 * 1000);
    }

    const localQuery = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parsedLng, parsedLat],
          },
          $maxDistance: parsedRadius,
        },
      },
      dateTime: endTime ? { $gte: now, $lte: endTime } : { $gte: now },
      ...(category ? { category } : {}),
    };

    const localEvents = (await Event.find(localQuery).limit(100).lean()).map((event) => ({
      ...event,
      source: 'mixup',
    }));

    let externalEvents = [];
    try {
      externalEvents = await fetchSerpApiGoogleEvents({
        city,
        lat: parsedLat,
        lng: parsedLng,
        radiusInMeters: parsedRadius,
        category,
        startDateTime: now,
        endDateTime: endTime,
      });
    } catch (externalError) {
      console.error('Could not fetch SerpApi events', externalError.message);
      if (!localEvents.length) {
        return res.status(502).json({
          message: 'Could not fetch SerpApi events',
          error: externalError.message,
        });
      }
    }

    const events = [...localEvents, ...externalEvents].sort(
      (left, right) => new Date(left.dateTime).getTime() - new Date(right.dateTime).getTime()
    );

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch nearby events', error: error.message });
  }
};

module.exports = { createEvent, getNearbyEvents, getMyHostedEvents, updateHostedEvent, deleteHostedEvent };
