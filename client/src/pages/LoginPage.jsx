import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(form);
      navigate('/map');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-ink">
      <section className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden overflow-hidden bg-ink lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#111827_0%,#203038_46%,#f9735b_130%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between px-12 py-10 text-white">
            <Link to="/login" className="text-2xl font-black tracking-normal">
              MixUp
            </Link>

            <div className="max-w-xl">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-mint">Social plans, made local</p>
              <h1 className="mt-5 text-6xl font-black leading-[0.95] tracking-normal">
                Find your next crowd before the night starts.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-200">
                Discover nearby events, meet people around shared hobbies, and turn plans into actual plans.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-3xl font-black">8</p>
                  <p className="mt-1 text-sm text-slate-200">interest lanes</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-3xl font-black">5 km</p>
                  <p className="mt-1 text-sm text-slate-200">nearby radius</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-3xl font-black">2</p>
                  <p className="mt-1 text-sm text-slate-200">ways to match</p>
                </div>
              </div>

              <div className="relative h-64 max-w-xl rounded-lg border border-white/15 bg-white p-4 text-ink shadow-soft">
                <div className="grid h-full grid-cols-[1.1fr_0.9fr] gap-4">
                  <div className="overflow-hidden rounded bg-[#e9efe9]">
                    <div className="h-full w-full bg-[linear-gradient(90deg,rgba(17,24,39,.14)_1px,transparent_1px),linear-gradient(0deg,rgba(17,24,39,.12)_1px,transparent_1px)] bg-[size:34px_34px] p-4">
                      <div className="ml-12 mt-8 h-3 w-28 rounded bg-coral" />
                      <div className="ml-24 mt-10 h-3 w-20 rounded bg-mint" />
                      <div className="ml-5 mt-12 h-3 w-24 rounded bg-ink" />
                      <div className="ml-32 mt-8 h-3 w-16 rounded bg-coral" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Tonight</p>
                      <h2 className="mt-2 text-2xl font-black">Indie Night Jam</h2>
                      <p className="mt-2 text-sm text-slate-600">Live bands, open tables, good overlap.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="rounded bg-slate-100 px-3 py-2 text-sm font-bold">Music concerts</div>
                      <div className="rounded bg-slate-100 px-3 py-2 text-sm font-bold">Open mic</div>
                      <div className="rounded bg-ink px-3 py-2 text-sm font-bold text-white">5 matches nearby</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link to="/login" className="text-3xl font-black tracking-normal text-ink">
                MixUp
              </Link>
              <h1 className="mt-5 text-4xl font-black leading-tight text-ink">Find your next crowd.</h1>
              <p className="mt-3 text-slate-600">Sign in to discover events and people around shared hobbies.</p>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <div className="mb-4 flex justify-end">
                <ThemeToggle compact />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-coral">Welcome back</p>
                <h2 className="mt-3 text-3xl font-black text-ink">Sign in to MixUp</h2>
                <p className="mt-2 text-sm text-slate-600">Your map, matches, and plans are waiting.</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-ink focus:ring-4 focus:ring-slate-100"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  <input
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-ink focus:ring-4 focus:ring-slate-100"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </label>

                {error && <p className="rounded bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded bg-ink px-4 py-3 font-black text-white shadow-sm transition hover:bg-coral disabled:opacity-60"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="text-center text-sm text-slate-600">
                  New here?{' '}
                  <Link className="font-black text-coral hover:text-ink" to="/register">
                    Create an account
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
