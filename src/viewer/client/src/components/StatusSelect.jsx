import { useState } from 'react';
import { updateIssue } from '../api/client.js';

const STATUSES = ['open', 'in_progress', 'resolved', 'deferred'];
const DISPLAY = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  deferred: 'Deferred',
};

export default function StatusSelect({ issueNumber, currentStatus, onUpdated }) {
  const [saving, setSaving] = useState(false);

  async function handleChange(e) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    setSaving(true);
    try {
      await updateIssue(issueNumber, { status: newStatus });
      onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="form-select"
      value={currentStatus}
      onChange={handleChange}
      disabled={saving}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{DISPLAY[s]}</option>
      ))}
    </select>
  );
}
