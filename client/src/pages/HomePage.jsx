import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/useAuth';

const featureCards = [
  {
    title: 'Live city event discovery',
    description: 'Browse nearby events pulled in through SerpAPI with radius controls based on either your location or the city center you want to explore.',
  },
  {
    title: 'Host your own plans',
    description: 'Create custom MixUp events with slots, team settings, age rules, pricing, duration, and a map-picked location.',
  },
  {
    title: 'People around shared interests',
    description: 'Jump from an event idea into matching with people who are into the same vibe, hobby, or night out.',
  },
];

const highlights = [
  'SerpAPI-powered local event map',
  'Hosted custom events with rich details',
  'Interest-based matching',
  'Chat for turning overlap into plans',
];

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f4] text-ink">
      <div className="hero-backdrop pointer-events-none absolute inset-x-0 top-0 h-[32rem]" />

      <div className="hero-stage-shell relative z-10 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="hero-stage relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] px-4 pb-16 pt-3 sm:px-6 lg:px-8">
          {isAuthenticated ? (
            <Navbar />
          ) : (
            <header>
              <div className="liquid-glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-3">
                <Link to="/" className="text-xl font-black tracking-normal text-ink">
                  MixUp
                </Link>
                <div className="hidden items-center gap-2 sm:flex">
                  <a
                    href="#features"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-ink"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-ink"
                  >
                    How it works
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle compact />
                  <Link
                    to="/login"
                    className="rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-ink"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-ink px-4 py-2 text-sm font-black text-white transition hover:bg-coral"
                  >
                    Join now
                  </Link>
                </div>
              </div>
            </header>
          )}

          <section className="pt-10 lg:pt-12">
        <div className="mx-auto grid max-w-6xl items-stretch gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hero-copy-glass flex flex-col justify-center rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <p className="inline-flex rounded-full border border-coral/20 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-coral shadow-sm backdrop-blur">
              {isAuthenticated ? `Welcome back, ${user?.name || 'there'}.` : 'Discover events. Find your people.'}
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.03em] text-ink sm:text-6xl">
              MixUp helps people turn nearby events into real social plans.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              MixUp combines nearby event discovery, hosted meetups, and social matching so people can browse city
              events, host their own gatherings, and move from browsing to actual plans much faster.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/events/create"
                    className="rounded-full bg-ink px-6 py-3 text-sm font-black text-white shadow-soft transition hover:bg-coral"
                  >
                    Host an event
                  </Link>
                  <Link
                    to="/map"
                    className="rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-ink hover:text-ink"
                  >
                    Explore the map
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="rounded-full bg-ink px-6 py-3 text-sm font-black text-white shadow-soft transition hover:bg-coral"
                  >
                    Create your profile
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-ink hover:text-ink"
                  >
                    Explore the app
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-700 shadow-[0_16px_40px_rgba(17,24,39,.08)] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-mint/35 blur-3xl" />
            <div className="absolute -right-8 top-0 h-32 w-32 rounded-full bg-coral/30 blur-3xl" />
            <div className="hero-glass relative overflow-hidden rounded-[2rem] p-5">
              <div className="hero-glass-inner rounded-[1.5rem] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Tonight near you</p>
                    <h2 className="mt-2 text-2xl font-black">Event-first discovery</h2>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-coral">
                    MVP
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                  <div className="overflow-hidden rounded-[1.25rem] border border-white/70 bg-[#dfeee9] p-4">
                    <div className="grid h-64 gap-3 rounded-[1rem] bg-[linear-gradient(90deg,rgba(17,24,39,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(17,24,39,.08)_1px,transparent_1px)] bg-[size:30px_30px] p-4">
                      <div className="hero-map-chip ml-3 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black shadow-sm">
                        <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                        SerpAPI event marker
                      </div>
                      <div className="hero-map-chip ml-auto mt-3 w-fit rounded-full px-3 py-2 text-xs font-black shadow-sm">
                        30 km radius
                      </div>
                      <div className="mt-8 flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full bg-ink ring-4 ring-white/70" />
                        <span className="hero-map-chip rounded-full px-3 py-2 text-xs font-bold shadow-sm">
                          Your location
                        </span>
                      </div>
                      <div className="ml-14 mt-3 h-4 w-4 rounded-full bg-coral ring-4 ring-white/75 shadow-sm" />
                      <div className="ml-28 mt-6 h-4 w-4 rounded-full bg-coral ring-4 ring-white/75 shadow-sm" />
                      <div className="ml-8 mt-3 h-4 w-4 rounded-full bg-coral ring-4 ring-white/75 shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Featured flow</p>
                      <h3 className="mt-2 text-xl font-black">See it or host it</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Pull real event listings into the app, then layer hosted MixUp events on top for custom plans.
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-ink p-4 text-white shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">Then do this</p>
                      <h3 className="mt-2 text-xl font-black">Match and message</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Use the same event energy to start chats with people who want similar plans.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </section>
        </div>
      </div>

      <section id="features" className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-coral">Why it exists</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">A lighter way to get people from browsing to hanging out.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              MixUp is built for the gap between “something is happening nearby” and “I actually have people to go
              with.” The MVP stays focused on that exact moment.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_45px_rgba(17,24,39,.08)] backdrop-blur-xl"
              >
                <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-coral to-mint" />
                <h3 className="mt-5 text-2xl font-black text-ink">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(17,24,39,.96),rgba(32,48,56,.92),rgba(249,115,91,.90))] p-8 text-white shadow-[0_30px_90px_rgba(17,24,39,.18)] sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-mint">How it works</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <h2 className="text-3xl font-black sm:text-4xl">Discover what is happening, then find who wants in.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
                The product starts with nearby events from SerpAPI, adds custom hosted events from MixUp users, then
                layers social discovery on top so people can coordinate around something concrete instead of chatting in
                a vacuum.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-black">1</p>
                <p className="mt-2 text-sm text-slate-200">Open the map and browse live event markers.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-black">2</p>
                <p className="mt-2 text-sm text-slate-200">Use shared interests to discover compatible people.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-black">3</p>
                <p className="mt-2 text-sm text-slate-200">Move into chat and turn intent into an actual plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
