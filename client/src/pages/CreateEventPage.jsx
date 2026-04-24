import { useMemo, useState } from 'react';
import EventLocationPicker from '../components/EventLocationPicker';
import { createEvent } from '../api/eventsApi';
import { useAuth } from '../context/useAuth';
import { findCityByName } from '../data/cityLocations';

const categories = [
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'dance', label: 'Dance' },
  { value: 'other', label: 'Workshops / Festivals / Other' },
];

const genderOptions = [
  { value: 'any', label: 'Open to all' },
  { value: 'women', label: 'Women only' },
  { value: 'men', label: 'Men only' },
  { value: 'non_binary', label: 'Non-binary only' },
  { value: 'mixed', label: 'Mixed group' },
];

const initialForm = (user) => ({
  title: '',
  description: '',
  category: 'music',
  date: '',
  time: '',
  city: user?.city || '',
  address: '',
  latitude: '',
  longitude: '',
  isPaid: false,
  priceAmount: '',
  ticketUrl: '',
  contactNumber: '',
  maxAttendees: '',
  participationType: 'individual',
  minTeamSize: '2',
  durationHours: '2',
  durationMinutes: '0',
  ageMin: '18',
  ageMax: '40',
  genderPreference: 'any',
  tags: '',
});

const defaultLocation = { lat: 28.6139, lng: 77.209 };

const CreateEventPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm(user));
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [showTicketTooltip, setShowTicketTooltip] = useState(false);

  const selectedPosition =
    form.latitude !== '' && form.longitude !== ''
      ? { lat: Number(form.latitude), lng: Number(form.longitude) }
      : null;
  const mapCenter = selectedPosition || findCityByName(form.city) || findCityByName(user?.city) || defaultLocation;

  const submitDisabled = useMemo(
    () =>
      !form.title ||
      !form.description ||
      !form.category ||
      !form.date ||
      !form.time ||
      !form.durationHours ||
      form.latitude === '' ||
      form.longitude === '',
    [form]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUseProfileCity = () => {
    const cityLocation = findCityByName(form.city || user?.city);
    if (!cityLocation) {
      setError('Could not find coordinates for the selected city.');
      return;
    }

    setForm((current) => ({
      ...current,
      city: cityLocation.city,
      latitude: cityLocation.lat.toFixed(6),
      longitude: cityLocation.lng.toFixed(6),
    }));
    setError('');
  };

  const handleLocationSelect = ({ lat, lng }) => {
    setForm((current) => ({
      ...current,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    setIsLocationPickerOpen(false);
    setError('');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setError('');
      },
      () => {
        setError('Could not fetch your current location.');
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      if (!form.title || !form.description || !form.category || !form.date || !form.time) {
        throw new Error('Please fill in the required event details.');
      }

      if (form.latitude === '' || form.longitude === '') {
        throw new Error('Please select the event location on the map.');
      }

      const dateTime = new Date(`${form.date}T${form.time}`);
      if (Number.isNaN(dateTime.getTime())) {
        throw new Error('Please provide a valid date and time.');
      }

      const durationMinutes = Number(form.durationHours || 0) * 60 + Number(form.durationMinutes || 0);
      if (!durationMinutes || durationMinutes < 15) {
        throw new Error('Please provide an event duration of at least 15 minutes.');
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        dateTime: dateTime.toISOString(),
        isPaid: form.isPaid,
        priceAmount: form.isPaid ? Number(form.priceAmount || 0) : 0,
        ticketUrl: form.ticketUrl.trim(),
        contactNumber: form.contactNumber.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        location: {
          lat: Number(form.latitude),
          lng: Number(form.longitude),
        },
        ...(form.maxAttendees ? { maxAttendees: Number(form.maxAttendees) } : {}),
        participationType: form.participationType,
        minTeamSize: form.participationType === 'team' ? Number(form.minTeamSize || 2) : 1,
        durationMinutes,
        ageMin: Number(form.ageMin || 0),
        ageMax: Number(form.ageMax || 99),
        genderPreference: form.genderPreference,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await createEvent(payload);
      setNotice('Event created successfully.');
      setForm(initialForm(user));
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || 'Could not create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-ink">Host an event</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Publish a custom MixUp event with audience rules, capacity, team settings, pricing, and the key logistics
          people need before joining.
        </p>
      </div>

      {(notice || error) && (
        <div
          className={`mb-5 rounded-lg p-4 text-sm font-semibold shadow-sm ${
            error ? 'bg-red-50 text-red-700' : 'bg-white text-slate-700'
          }`}
        >
          {error || notice}
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <section className="rounded-2xl bg-white p-6 shadow-soft">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-coral">Hosted on MixUp</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Event details</h2>
            <p className="mt-2 text-sm text-slate-600">
              Hosted events appear on the map with blue markers so people can discover and join the experiences you
              organize directly inside MixUp.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Title</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  placeholder="MixUp open mic night"
                  required
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  placeholder="Tell people what to expect, who it is for, and what makes it fun."
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Category</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">City</span>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  placeholder="Varanasi"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Date</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Time</span>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  required
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Address</span>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  placeholder="Assi Ghat, Varanasi"
                />
              </label>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700">Pick event location on map</span>
                  {selectedPosition ? (
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedPosition.lat.toFixed(5)}, {selectedPosition.lng.toFixed(5)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">Click anywhere on the map to drop a pin</span>
                  )}
                </div>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsLocationPickerOpen((current) => !current)}
                      className="rounded-full bg-ink px-4 py-2 text-sm font-black text-white transition hover:bg-coral"
                    >
                      {isLocationPickerOpen ? 'Hide map picker' : 'Open map picker'}
                    </button>
                    {selectedPosition ? (
                      <p className="text-sm font-semibold text-slate-600">
                        Selected pin: {selectedPosition.lat.toFixed(5)}, {selectedPosition.lng.toFixed(5)}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-slate-600">
                        No pin selected yet. Open the picker and tap the map.
                      </p>
                    )}
                  </div>

                  {isLocationPickerOpen && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-slate-600">
                        Tap anywhere on the map to place the event pin. The picker closes automatically after selection.
                      </p>
                      <EventLocationPicker
                        center={mapCenter}
                        selectedPosition={selectedPosition}
                        onSelect={handleLocationSelect}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUseProfileCity}
                className="rounded border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700"
              >
                Use profile city center
              </button>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="rounded border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700"
              >
                Use current location
              </button>
              <label className="inline-flex items-center gap-2 rounded bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="isPaid" checked={form.isPaid} onChange={handleChange} />
                Paid event
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Participation</span>
                <select
                  name="participationType"
                  value={form.participationType}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team event</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Maximum slots</span>
                <input
                  type="number"
                  min="1"
                  name="maxAttendees"
                  value={form.maxAttendees}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  placeholder="50"
                />
              </label>

              {form.participationType === 'team' && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Minimum team size</span>
                  <input
                    type="number"
                    min="2"
                    name="minTeamSize"
                    value={form.minTeamSize}
                    onChange={handleChange}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                    placeholder="2"
                  />
                </label>
              )}

              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Duration hours</span>
                  <input
                    type="number"
                    min="0"
                    name="durationHours"
                    value={form.durationHours}
                    onChange={handleChange}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Extra minutes</span>
                  <select
                    name="durationMinutes"
                    value={form.durationMinutes}
                    onChange={handleChange}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  >
                    <option value="0">0</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span>Ticket URL</span>
                  <button
                    type="button"
                    onMouseEnter={() => setShowTicketTooltip(true)}
                    onMouseLeave={() => setShowTicketTooltip(false)}
                    onFocus={() => setShowTicketTooltip(true)}
                    onBlur={() => setShowTicketTooltip(false)}
                    className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-xs font-black text-slate-700"
                    aria-label="Ticket URL help"
                  >
                    ?
                  </button>
                </span>
                <div className="relative">
                  {showTicketTooltip && (
                    <div className="absolute left-0 top-0 z-10 -translate-y-[calc(100%+0.5rem)] rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white shadow-soft">
                      Add a Google Form link etc. for collecting booking details.
                    </div>
                  )}
                  <input
                    name="ticketUrl"
                    value={form.ticketUrl}
                    onChange={handleChange}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                    placeholder="https://..."
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Price amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="priceAmount"
                  value={form.priceAmount}
                  onChange={handleChange}
                  disabled={!form.isPaid}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink disabled:bg-slate-100"
                  placeholder="499"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Contact number</span>
                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  placeholder="+91 98765 43210"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Minimum age</span>
                <input
                  type="number"
                  min="0"
                  name="ageMin"
                  value={form.ageMin}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Maximum age</span>
                <input
                  type="number"
                  min="0"
                  name="ageMax"
                  value={form.ageMax}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Gender specification</span>
                <select
                  name="genderPreference"
                  value={form.genderPreference}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Tags</span>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  placeholder="open mic, indie, riverside"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || submitDisabled}
              className="w-full rounded bg-ink px-5 py-4 text-base font-black text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing event...' : 'Publish event'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default CreateEventPage;
