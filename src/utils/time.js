export function formatElapsedTime(milliseconds) {
  if (milliseconds === null || milliseconds === undefined) {
    return "--:--.--";
  }

  const safeMilliseconds = Math.max(0, milliseconds);
  const minutes = Math.floor(safeMilliseconds / 60000);
  const seconds = Math.floor((safeMilliseconds % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const hundredths = Math.floor((safeMilliseconds % 1000) / 10)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}.${hundredths}`;
}

export function loadStoredBestTime(storageKey) {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (rawValue === null) {
      return null;
    }

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  } catch {
    return null;
  }
}

export function saveStoredBestTime(storageKey, milliseconds) {
  try {
    window.localStorage.setItem(storageKey, String(milliseconds));
  } catch {
    // Ignore storage failures and keep the in-memory best time.
  }
}
