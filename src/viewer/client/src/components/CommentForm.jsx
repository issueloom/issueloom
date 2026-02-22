import { useState } from 'react';
import { addComment } from '../api/client.js';
import ErrorMessage from './ErrorMessage.jsx';

export default function CommentForm({ issueNumber, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      await addComment(issueNumber, trimmed);
      setContent('');
      onCommentAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} />}
      <textarea
        className="form-textarea"
        placeholder="Add a comment as director..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
        rows={3}
      />
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn--primary" disabled={submitting || !content.trim()}>
          {submitting ? 'Posting...' : 'Comment'}
        </button>
      </div>
    </form>
  );
}
