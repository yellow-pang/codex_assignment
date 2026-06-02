function AlertMessage({ type = "info", message }) {
  if (!message) {
    return null;
  }

  const alertClass = type === "error" ? "alert-error" : "alert-success";

  return (
    <div className={`alert ${alertClass}`}>
      <span>{message}</span>
    </div>
  );
}

export default AlertMessage;
