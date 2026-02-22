const PAGE_SIZES = [10, 50, 100];

export default function Pagination({ total, page, size, onPageChange, onSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / size));

  // 표시할 페이지 번호 범위 계산 (최대 7개)
  let start = Math.max(1, page - 3);
  let end = Math.min(totalPages, start + 6);
  if (end - start < 6) {
    start = Math.max(1, end - 6);
  }
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <div className="pagination__size">
        <span className="pagination__size-label">Show</span>
        {PAGE_SIZES.map((s) => (
          <button
            key={s}
            className={`pagination__size-btn${s === size ? ' pagination__size-btn--active' : ''}`}
            onClick={() => onSizeChange(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination__pages">
          <button
            className="pagination__btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            &lsaquo;
          </button>
          {start > 1 && (
            <>
              <button className="pagination__btn" onClick={() => onPageChange(1)}>1</button>
              {start > 2 && <span className="pagination__ellipsis">&hellip;</span>}
            </>
          )}
          {pages.map((p) => (
            <button
              key={p}
              className={`pagination__btn${p === page ? ' pagination__btn--active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="pagination__ellipsis">&hellip;</span>}
              <button className="pagination__btn" onClick={() => onPageChange(totalPages)}>
                {totalPages}
              </button>
            </>
          )}
          <button
            className="pagination__btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
