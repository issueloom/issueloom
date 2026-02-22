const DISPLAY = {
  // status
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  deferred: 'Deferred',
  // priority
  critical: 'Critical',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
  // category
  error: 'Error',
  design_change: 'Design Change',
  escalation: 'Escalation',
  tech_debt: 'Tech Debt',
};

export default function Badge({ type, value }) {
  if (!value) return null;
  return (
    <span className={`badge badge--${type}-${value}`}>
      {DISPLAY[value] || value}
    </span>
  );
}
