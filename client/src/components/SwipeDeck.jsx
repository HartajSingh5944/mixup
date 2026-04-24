import { createRef, useMemo } from 'react';
import TinderCard from 'react-tinder-card';
import { getInterestLabel } from '../data/interests';

const SwipeDeck = ({ candidates, onSwipe }) => {
  const childRefs = useMemo(
    () =>
      Array(candidates.length)
        .fill(0)
        .map(() => createRef()),
    [candidates.length]
  );
  const topCandidateIndex = candidates.length - 1;
  const canSwipe = topCandidateIndex >= 0;

  const swipeTopCard = async (direction) => {
    if (!canSwipe) {
      return;
    }

    await childRefs[topCandidateIndex].current?.swipe(direction);
  };

  if (!candidates.length) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div>
          <h2 className="text-2xl font-black text-ink">No new people yet</h2>
          <p className="mt-2 text-slate-600">Add more interests or invite friends to create the first pool.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl select-none items-center justify-center gap-4 lg:gap-6">
      <div className="hidden lg:flex lg:w-28 lg:justify-end">
        <button
          type="button"
          onClick={() => swipeTopCard('left')}
          disabled={!canSwipe}
          className="match-action-button match-action-pass flex h-20 w-20 items-center justify-center rounded-full text-lg font-black shadow-soft transition hover:scale-105 disabled:opacity-50"
        >
          Pass
        </button>
      </div>

      <div className="w-full max-w-sm select-none">
        <div className="relative h-[68vh] max-h-[640px] min-h-[500px] overflow-hidden rounded-lg">
          {candidates.map((candidate, index) => (
            <TinderCard
              ref={childRefs[index]}
              className={`absolute inset-0 ${index === topCandidateIndex ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}
              key={candidate._id || candidate.id}
              preventSwipe={['up', 'down']}
              onSwipe={(direction) => onSwipe(candidate, direction)}
            >
              <article className="swipe-card flex h-full min-h-0 select-none flex-col overflow-hidden rounded-lg bg-white shadow-soft">
                <div className="grid h-40 shrink-0 place-items-center rounded-t-lg bg-gradient-to-br from-mint to-coral text-6xl font-black text-white sm:h-44">
                  {candidate.name?.charAt(0)}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                  <div>
                    <h2 className="break-words text-3xl font-black text-ink">{candidate.name}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {[candidate.city, candidate.state].filter(Boolean).join(', ')}
                      {candidate.distanceMeters !== undefined
                        ? ` - ${(candidate.distanceMeters / 1000).toFixed(1)} km away`
                        : ''}
                    </p>
                    <p className="mt-3 text-slate-600">
                      {candidate.bio || 'Always up for shared plans and easy conversation.'}
                    </p>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-bold text-slate-500">
                      {candidate.mutualInterestsCount || candidate.mutualInterests?.length || 1} mutual interests
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...(candidate.mutualInterests || []), ...(candidate.interests || [])]
                        .filter((interest, interestIndex, interests) => interests.indexOf(interest) === interestIndex)
                        .slice(0, 12)
                        .map((interest) => (
                          <span
                            key={interest}
                            className={`rounded px-3 py-1 text-sm font-semibold ${
                              candidate.mutualInterests?.includes(interest)
                                ? 'bg-yellow-200 text-yellow-950 ring-1 ring-yellow-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {getInterestLabel(interest)}
                          </span>
                        ))}
                    </div>
                  </div>

                  {candidate.interests?.length > 12 && (
                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      +{candidate.interests.length - 12} more interests
                    </p>
                  )}
                </div>
              </article>
            </TinderCard>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => swipeTopCard('left')}
            disabled={!canSwipe}
            className="match-action-button match-action-pass rounded px-4 py-4 text-lg font-black shadow-soft disabled:opacity-50"
          >
            Pass
          </button>
          <button
            type="button"
            onClick={() => swipeTopCard('right')}
            disabled={!canSwipe}
            className="match-action-button match-action-like rounded px-4 py-4 text-lg font-black shadow-soft disabled:opacity-50"
          >
            Like
          </button>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-28 lg:justify-start">
        <button
          type="button"
          onClick={() => swipeTopCard('right')}
          disabled={!canSwipe}
          className="match-action-button match-action-like flex h-20 w-20 items-center justify-center rounded-full text-lg font-black shadow-soft transition hover:scale-105 disabled:opacity-50"
        >
          Like
        </button>
      </div>
    </div>
  );
};

export default SwipeDeck;
