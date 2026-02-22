import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import TimeAgo from './TimeAgo.jsx';

export default function IssueTable({ issues }) {
  if (!issues || issues.length === 0) {
    return <div className="empty-state">No issues found</div>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Number</th>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Category</th>
          <th>System</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {issues.map((issue) => (
          <tr key={issue.issue_number}>
            <td>
              <Link to={`/issues/${issue.issue_number}`} className="data-table__link">
                {issue.issue_number}
              </Link>
            </td>
            <td>
              <Link to={`/issues/${issue.issue_number}`}>
                {issue.title}
              </Link>
            </td>
            <td>
              <Badge type="status" value={issue.status} />
              {issue.blocked_by && issue.blocked_by.length > 0 && (
                <span className="blocked-badge" title={`Blocked by: ${issue.blocked_by.join(', ')}`}>Blocked</span>
              )}
            </td>
            <td><Badge type="priority" value={issue.priority} /></td>
            <td><Badge type="category" value={issue.category} /></td>
            <td><code>{issue.related_system}</code></td>
            <td style={{ whiteSpace: 'nowrap' }}><TimeAgo date={issue.updated_at} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
