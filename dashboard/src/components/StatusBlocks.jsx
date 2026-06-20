export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="status-block status-block--loading">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="status-block status-block--error">
      <div>
        <strong>Couldn't load data.</strong>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn--ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="status-block status-block--empty">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
