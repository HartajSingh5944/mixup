import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SwipeDeck from '../components/SwipeDeck';
import { getCandidates, sendMatchAction } from '../api/matchApi';
import { useAuth } from '../context/useAuth';
import { getInterestLabel } from '../data/interests';

const MatchPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({ interest: '', radius: '10000' });
  const [notice, setNotice] = useState('');
  const [swipeToast, setSwipeToast] = useState(null);
  const [matchCard, setMatchCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      setIsLoading(true);
      setNotice('');

      try {
        const { data } = await getCandidates(filters);
        setCandidates(data);
      } catch (apiError) {
        setNotice(apiError.response?.data?.message || 'Could not load candidates.');
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [filters]);

  useEffect(() => {
    if (!swipeToast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSwipeToast(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [swipeToast]);

  const handleFilterChange = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSwipe = async (candidate, direction) => {
    if (!['left', 'right'].includes(direction)) {
      return;
    }

    const action = direction === 'right' ? 'like' : 'pass';
    setCandidates((current) => current.filter((item) => (item._id || item.id) !== (candidate._id || candidate.id)));
    setSwipeToast({
      id: Date.now(),
      message: `You swapped ${direction === 'right' ? 'right' : 'left'} on ${candidate.name}`,
      action,
    });

    try {
      const { data } = await sendMatchAction({ targetUserId: candidate._id, action });
      if (data.isMutual) {
        setMatchCard({
          userName: candidate.name,
          conversationId: data.conversation?._id,
        });
        setNotice(`You matched with ${candidate.name}.`);
      } else {
        setNotice(`${action === 'like' ? 'Liked' : 'Passed on'} ${candidate.name}.`);
      }
    } catch (apiError) {
      setNotice(apiError.response?.data?.message || 'Could not save swipe action.');
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col px-4 py-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink">Social matching</h1>
          <p className="mt-1 text-sm text-slate-600">Swipe right to like, left to pass.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <span className="rounded bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm">Left: pass</span>
          <span className="rounded bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm">Right: like</span>
        </div>
      </div>

      <section className="mb-5 grid gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Looking for</span>
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
            name="interest"
            value={filters.interest}
            onChange={handleFilterChange}
          >
            <option value="">Any shared hobby</option>
            {user?.interests?.map((interest) => (
              <option key={interest} value={interest}>
                {getInterestLabel(interest)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Distance radius</span>
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-ink"
            name="radius"
            value={filters.radius}
            onChange={handleFilterChange}
          >
            <option value="2000">2 km</option>
            <option value="5000">5 km</option>
            <option value="10000">10 km</option>
            <option value="25000">25 km</option>
            <option value="50000">50 km</option>
            <option value="">Anywhere</option>
          </select>
        </label>
      </section>

      {notice && <p className="mb-4 rounded bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">{notice}</p>}
      {matchCard && (
        <section className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Match confirmed</p>
          <h2 className="mt-2 text-2xl font-black text-ink">You Matched With {matchCard.userName}!</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">
            Start the conversation while the match is fresh. Jump to chat, say hi, and begin planning a meetup around
            one of your shared interests.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/chat?conversation=${matchCard.conversationId}`)}
              className="rounded bg-emerald-600 px-4 py-3 text-sm font-black text-white"
            >
              Jump to chat
            </button>
            <button
              type="button"
              onClick={() => setMatchCard(null)}
              className="rounded border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-700"
            >
              Keep swiping
            </button>
          </div>
        </section>
      )}
      {isLoading ? (
        <div className="grid flex-1 place-items-center text-sm font-semibold text-slate-600">Loading candidates...</div>
      ) : (
        <SwipeDeck candidates={candidates} onSwipe={handleSwipe} />
      )}
      {swipeToast && (
        <div
          key={swipeToast.id}
          className={`fixed bottom-5 left-1/2 z-[1200] -translate-x-1/2 rounded px-4 py-3 text-sm font-black text-white shadow-soft ${
            swipeToast.action === 'like' ? 'bg-emerald-600' : 'bg-slate-800'
          }`}
        >
          {swipeToast.message}
        </div>
      )}
    </main>
  );
};

export default MatchPage;
