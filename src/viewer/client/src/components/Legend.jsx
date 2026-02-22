import Badge from './Badge.jsx';

const SECTIONS = [
  {
    title: 'Status',
    type: 'status',
    items: [
      { value: 'open', desc: 'New, not yet started' },
      { value: 'in_progress', desc: 'Being worked on' },
      { value: 'resolved', desc: 'Completed or fixed' },
      { value: 'deferred', desc: 'Postponed intentionally' },
      { value: '_blocked', desc: 'Waiting on another issue to be resolved' },
    ],
  },
  {
    title: 'Priority',
    type: 'priority',
    items: [
      { value: 'critical', desc: 'Immediate action required' },
      { value: 'high', desc: 'Should be resolved soon' },
      { value: 'normal', desc: 'Standard priority' },
      { value: 'low', desc: 'Address when convenient' },
    ],
  },
  {
    title: 'Category',
    type: 'category',
    items: [
      { value: 'error', desc: 'Bug or runtime failure' },
      { value: 'design_change', desc: 'Architecture or spec change' },
      { value: 'escalation', desc: 'Needs director decision' },
      { value: 'tech_debt', desc: 'Refactoring or cleanup needed' },
    ],
  },
];

export default function Legend() {
  return (
    <div className="legend">
      {SECTIONS.map((section) => (
        <div key={section.title} className="legend__section">
          <div className="legend__title">{section.title}</div>
          <div className="legend__items">
            {section.items.map((item) => (
              <div key={item.value} className="legend__item">
                {item.value === '_blocked' ? (
                  <span className="blocked-badge" title="Hover in issue list to see blocking issue numbers">Blocked</span>
                ) : (
                  <Badge type={section.type} value={item.value} />
                )}
                <span className="legend__desc">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
