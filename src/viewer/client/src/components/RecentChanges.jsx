import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import TimeAgo from './TimeAgo.jsx';

export default function RecentChanges({ changes }) {
  if (!changes || changes.length === 0) {
    return <div className="empty-state">No design changes</div>;
  }

  return (
    <div>
      {changes.map((c) => (
        <div key={c.issue_number} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to={`/issues/${c.issue_number}`} className="data-table__link">
              {c.issue_number}
            </Link>
            <Badge type="status" value={c.status} />
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <TimeAgo date={c.updated_at} />
            </span>
          </div>
          <div style={{ fontSize: '13px', marginTop: '2px' }}>{c.title}</div>
        </div>
      ))}
    </div>
  );
}
