import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import InterestPicker from '../components/InterestPicker';
import { useAuth } from '../context/useAuth';
import { findCityLocation, findNearestCity, getCitiesForState, getStates } from '../data/cityLocations';
import { normalizeCustomInterest } from '../data/interests';

const states = getStates();

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
    interests: '',
    state: 'Delhi',
    city: 'New Delhi',
  });
  const [selectedInterests, setSelectedInterests] = useState([
    'music_concerts',
    'stand_up_comedy',
    'football_soccer_matches',
  ]);
  const [error, setError] = useState('');
  const [locationNotice, setLocationNotice] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cities = getCitiesForState(form.state);

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

  const handleDetectLocation = () => {
    setError('');
    setLocationNotice('');

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
        setLocationNotice(`Detected nearest supported city: ${nearestCity.city}, ${nearestCity.state}`);
        setIsDetectingLocation(false);
      },
      () => {
        setError('Location permission was denied or unavailable. Please choose your city manually.');
        setIsDetectingLocation(false);
      }
    );
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const selectedCity = findCityLocation(form.state, form.city);
    const customInterests = form.interests
      .split(',')
      .map(normalizeCustomInterest)
      .filter(Boolean);
    const interests = [...new Set([...selectedInterests, ...customInterests])];

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      bio: form.bio,
      state: form.state,
      city: form.city,
      interests,
    };

    if (selectedCity) {
      payload.cityLocation = { lat: selectedCity.lat, lng: selectedCity.lng };
    }

    try {
      await register(payload);
      navigate('/map');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f4] px-4 py-8">
      <section className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-soft">
        <div className="flex justify-end">
          <ThemeToggle compact />
        </div>
        <h1 className="text-3xl font-black text-ink">Create your MixUp profile</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Name</span>
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink" name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink" name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink" name="password" type="password" value={form.password} onChange={handleChange} required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Bio</span>
            <textarea className="mt-1 min-h-20 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink" name="bio" value={form.bio} onChange={handleChange} />
          </label>
          <section className="space-y-4">
            <InterestPicker selectedInterests={selectedInterests} onToggleInterest={toggleInterest} />

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Custom interests</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
                name="interests"
                value={form.interests}
                onChange={handleChange}
                placeholder="Add anything missing, separated by commas"
              />
            </label>
          </section>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">State</span>
              <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink" name="state" value={form.state} onChange={handleChange}>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">City</span>
              <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink" name="city" value={form.city} onChange={handleChange}>
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
          {locationNotice && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{locationNotice}</p>}
          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded bg-ink px-4 py-3 font-bold text-white disabled:opacity-60">
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link className="font-bold text-coral" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
};

export default RegisterPage;
