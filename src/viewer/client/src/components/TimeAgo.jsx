const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

function formatRelative(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  const days = Math.floor(diff / DAY);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatAbsolute(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TimeAgo({ date }) {
  if (!date) return null;
  return (
    <time dateTime={date} title={formatAbsolute(date)}>
      {formatRelative(date)}
    </time>
  );
}
