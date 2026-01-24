export function isTimeOver(session) {
  if (!session.started_at) return false;

  const endTime =
    new Date(session.started_at).getTime() + session.total_time_ms;

  return Date.now() >= endTime;
}
