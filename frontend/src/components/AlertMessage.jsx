function AlertMessage({ type = "info", message, onClose }) {
  if (!message) {
    return null;
  }

  const alertClass =
    type === "error"
      ? "c-alert-error"
      : type === "success"
        ? "c-alert-success"
        : type === "warning"
          ? "c-alert-warning"
          : "c-alert-info";

  return (
    <div className={`${alertClass} justify-between`} role="alert">
      <span>{message}</span>
      {onClose && (
        <button
          aria-label="안내 닫기"
          className="ml-3 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-current/70 transition-colors hover:bg-white/70 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30"
          type="button"
          onClick={onClose}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default AlertMessage;
