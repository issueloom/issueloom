import { useSearchParams } from 'react-router-dom';
import { fetchIssues, fetchSystems } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import IssueFilters from '../components/IssueFilters.jsx';
import IssueTable from '../components/IssueTable.jsx';
import Pagination from '../components/Pagination.jsx';

const DEFAULT_SIZE = 50;
const VALID_SIZES = [10, 50, 100];

function parsePageParams(searchParams) {
  let page = parseInt(searchParams.get('page'), 10);
  if (!page || page < 1) page = 1;

  let size = parseInt(searchParams.get('size'), 10);
  if (!VALID_SIZES.includes(size)) size = DEFAULT_SIZE;

  return { page, size };
}

export default function IssueListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { page, size } = parsePageParams(searchParams);

  // 필터 파라미터만 추출 (page/size 제외)
  const filterParams = {};
  for (const [k, v] of searchParams.entries()) {
    if (k !== 'page' && k !== 'size' && v) {
      filterParams[k] = v;
    }
  }
  const filterStr = JSON.stringify(filterParams);

  const { data, loading, error } = useApi(() => fetchIssues(filterParams), [filterStr]);
  const { data: systemsData } = useApi(fetchSystems);

  const allIssues = data?.issues || [];
  const total = allIssues.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(page, totalPages);
  const sliced = allIssues.slice((safePage - 1) * size, safePage * size);

  function setParam(updates) {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === undefined) {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    }
    setSearchParams(next);
  }

  function handlePageChange(p) {
    setParam({ page: p > 1 ? p : null });
  }

  function handleSizeChange(s) {
    // 사이즈 변경 시 page 리셋
    setParam({ size: s !== DEFAULT_SIZE ? s : null, page: null });
  }

  return (
    <div>
      <h1 className="page-heading">Issues</h1>
      <IssueFilters systems={systemsData?.systems} />
      {error && <ErrorMessage message={error} />}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="issue-list__toolbar">
            <div className="issue-count">{total} issues</div>
            <Pagination
              total={total}
              page={safePage}
              size={size}
              onPageChange={handlePageChange}
              onSizeChange={handleSizeChange}
            />
          </div>
          <IssueTable issues={sliced} />
          {total > size && (
            <div style={{ marginTop: '16px' }}>
              <Pagination
                total={total}
                page={safePage}
                size={size}
                onPageChange={handlePageChange}
                onSizeChange={handleSizeChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
