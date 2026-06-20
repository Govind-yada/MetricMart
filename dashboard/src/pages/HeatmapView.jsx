import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchPages, fetchClicksForPage } from '../api/client';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusBlocks';
import HeatmapCanvas from '../components/HeatmapCanvas';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;

function normalizeClick(click) {
  const vw = click.viewportWidth || CANVAS_WIDTH;
  const vh = click.viewportHeight || CANVAS_HEIGHT;
  const fx = Math.min(Math.max(click.x / vw, 0), 1);
  const fy = Math.min(Math.max(click.y / vh, 0), 1);
  return { fx, fy, cx: fx * CANVAS_WIDTH, cy: fy * CANVAS_HEIGHT };
}

export default function HeatmapView() {
  const [pages, setPages] = useState(null);
  const [pagesError, setPagesError] = useState(null);
  const [loadingPages, setLoadingPages] = useState(true);

  const [selectedPage, setSelectedPage] = useState(null);
  const [clicks, setClicks] = useState(null);
  const [clicksError, setClicksError] = useState(null);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' | 'dots'

  const loadPages = useCallback(() => {
    setLoadingPages(true);
    setPagesError(null);
    fetchPages()
      .then((data) => {
        setPages(data);
        if (data.length > 0) {
          setSelectedPage((prev) => prev || data[0]);
        }
      })
      .catch((err) => setPagesError(err.message))
      .finally(() => setLoadingPages(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    if (!selectedPage) return;
    setLoadingClicks(true);
    setClicksError(null);
    fetchClicksForPage(selectedPage)
      .then(setClicks)
      .catch((err) => setClicksError(err.message))
      .finally(() => setLoadingClicks(false));
  }, [selectedPage]);

  const normalizedClicks = useMemo(() => {
    if (!clicks) return [];
    return clicks.map((c) => ({ ...c, ...normalizeClick(c) }));
  }, [clicks]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Click heatmap</h1>
          <p className="page-subtitle">Visual map of where visitors click on a given page.</p>
        </div>

        {!loadingPages && pages?.length > 0 && (
          <div className="heatmap-controls">
            <div className="toggle-group">
              <button
                className={`toggle-group__btn ${viewMode === 'heatmap' ? 'is-active' : ''}`}
                onClick={() => setViewMode('heatmap')}
              >
                Heatmap
              </button>
              <button
                className={`toggle-group__btn ${viewMode === 'dots' ? 'is-active' : ''}`}
                onClick={() => setViewMode('dots')}
              >
                Dots
              </button>
            </div>
            <select
              className="select"
              value={selectedPage || ''}
              onChange={(e) => setSelectedPage(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingPages && <LoadingState label="Loading pages…" />}
      {pagesError && <ErrorState message={pagesError} onRetry={loadPages} />}
      {!loadingPages && !pagesError && pages?.length === 0 && (
        <EmptyState
          title="No pages tracked yet"
          description="Visit the demo store with the tracker installed to start collecting click data."
        />
      )}

      {!loadingPages && !pagesError && selectedPage && (
        <div className="heatmap-layout">
          <section className="panel heatmap-panel">
            {loadingClicks && <LoadingState label="Loading clicks…" />}
            {clicksError && <ErrorState message={clicksError} />}

            {!loadingClicks && !clicksError && (
              <div className="heatmap-canvas-wrap" style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}>
                <svg
                  className="heatmap-canvas"
                  viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* page silhouette grid, purely visual context */}
                  <rect x="0" y="0" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="var(--surface-raised)" rx="10" />
                  {Array.from({ length: 11 }).map((_, i) => (
                    <line
                      key={`v${i}`}
                      x1={(CANVAS_WIDTH / 10) * i}
                      y1={0}
                      x2={(CANVAS_WIDTH / 10) * i}
                      y2={CANVAS_HEIGHT}
                      stroke="var(--border-soft)"
                      strokeWidth="1"
                    />
                  ))}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <line
                      key={`h${i}`}
                      x1={0}
                      y1={(CANVAS_HEIGHT / 6) * i}
                      x2={CANVAS_WIDTH}
                      y2={(CANVAS_HEIGHT / 6) * i}
                      stroke="var(--border-soft)"
                      strokeWidth="1"
                    />
                  ))}
                </svg>

                {viewMode === 'heatmap' && (
                  <div className="heatmap-density-layer">
                    <HeatmapCanvas points={normalizedClicks} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                  </div>
                )}

                {viewMode === 'dots' && (
                  <svg
                    className="heatmap-canvas heatmap-dots-layer"
                    viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <radialGradient id="clickGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    {normalizedClicks.map((c, idx) => (
                      <g key={idx}>
                        <circle cx={c.cx} cy={c.cy} r="16" fill="url(#clickGlow)" />
                        <circle
                          cx={c.cx}
                          cy={c.cy}
                          r={hoveredIdx === idx ? 5.5 : 4}
                          fill="var(--accent-2)"
                          opacity={hoveredIdx === idx ? 1 : 0.85}
                          stroke="var(--bg)"
                          strokeWidth="1"
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                        >
                          <title>
                            x:{c.x}, y:{c.y} · {new Date(c.timestamp).toLocaleString()}
                          </title>
                        </circle>
                      </g>
                    ))}
                  </svg>
                )}

                {normalizedClicks.length === 0 && (
                  <div className="heatmap-empty-overlay">
                    <EmptyState
                      title="No clicks recorded for this page"
                      description="Click around on this page in the demo store, then refresh."
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="panel heatmap-stats">
            <div className="stat-block">
              <span className="eyebrow">Page</span>
              <span className="mono stat-block__value stat-block__value--small">{selectedPage}</span>
            </div>
            <div className="stat-block">
              <span className="eyebrow">Total clicks</span>
              <span className="stat-block__value">{normalizedClicks.length}</span>
            </div>
            <div className="stat-block">
              <span className="eyebrow">Unique sessions</span>
              <span className="stat-block__value">
                {new Set(normalizedClicks.map((c) => c.sessionId)).size}
              </span>
            </div>
            <p className="heatmap-note">
              {viewMode === 'heatmap'
                ? 'Color intensity shows click density — blue is light traffic, red is heavily clicked.'
                : 'Each dot is one click. Hover a dot to see its exact coordinates and timestamp.'}{' '}
              All points are normalized by each visitor's viewport size, then projected onto a fixed{' '}
              {CANVAS_WIDTH}×{CANVAS_HEIGHT} canvas so clicks from different screen sizes stay comparable.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
