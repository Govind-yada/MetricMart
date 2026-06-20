import { useEffect, useState, useCallback } from 'react';
import { fetchSessions, fetchSessionEvents } from '../api/client';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusBlocks';

function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(startIso, endIso) {
  const ms = new Date(endIso) - new Date(startIso);
  if (ms < 1000) return '<1s';
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function shortId(id) {
  if (!id) return '';
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

const EVENT_META = {
  page_view: { label: 'page_view', color: 'var(--accent)' },
  click: { label: 'click', color: 'var(--accent-2)' },
};

export default function SessionsView() {
  const [sessions, setSessions] = useState(null);
  const [sessionsError, setSessionsError] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [events, setEvents] = useState(null);
  const [eventsError, setEventsError] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadSessions = useCallback(() => {
    setLoadingSessions(true);
    setSessionsError(null);
    fetchSessions()
      .then((data) => {
        setSessions(data);
        if (data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data[0].sessionId);
        }
      })
      .catch((err) => setSessionsError(err.message))
      .finally(() => setLoadingSessions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!selectedSessionId) return;
    setLoadingEvents(true);
    setEventsError(null);
    fetchSessionEvents(selectedSessionId)
      .then(setEvents)
      .catch((err) => setEventsError(err.message))
      .finally(() => setLoadingEvents(false));
  }, [selectedSessionId]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sessions</h1>
          <p className="page-subtitle">Every tracked visitor session, with total event counts.</p>
        </div>
        <button className="btn btn--ghost" onClick={loadSessions}>
          Refresh
        </button>
      </div>

      <div className="sessions-layout">
        <section className="panel sessions-list">
          <div className="panel__head">
            <span>Session ID</span>
            <span>Events</span>
            <span>Last seen</span>
          </div>

          {loadingSessions && <LoadingState label="Loading sessions…" />}
          {sessionsError && <ErrorState message={sessionsError} onRetry={loadSessions} />}
          {!loadingSessions && !sessionsError && sessions?.length === 0 && (
            <EmptyState
              title="No sessions yet"
              description="Open the demo store with the tracker installed, click around, then refresh."
            />
          )}

          {!loadingSessions &&
            !sessionsError &&
            sessions?.map((s) => (
              <button
                key={s.sessionId}
                className={`session-row ${s.sessionId === selectedSessionId ? 'is-selected' : ''}`}
                onClick={() => setSelectedSessionId(s.sessionId)}
              >
                <span className="mono session-row__id" title={s.sessionId}>
                  {shortId(s.sessionId)}
                </span>
                <span className="session-row__count">{s.eventCount}</span>
                <span className="mono session-row__time">{formatTimestamp(s.lastSeen)}</span>
              </button>
            ))}
        </section>

        <section className="panel journey-panel">
          {!selectedSessionId && (
            <EmptyState title="Select a session" description="Choose a session on the left to see its event journey." />
          )}

          {selectedSessionId && (
            <>
              <div className="journey-panel__head">
                <div>
                  <span className="eyebrow">User journey</span>
                  <h2 className="mono">{shortId(selectedSessionId)}</h2>
                </div>
                {events && events.length > 1 && (
                  <div className="journey-meta">
                    <span>{events.length} events</span>
                    <span className="dot-sep">·</span>
                    <span>{formatDuration(events[0].timestamp, events[events.length - 1].timestamp)} duration</span>
                  </div>
                )}
              </div>

              {loadingEvents && <LoadingState label="Loading journey…" />}
              {eventsError && <ErrorState message={eventsError} />}

              {!loadingEvents && !eventsError && events && (
                <ol className="journey-list">
                  {events.map((ev, idx) => {
                    const meta = EVENT_META[ev.eventType] || { label: ev.eventType, color: 'var(--text-muted)' };
                    return (
                      <li key={ev._id || idx} className="journey-item">
                        <div className="journey-item__rail">
                          <span className="journey-item__dot" style={{ background: meta.color }} />
                          {idx < events.length - 1 && <span className="journey-item__line" />}
                        </div>
                        <div className="journey-item__body">
                          <div className="journey-item__top">
                            <span className="badge" style={{ color: meta.color, borderColor: meta.color }}>
                              {meta.label}
                            </span>
                            <span className="mono journey-item__time">{formatTimestamp(ev.timestamp)}</span>
                          </div>
                          <div className="journey-item__url mono">{ev.pageUrl}</div>
                          {ev.eventType === 'click' && (
                            <div className="journey-item__coords mono">
                              x: {ev.x}, y: {ev.y}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
