import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { fetchIssue, updateIssue } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Badge from '../components/Badge.jsx';
import TimeAgo from '../components/TimeAgo.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import CommentList from '../components/CommentList.jsx';
import CommentForm from '../components/CommentForm.jsx';
import RelationList from '../components/RelationList.jsx';

const PRIORITIES = ['low', 'normal', 'high', 'critical'];
const PRIORITY_DISPLAY = { low: 'Low', normal: 'Normal', high: 'High', critical: 'Critical' };

function PrioritySelect({ issueNumber, currentPriority, onUpdated }) {
  const [saving, setSaving] = useState(false);

  async function handleChange(e) {
    const val = e.target.value;
    if (val === currentPriority) return;
    setSaving(true);
    try {
      await updateIssue(issueNumber, { priority: val });
      onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select className="form-select" value={currentPriority} onChange={handleChange} disabled={saving}>
      {PRIORITIES.map((p) => (
        <option key={p} value={p}>{PRIORITY_DISPLAY[p]}</option>
      ))}
    </select>
  );
}

function EditableTitle({ issueNumber, value, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setEditing(false);
      setDraft(value);
      return;
    }
    setSaving(true);
    try {
      await updateIssue(issueNumber, { title: trimmed });
      setEditing(false);
      onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditing(false); setDraft(value); }
  }

  if (editing) {
    return (
      <div className="editable-title">
        <input
          className="editable-title__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={saving}
          maxLength={200}
          autoFocus
        />
      </div>
    );
  }

  return (
    <h1
      className="issue-header__title editable-title__display"
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      {value}
    </h1>
  );
}

function EditableDescription({ issueNumber, value, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (draft === (value || '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateIssue(issueNumber, { description: draft });
      setEditing(false);
      onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="issue-body">
        <textarea
          className="form-textarea"
          style={{ minHeight: '160px' }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={saving}
          maxLength={5000}
          autoFocus
        />
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => { setEditing(false); setDraft(value || ''); }}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="issue-body editable-body"
      onClick={() => { setDraft(value || ''); setEditing(true); }}
      title="Click to edit"
    >
      {value ? (
        <div className="issue-body__content">{value}</div>
      ) : (
        <div className="empty-state" style={{ padding: '16px' }}>No description. Click to add.</div>
      )}
    </div>
  );
}

export default function IssueDetailPage() {
  const { issueNumber } = useParams();
  const { data, loading, error, reload } = useApi(
    () => fetchIssue(issueNumber),
    [issueNumber]
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <ErrorMessage message={error} />;

  const issue = data?.issue;
  if (!issue) return <ErrorMessage message="Issue not found" />;

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Link to="/issues" style={{ fontSize: '13px' }}>&larr; Back to issues</Link>
      </div>

      <div className="issue-header">
        <div className="issue-header__number">{issue.issue_number}</div>
        <EditableTitle issueNumber={issueNumber} value={issue.title} onUpdated={reload} />
        <div className="issue-meta">
          <div className="issue-meta__item">
            <span className="issue-meta__label">Status</span>
            <StatusSelect issueNumber={issueNumber} currentStatus={issue.status} onUpdated={reload} />
          </div>
          <div className="issue-meta__item">
            <span className="issue-meta__label">Priority</span>
            <PrioritySelect issueNumber={issueNumber} currentPriority={issue.priority} onUpdated={reload} />
          </div>
          <div className="issue-meta__item">
            <Badge type="category" value={issue.category} />
          </div>
          <div className="issue-meta__item">
            <span className="issue-meta__label">System</span>
            <code>{issue.related_system}</code>
          </div>
        </div>
      </div>

      <div className="issue-sidebar">
        <div className="issue-sidebar__main">
          <EditableDescription issueNumber={issueNumber} value={issue.description} onUpdated={reload} />

          <h2 className="section-heading">Comments ({issue.comments?.length || 0})</h2>
          <CommentList comments={issue.comments} />
          <div style={{ marginTop: '16px' }}>
            <CommentForm issueNumber={issueNumber} onCommentAdded={reload} />
          </div>
        </div>

        <div className="issue-sidebar__side">
          <div className="card">
            <div className="card__title">Details</div>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span className="issue-meta__label">Created by</span>{' '}
                <strong>{issue.created_by}</strong>
              </div>
              <div>
                <span className="issue-meta__label">Created</span>{' '}
                <TimeAgo date={issue.created_at} />
              </div>
              <div>
                <span className="issue-meta__label">Updated</span>{' '}
                <TimeAgo date={issue.updated_at} />
              </div>
              {issue.resolved_at && (
                <div>
                  <span className="issue-meta__label">Resolved</span>{' '}
                  <TimeAgo date={issue.resolved_at} />
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card__title">Relations</div>
            <RelationList relations={issue.relations} issueNumber={issueNumber} onUpdated={reload} />
          </div>
        </div>
      </div>
    </div>
  );
}
