const formatDateTime = (dateTime) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateTime));

const formatCategory = (category) =>
  (category || 'other').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatGenderPreference = (genderPreference) =>
  (genderPreference || 'any').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDuration = (durationMinutes) => {
  if (!durationMinutes) {
    return '';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours && minutes) {
    return `${hours}h ${minutes}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

const getSourceLabel = (event) => {
  if (event.source === 'mixup') {
    return 'Hosted on MixUp';
  }

  if (event.source === 'serpapi_google_events') {
    return 'Google Events via SerpApi';
  }

  return 'Event Listing';
};

const EventMarkerPopup = ({ event }) => {
  return (
    <article className="min-w-[260px] max-w-[300px] overflow-hidden rounded-2xl bg-white">
      <div
        className={`px-4 py-4 text-white ${
          event.source === 'mixup'
            ? 'bg-gradient-to-br from-blue-700 via-blue-500 to-sky-400'
            : 'bg-gradient-to-br from-coral via-[#ff9478] to-[#ffd7a6]'
        }`}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/85">
          {getSourceLabel(event)}
        </p>
        <h3 className="mt-2 text-lg font-black leading-tight">{event.title}</h3>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
            {formatCategory(event.category)}
          </span>
          <span className="rounded-full bg-mint/30 px-3 py-1 text-xs font-bold text-ink">
            {event.isPaid ? 'Paid event' : 'Free or pricing on site'}
          </span>
        </div>

        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-black text-ink">When:</span> {formatDateTime(event.dateTime)}
          </p>
          {event.durationMinutes ? (
            <p>
              <span className="font-black text-ink">Duration:</span> {formatDuration(event.durationMinutes)}
            </p>
          ) : null}
          {event.description && (
            <p>
              <span className="font-black text-ink">Details:</span> {event.description}
            </p>
          )}
          {event.maxAttendees ? (
            <p>
              <span className="font-black text-ink">Slots:</span> {event.bookedSlots || 0}/{event.maxAttendees}
            </p>
          ) : null}
          {event.participationType ? (
            <p>
              <span className="font-black text-ink">Format:</span>{' '}
              {event.participationType === 'team' ? 'Team event' : 'Individual'}
              {event.participationType === 'team' && event.minTeamSize ? `, min team ${event.minTeamSize}` : ''}
            </p>
          ) : null}
          {event.ageMin || event.ageMax ? (
            <p>
              <span className="font-black text-ink">Age:</span> {event.ageMin || 0}-{event.ageMax || 99}
            </p>
          ) : null}
          {event.genderPreference ? (
            <p>
              <span className="font-black text-ink">Gender:</span> {formatGenderPreference(event.genderPreference)}
            </p>
          ) : null}
          {event.contactNumber ? (
            <p>
              <span className="font-black text-ink">Contact:</span> {event.contactNumber}
            </p>
          ) : null}
          {event.source === 'mixup' ? (
            <p>
              <span className="font-black text-ink">Booking:</span> {event.bookingsOpen ? 'Open' : 'Closed'}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-500">
            {event.source === 'mixup'
              ? 'Hosted by a MixUp user. Open the link if they shared one.'
              : 'Click below to continue on the ticket provider site.'}
          </p>
          {event.ticketUrl && (
            <a
              className="inline-flex shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-black text-white transition hover:bg-coral"
              href={event.ticketUrl}
              target="_blank"
              rel="noreferrer"
            >
              {event.source === 'mixup' ? 'Open link' : 'Book now'}
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default EventMarkerPopup;
