import { getInterestLabel, interestCategories } from '../data/interests';

const InterestPicker = ({ selectedInterests, onToggleInterest }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-ink">Interests</h2>
          <p className="text-sm text-slate-600">Pick a few so MixUp can find better people for you.</p>
        </div>
        <span className="rounded bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
          {selectedInterests.length} selected
        </span>
      </div>

      <div className="max-h-[420px] space-y-5 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-3">
        {interestCategories.map((category) => (
          <div key={category.name}>
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">{category.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {category.interests.map(([value, label]) => {
                const isSelected = selectedInterests.includes(value);

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onToggleInterest(value)}
                    className={`rounded px-3 py-2 text-sm font-bold transition ${
                      isSelected ? 'bg-ink text-white' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedInterests.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => onToggleInterest(interest)}
              className="rounded bg-mint/20 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-mint/30"
            >
              {getInterestLabel(interest)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterestPicker;
