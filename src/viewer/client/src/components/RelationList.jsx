import { Link } from 'react-router-dom';
import { useState } from 'react';
import { addRelation, deleteRelation } from '../api/client.js';

const TYPE_LABELS = {
  caused_by: 'caused by',
  related_to: 'related to',
  blocks: 'blocks',
  duplicates: 'duplicates',
};

const RELATION_TYPES = ['blocks', 'caused_by', 'related_to', 'duplicates'];

function formatLabel(relation) {
  const type = TYPE_LABELS[relation.relation_type] || relation.relation_type;
  if (relation.direction === 'incoming') {
    // 반대 방향 표현
    const reverse = {
      caused_by: 'causes',
      related_to: 'related to',
      blocks: 'blocked by',
      duplicates: 'duplicated by',
    };
    return reverse[relation.relation_type] || type;
  }
  return type;
}

function RelationForm({ issueNumber, onAdded }) {
  const [target, setTarget] = useState('');
  const [type, setType] = useState('related_to');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = target.trim().toUpperCase();
    if (!trimmed) return;
    setSaving(true);
    try {
      await addRelation(issueNumber, trimmed, type);
      setTarget('');
      setType('related_to');
      setShowForm(false);
      onAdded();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!showForm) {
    return (
      <button className="btn" style={{ width: '100%', marginTop: '8px' }} onClick={() => setShowForm(true)}>
        + Add Relation
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <input
        className="form-select"
        style={{ width: '100%' }}
        placeholder="Issue number (e.g., ERR-001)"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        disabled={saving}
        maxLength={20}
      />
      <select className="form-select" value={type} onChange={(e) => setType(e.target.value)} disabled={saving}>
        {RELATION_TYPES.map((t) => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn--primary" disabled={saving || !target.trim()}>
          {saving ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}

export default function RelationList({ relations, issueNumber, onUpdated }) {
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(relationId) {
    if (!confirm('Remove this relation?')) return;
    setDeleting(relationId);
    try {
      await deleteRelation(relationId);
      onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {(!relations || relations.length === 0) ? (
        <div className="empty-state" style={{ padding: '8px 0' }}>No relations</div>
      ) : (
        relations.map((r) => (
          <div key={r.id} className="relation-item">
            <span className="relation-type">{formatLabel(r)}</span>
            <Link to={`/issues/${r.related_issue}`} className="data-table__link">
              {r.related_issue}
            </Link>
            <button
              className="relation-delete"
              onClick={() => handleDelete(r.id)}
              disabled={deleting === r.id}
              title="Remove relation"
            >
              x
            </button>
          </div>
        ))
      )}
      {issueNumber && onUpdated && (
        <RelationForm issueNumber={issueNumber} onAdded={onUpdated} />
      )}
    </div>
  );
}
