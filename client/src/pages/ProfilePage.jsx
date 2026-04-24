import { useEffect, useState } from 'react';
import { deleteHostedEvent, getMyHostedEvents, updateHostedEvent } from '../api/eventsApi';
import InterestPicker from '../components/InterestPicker';
import { useAuth } from '../context/useAuth';
import { findCityLocation, findNearestCity, getCitiesForState, getStates } from '../data/cityLocations';
import { normalizeCustomInterest } from '../data/interests';

const states = getStates();

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const initialState = user?.state || 'Delhi';
  const initialCity = user?.city || getCitiesForState(initialState)[0]?.city || 'New Delhi';
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    state: initialState,
    city: initialCity,
    customInterests: '',
  });
  const [selectedInterests, setSelectedInterests] = useState(user?.interests || []);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hostedEvents, setHostedEvents] = useState([]);
  const [hostedEventEdits, setHostedEventEdits] = useState({});
  const [hostedNotice, setHostedNotice] = useState('');
  const [hostedError, setHostedError] = useState('');
  const [isLoadingHostedEvents, setIsLoadingHostedEvents] = useState(true);
  const cities = getCitiesForState(form.state);

  useEffect(() => {
    const loadHostedEvents = async () => {
      setIsLoadingHostedEvents(true);
      setHostedError('');

      try {
        const { data } = await getMyHostedEvents();
        setHostedEvents(data);
        setHostedEventEdits(
          Object.fromEntries(
            data.map((event) => [
              event._id,
              {
                title: event.title || '',
                bookedSlots: String(event.bookedSlots || 0),
                maxAttendees: String(event.maxAttendees || ''),
                bookingsOpen: event.bookingsOpen !== false,
                contactNumber: event.contactNumber || '',
                ticketUrl: event.ticketUrl || '',
              },
            ])
          )
        );
      } catch (apiError) {
        setHostedError(apiError.response?.data?.message || 'Could not load hosted events.');
      } finally {
        setIsLoadingHostedEvents(false);
      }
    };

    loadHostedEvents();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === 'state') {
        const nextCity = getCitiesForState(value)[0]?.city || '';
        return { ...current, state: value, city: nextCity };
      }

      return { ...current, [name]: value };
    });
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]
    );
  };

  const handleHostedEditChange = (eventId, field, value) => {
    setHostedEventEdits((current) => ({
      ...current,
      [eventId]: {
        ...current[eventId],
        [field]: value,
      },
    }));
  };

  const handleHostedEventSave = async (eventId) => {
    setHostedNotice('');
    setHostedError('');

    try {
      const draft = hostedEventEdits[eventId];
      const { data } = await updateHostedEvent(eventId, {
        title: draft.title.trim(),
        bookedSlots: Number(draft.bookedSlots || 0),
        maxAttendees: draft.maxAttendees ? Number(draft.maxAttendees) : undefined,
        bookingsOpen: Boolean(draft.bookingsOpen),
        contactNumber: draft.contactNumber.trim(),
        ticketUrl: draft.ticketUrl.trim(),
      });

      setHostedEvents((current) => current.map((event) => (event._id === eventId ? data : event)));
      setHostedNotice('Hosted event updated.');
    } catch (apiError) {
      setHostedError(apiError.response?.data?.message || 'Could not update hosted event.');
    }
  };

  const handleHostedEventDelete = async (eventId) => {
    setHostedNotice('');
    setHostedError('');

    try {
      await deleteHostedEvent(eventId);
      setHostedEvents((current) => current.filter((event) => event._id !== eventId));
      setHostedEventEdits((current) => {
        const next = { ...current };
        delete next[eventId];
        return next;
      });
      setHostedNotice('Hosted event deleted.');
    } catch (apiError) {
      setHostedError(apiError.response?.data?.message || 'Could not delete hosted event.');
    }
  };

  const handleDetectLocation = () => {
    setError('');
    setNotice('');

    if (!navigator.geolocation) {
      setError('Your browser does not support location detection.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearestCity = findNearestCity({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setForm((current) => ({
          ...current,
          state: nearestCity.state,
          city: nearestCity.city,
        }));
        setNotice(`Detected nearest supported city: ${nearestCity.city}, ${nearestCity.state}`);
        setIsDetectingLocation(false);
      },
      () => {
        setError('Location permission was denied or unavailable. Please choose your city manually.');
        setIsDetectingLocation(false);
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    const selectedCity = findCityLocation(form.state, form.city);
    const customInterests = form.customInterests
      .split(',')
      .map(normalizeCustomInterest)
      .filter(Boolean);

    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        state: form.state,
        city: form.city,
        interests: [...new Set([...selectedInterests, ...customInterests])],
        ...(selectedCity ? { cityLocation: { lat: selectedCity.lat, lng: selectedCity.lng } } : {}),
      });
      setForm((current) => ({ ...current, customInterests: '' }));
      setSelectedInterests((current) => [...new Set([...current, ...customInterests])]);
      setNotice('Profile updated.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <section className="rounded-lg bg-white p-6 shadow-soft">
        <div>
          <h1 className="text-3xl font-black text-ink">Edit profile</h1>
          <p className="mt-1 text-sm text-slate-600">Update the public details people see while matching.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Name</span>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Bio</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
              name="bio"
              value={form.bio}
              onChange={handleChange}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">State</span>
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
                name="state"
                value={form.state}
                onChange={handleChange}
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">City</span>
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
                name="city"
                value={form.city}
                onChange={handleChange}
              >
                {cities.map((location) => (
                  <option key={location.city} value={location.city}>
                    {location.city}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="w-full rounded border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 hover:border-ink hover:text-ink disabled:opacity-60"
          >
            {isDetectingLocation ? 'Detecting location...' : 'Auto detect location'}
          </button>

          <InterestPicker selectedInterests={selectedInterests} onToggleInterest={toggleInterest} />

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Custom interests</span>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
              name="customInterests"
              value={form.customInterests}
              onChange={handleChange}
              placeholder="Add anything missing, separated by commas"
            />
          </label>

          {notice && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-ink px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg bg-white p-6 shadow-soft">
        <div>
          <h2 className="text-2xl font-black text-ink">Hosted events</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage bookings for the events you created, update organiser contact details, or remove an event.
          </p>
        </div>

        {hostedNotice && <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-800">{hostedNotice}</p>}
        {hostedError && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{hostedError}</p>}

        {isLoadingHostedEvents ? (
          <p className="mt-4 text-sm font-semibold text-slate-600">Loading hosted events...</p>
        ) : hostedEvents.length ? (
          <div className="mt-5 space-y-4">
            {hostedEvents.map((hostedEvent) => {
              const draft = hostedEventEdits[hostedEvent._id] || {};

              return (
                <article key={hostedEvent._id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-coral">Hosted on MixUp</p>
                      <h3 className="mt-2 text-xl font-black text-ink">{hostedEvent.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(hostedEvent.dateTime))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleHostedEventDelete(hostedEvent._id)}
                      className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600"
                    >
                      Delete event
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Title</span>
                      <input
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
                        value={draft.title || ''}
                        onChange={(event) => handleHostedEditChange(hostedEvent._id, 'title', event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Contact number</span>
                      <input
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
                        value={draft.contactNumber || ''}
                        onChange={(event) =>
                          handleHostedEditChange(hostedEvent._id, 'contactNumber', event.target.value)
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Booked slots</span>
                      <input
                        type="number"
                        min="0"
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
                        value={draft.bookedSlots || '0'}
                        onChange={(event) => handleHostedEditChange(hostedEvent._id, 'bookedSlots', event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Maximum slots</span>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
                        value={draft.maxAttendees || ''}
                        onChange={(event) => handleHostedEditChange(hostedEvent._id, 'maxAttendees', event.target.value)}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-sm font-semibold text-slate-700">Ticket / booking link</span>
                      <input
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
                        value={draft.ticketUrl || ''}
                        onChange={(event) => handleHostedEditChange(hostedEvent._id, 'ticketUrl', event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 rounded bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.bookingsOpen)}
                        onChange={(event) =>
                          handleHostedEditChange(hostedEvent._id, 'bookingsOpen', event.target.checked)
                        }
                      />
                      Booking open
                    </label>
                    <button
                      type="button"
                      onClick={() => handleHostedEventSave(hostedEvent._id)}
                      className="rounded bg-ink px-4 py-3 text-sm font-black text-white"
                    >
                      Save hosted event
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">You have not hosted any events yet.</p>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
