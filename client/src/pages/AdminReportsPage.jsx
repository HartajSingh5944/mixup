import { useEffect, useState } from 'react';
import { banUserFromReport, getReports, reviewReport } from '../api/moderationApi';
import { useAuth } from '../context/useAuth';

const formatTime = (date) =>
  date
    ? new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(date))
    : '';

const AdminReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async (status = statusFilter) => {
    const { data } = await getReports(status || undefined);
    setReports(data);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setNotice('');

      try {
        await loadReports(statusFilter);
      } catch (apiError) {
        setNotice(apiError.response?.data?.message || 'Could not load reports.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [statusFilter]);

  const handleReview = async (reportId, payload, successMessage) => {
    try {
      await reviewReport(reportId, payload);
      setNotice(successMessage);
      await loadReports(statusFilter);
    } catch (apiError) {
      setNotice(apiError.response?.data?.message || 'Could not update report.');
    }
  };

  const handleBan = async (reportId, reportedUserName) => {
    try {
      await banUserFromReport(reportId, `Banned after moderation review by ${user?.name || 'admin'}`);
      setNotice(`${reportedUserName} has been banned from the platform.`);
      await loadReports(statusFilter);
    } catch (apiError) {
      setNotice(apiError.response?.data?.message || 'Could not ban user.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 text-sm font-semibold text-slate-700 shadow-sm">
          Admin access is required to review user reports.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Moderation reports</h1>
          <p className="mt-1 text-sm text-slate-600">Review reported chats, inspect transcripts, and action accounts.</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Status</span>
          <select
            className="mt-1 rounded border border-slate-300 bg-white px-3 py-2"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="reviewing">Reviewing</option>
            <option value="actioned">Actioned</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </label>
      </div>

      {notice && <p className="mb-4 rounded bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">{notice}</p>}

      {isLoading ? (
        <div className="rounded-lg bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">Loading reports...</div>
      ) : reports.length ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report._id} className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{report.status}</p>
                  <h2 className="mt-2 text-xl font-black text-ink">
                    {report.reporter?.name} reported {report.reportedUser?.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Reason: <span className="font-semibold">{report.category.replaceAll('_', ' ')}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Submitted {formatTime(report.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleReview(
                        report._id,
                        { status: 'reviewing', actionTaken: 'none', resolutionNotes: 'Review started.' },
                        'Report marked as reviewing.'
                      )
                    }
                    className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    Mark reviewing
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleReview(
                        report._id,
                        { status: 'dismissed', actionTaken: 'none', resolutionNotes: 'Dismissed after review.' },
                        'Report dismissed.'
                      )
                    }
                    className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBan(report._id, report.reportedUser?.name)}
                    className="rounded bg-red-600 px-3 py-2 text-sm font-black text-white"
                  >
                    Ban user
                  </button>
                </div>
              </div>

              {report.details && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Reporter notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{report.details}</p>
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm font-black text-ink">Chat transcript snapshot</p>
                <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
                  {report.transcriptSnapshot?.length ? (
                    report.transcriptSnapshot.map((message, index) => (
                      <div key={`${report._id}-${index}`} className="rounded-lg bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-ink">{message.senderName}</p>
                          <p className="text-xs text-slate-500">{formatTime(message.createdAt)}</p>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{message.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No messages were captured with this report.</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 text-sm text-slate-600 shadow-sm">No reports found for this filter.</div>
      )}
    </main>
  );
};

export default AdminReportsPage;
