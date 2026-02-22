import TimeAgo from './TimeAgo.jsx';

export default function CommentList({ comments }) {
  if (!comments || comments.length === 0) {
    return <div className="empty-state">No comments yet</div>;
  }

  return (
    <div>
      {comments.map((c) => (
        <div key={c.id} className="comment">
          <div className="comment__header">
            <span className="comment__author">{c.author}</span>
            <span className="comment__time"><TimeAgo date={c.created_at} /></span>
          </div>
          <div className="comment__body">{c.content}</div>
        </div>
      ))}
    </div>
  );
}
