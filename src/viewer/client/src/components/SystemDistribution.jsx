const CATEGORIES = ['error', 'design_change', 'escalation', 'tech_debt'];
const CAT_LABELS = {
  error: 'ERR',
  design_change: 'DSG',
  escalation: 'ESC',
  tech_debt: 'TDB',
};

export default function SystemDistribution({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">No unresolved issues</div>;
  }

  // 시스템별 카테고리 카운트 매트릭스 생성
  const systems = {};
  for (const row of data) {
    if (!systems[row.related_system]) {
      systems[row.related_system] = {};
    }
    systems[row.related_system][row.category] = row.count;
  }

  const systemNames = Object.keys(systems).sort();

  return (
    <table className="system-table">
      <thead>
        <tr>
          <th>System</th>
          {CATEGORIES.map((c) => (
            <th key={c}>{CAT_LABELS[c]}</th>
          ))}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {systemNames.map((name) => {
          const row = systems[name];
          const total = CATEGORIES.reduce((sum, c) => sum + (row[c] || 0), 0);
          return (
            <tr key={name}>
              <td className="system-table__name">{name}</td>
              {CATEGORIES.map((c) => (
                <td key={c}>{row[c] || '-'}</td>
              ))}
              <td><strong>{total}</strong></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
