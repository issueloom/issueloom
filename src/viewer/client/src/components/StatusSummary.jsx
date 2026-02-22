const STATUS_CONFIG = [
  { key: 'open', label: 'Open', cssVar: '--color-status-open' },
  { key: 'in_progress', label: 'In Progress', cssVar: '--color-status-in-progress' },
  { key: 'resolved', label: 'Resolved', cssVar: '--color-status-resolved' },
  { key: 'deferred', label: 'Deferred', cssVar: '--color-status-deferred' },
];

export default function StatusSummary({ statusStats, total }) {
  const countMap = {};
  for (const s of statusStats) {
    countMap[s.status] = s.count;
  }

  return (
    <>
      {STATUS_CONFIG.map(({ key, label, cssVar }) => (
        <div className="card" key={key}>
          <div className="stat-value" style={{ color: `var(${cssVar})` }}>
            {countMap[key] || 0}
          </div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </>
  );
}
