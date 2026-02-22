import { useSearchParams } from 'react-router-dom';

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'deferred'];
const PRIORITIES = ['', 'critical', 'high', 'normal', 'low'];
const CATEGORIES = ['', 'error', 'design_change', 'escalation', 'tech_debt'];

const DISPLAY = {
  '': 'All',
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  deferred: 'Deferred',
  critical: 'Critical',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
  error: 'Error',
  design_change: 'Design Change',
  escalation: 'Escalation',
  tech_debt: 'Tech Debt',
};

export default function IssueFilters({ systems }) {
  const [searchParams, setSearchParams] = useSearchParams();

  function handleChange(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // 필터 변경 시 page 리셋
    next.delete('page');
    setSearchParams(next);
  }

  return (
    <div className="filters">
      <select
        className="form-select"
        value={searchParams.get('status') || ''}
        onChange={(e) => handleChange('status', e.target.value)}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{DISPLAY[s]}</option>
        ))}
      </select>

      <select
        className="form-select"
        value={searchParams.get('priority') || ''}
        onChange={(e) => handleChange('priority', e.target.value)}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p === '' ? 'All Priorities' : DISPLAY[p]}</option>
        ))}
      </select>

      <select
        className="form-select"
        value={searchParams.get('category') || ''}
        onChange={(e) => handleChange('category', e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c === '' ? 'All Categories' : DISPLAY[c]}</option>
        ))}
      </select>

      {systems && systems.length > 0 && (
        <select
          className="form-select"
          value={searchParams.get('related_system') || ''}
          onChange={(e) => handleChange('related_system', e.target.value)}
        >
          <option value="">All Systems</option>
          {systems.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
}
