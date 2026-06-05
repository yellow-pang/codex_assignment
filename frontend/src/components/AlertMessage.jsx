function AlertMessage({ type = "info", message }) {
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
    <div className={alertClass} role="alert">
      <span>{message}</span>
    </div>
  );
}

export default AlertMessage;
