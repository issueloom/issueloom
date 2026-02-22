import { fetchSummary } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import StatusSummary from '../components/StatusSummary.jsx';
import SystemDistribution from '../components/SystemDistribution.jsx';
import RecentChanges from '../components/RecentChanges.jsx';
import RecentComments from '../components/RecentComments.jsx';
import Legend from '../components/Legend.jsx';

export default function DashboardPage() {
  const { data, loading, error } = useApi(fetchSummary);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <ErrorMessage message={error} />;

  const summary = data.summary;

  return (
    <div>
      <h1 className="page-heading">Dashboard</h1>
      <div className="issue-count">Total issues: {summary.total_issues}</div>

      <div className="dashboard-grid">
        <StatusSummary statusStats={summary.status_summary} total={summary.total_issues} />
      </div>

      <div className="dashboard-sections">
        <div className="card">
          <div className="card__title">Unresolved by System</div>
          <SystemDistribution data={summary.system_category_distribution} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card__title">Recent Design Changes</div>
            <RecentChanges changes={summary.recent_design_changes} />
          </div>
          <div className="card">
            <div className="card__title">Director Comments</div>
            <RecentComments comments={summary.recent_director_comments} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card__title">Reference</div>
        <Legend />
      </div>
    </div>
  );
}
