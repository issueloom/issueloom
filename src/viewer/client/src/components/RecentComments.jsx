import { Link } from 'react-router-dom';
import TimeAgo from './TimeAgo.jsx';

export default function RecentComments({ comments }) {
  if (!comments || comments.length === 0) {
    return <div className="empty-state">No director comments</div>;
  }

  return (
    <div>
      {comments.map((c) => (
        <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to={`/issues/${c.issue_number}`} className="data-table__link">
              {c.issue_number}
            </Link>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <TimeAgo date={c.created_at} />
            </span>
          </div>
          <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {c.content.length > 120 ? c.content.slice(0, 120) + '...' : c.content}
          </div>
        </div>
      ))}
    </div>
  );
}
