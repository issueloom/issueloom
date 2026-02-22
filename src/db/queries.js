/**
 * 파라미터화 쿼리 모음
 * 모든 쿼리는 파라미터 바인딩 필수 — 문자열 연결 SQL 절대 금지
 */

const CATEGORY_PREFIX = {
  error: 'ERR',
  design_change: 'DSG',
  escalation: 'ESC',
  tech_debt: 'TDB',
};

// 동적 필터에 사용 가능한 컬럼 화이트리스트
const ALLOWED_FILTER_COLUMNS = ['status', 'category', 'related_system', 'iteration', 'priority'];

/**
 * 이슈 생성 — 트랜잭션 내 원자적 채번
 */
export function createIssue(db, data) {
  const {
    title, description, category, related_system,
    priority = 'normal', created_by, iteration = null,
  } = data;

  const now = new Date().toISOString();
  const prefix = CATEGORY_PREFIX[category];

  const insertIssue = db.transaction(() => {
    // 원자적 채번: 카테고리 접두사에 해당하는 최대 번호 조회
    const maxResult = db.prepare(
      "SELECT MAX(CAST(SUBSTR(issue_number, LENGTH(?) + 2) AS INTEGER)) as num FROM issues WHERE issue_number LIKE ? || '-%'"
    ).get(prefix, prefix);

    const nextNum = (maxResult?.num || 0) + 1;
    const issueNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO issues (issue_number, title, description, category, related_system, status, priority, created_at, updated_at, created_by, iteration)
      VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)
    `).run(issueNumber, title, description, category, related_system, priority, now, now, created_by, iteration);

    return issueNumber;
  });

  return insertIssue();
}

/**
 * 이슈 목록 조회 — 선택적 필터링
 */
export function listIssues(db, filters = {}) {
  let sql = 'SELECT id, issue_number, title, category, related_system, status, priority, created_at, updated_at, created_by, iteration FROM issues';
  const conditions = [];
  const params = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (!ALLOWED_FILTER_COLUMNS.includes(key)) continue;

    conditions.push(`${key} = ?`);
    params.push(value);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY updated_at DESC';

  const issues = db.prepare(sql).all(...params);

  // 각 이슈에 대해 blocked_by 정보 추가
  const blockedByStmt = db.prepare(`
    SELECT si.issue_number
    FROM issue_relations ir
    JOIN issues si ON ir.source_issue_id = si.id
    WHERE ir.target_issue_id = ? AND ir.relation_type = 'blocks'
      AND si.status != 'resolved'
  `);

  for (const issue of issues) {
    const blockers = blockedByStmt.all(issue.id).map(r => r.issue_number);
    if (blockers.length > 0) {
      issue.blocked_by = blockers;
    }
  }

  return issues;
}

/**
 * 이슈 상세 조회 — 코멘트 + 관계 포함
 */
export function getIssue(db, issueNumber) {
  const issue = db.prepare(
    'SELECT * FROM issues WHERE issue_number = ?'
  ).get(issueNumber);

  if (!issue) return null;

  const comments = db.prepare(
    'SELECT id, author, content, created_at FROM issue_comments WHERE issue_id = ? ORDER BY created_at ASC'
  ).all(issue.id);

  const relations = db.prepare(`
    SELECT
      ir.id,
      ir.relation_type,
      CASE WHEN ir.source_issue_id = ? THEN 'outgoing' ELSE 'incoming' END as direction,
      CASE WHEN ir.source_issue_id = ? THEN ti.issue_number ELSE si.issue_number END as related_issue
    FROM issue_relations ir
    JOIN issues si ON ir.source_issue_id = si.id
    JOIN issues ti ON ir.target_issue_id = ti.id
    WHERE ir.source_issue_id = ? OR ir.target_issue_id = ?
  `).all(issue.id, issue.id, issue.id, issue.id);

  return { ...issue, comments, relations };
}

/**
 * 이슈 업데이트 — 부분 업데이트, status→resolved 시 resolved_at 자동 설정
 */
export function updateIssue(db, issueNumber, updates) {
  const issue = db.prepare('SELECT id, status FROM issues WHERE issue_number = ?').get(issueNumber);
  if (!issue) return null;

  const allowedFields = ['title', 'description', 'related_system', 'status', 'priority', 'iteration'];
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;
    if (value === undefined) continue;
    setClauses.push(`${key} = ?`);
    params.push(value);
  }

  if (setClauses.length === 0) return issue;

  const now = new Date().toISOString();
  setClauses.push('updated_at = ?');
  params.push(now);

  // status가 resolved로 변경되면 resolved_at 자동 설정
  if (updates.status === 'resolved' && issue.status !== 'resolved') {
    setClauses.push('resolved_at = ?');
    params.push(now);
  }
  // resolved에서 다른 상태로 변경되면 resolved_at 초기화
  if (updates.status && updates.status !== 'resolved' && issue.status === 'resolved') {
    setClauses.push('resolved_at = NULL');
  }

  params.push(issue.id);

  db.prepare(`UPDATE issues SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

  return db.prepare('SELECT * FROM issues WHERE id = ?').get(issue.id);
}

/**
 * 코멘트 추가
 */
export function addComment(db, issueNumber, author, content) {
  const issue = db.prepare('SELECT id FROM issues WHERE issue_number = ?').get(issueNumber);
  if (!issue) return null;

  const now = new Date().toISOString();

  const result = db.prepare(
    'INSERT INTO issue_comments (issue_id, author, content, created_at) VALUES (?, ?, ?, ?)'
  ).run(issue.id, author, content, now);

  // 이슈의 updated_at도 갱신
  db.prepare('UPDATE issues SET updated_at = ? WHERE id = ?').run(now, issue.id);

  return { id: result.lastInsertRowid, issue_id: issue.id, author, content, created_at: now };
}

/**
 * 이슈 관계 설정
 */
export function linkIssues(db, sourceNumber, targetNumber, relationType) {
  const source = db.prepare('SELECT id FROM issues WHERE issue_number = ?').get(sourceNumber);
  const target = db.prepare('SELECT id FROM issues WHERE issue_number = ?').get(targetNumber);

  if (!source) return { error: `Source issue not found: ${sourceNumber}` };
  if (!target) return { error: `Target issue not found: ${targetNumber}` };

  // 중복 관계 확인
  const existing = db.prepare(
    'SELECT id FROM issue_relations WHERE source_issue_id = ? AND target_issue_id = ? AND relation_type = ?'
  ).get(source.id, target.id, relationType);

  if (existing) {
    return { error: `Relation already exists: ${sourceNumber} ${relationType} ${targetNumber}` };
  }

  const result = db.prepare(
    'INSERT INTO issue_relations (source_issue_id, target_issue_id, relation_type) VALUES (?, ?, ?)'
  ).run(source.id, target.id, relationType);

  return { id: result.lastInsertRowid, source: sourceNumber, target: targetNumber, relation_type: relationType };
}

/**
 * 이슈 관계 삭제
 */
export function unlinkIssues(db, relationId) {
  const relation = db.prepare('SELECT id FROM issue_relations WHERE id = ?').get(relationId);
  if (!relation) return { error: `Relation not found: ${relationId}` };

  db.prepare('DELETE FROM issue_relations WHERE id = ?').run(relationId);
  return { deleted: relationId };
}

/**
 * 벌크 이슈 업데이트 — 사전 검증 후 일괄 처리
 * 모든 이슈 번호가 유효해야 실행, 하나라도 없으면 변경 없이 에러 반환
 */
export function bulkUpdateIssues(db, issueNumbers, updates) {
  const now = new Date().toISOString();

  // 사전 검증: 모든 이슈 번호 존재 확인
  const notFound = [];
  const issueMap = {};

  for (const num of issueNumbers) {
    const issue = db.prepare('SELECT id, status FROM issues WHERE issue_number = ?').get(num);
    if (!issue) {
      notFound.push(num);
    } else {
      issueMap[num] = issue;
    }
  }

  if (notFound.length > 0) {
    return { error: `Issues not found: ${notFound.join(', ')}`, not_found: notFound };
  }

  // 트랜잭션으로 일괄 처리
  const execute = db.transaction(() => {
    const results = [];

    for (const num of issueNumbers) {
      const issue = issueMap[num];
      const setClauses = [];
      const params = [];

      if (updates.status !== undefined) {
        setClauses.push('status = ?');
        params.push(updates.status);

        // resolved 전환 시 resolved_at 자동 설정
        if (updates.status === 'resolved' && issue.status !== 'resolved') {
          setClauses.push('resolved_at = ?');
          params.push(now);
        }
        // resolved에서 다른 상태로 전환 시 resolved_at 초기화
        if (updates.status !== 'resolved' && issue.status === 'resolved') {
          setClauses.push('resolved_at = NULL');
        }
      }

      if (updates.priority !== undefined) {
        setClauses.push('priority = ?');
        params.push(updates.priority);
      }

      if (setClauses.length === 0) continue;

      setClauses.push('updated_at = ?');
      params.push(now);
      params.push(issue.id);

      db.prepare(`UPDATE issues SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
      results.push(num);
    }

    return results;
  });

  const updated = execute();
  return { updated, count: updated.length };
}

/**
 * 요약 조회 — 시스템별 통계, 최근 설계변경, 미확인 코멘트
 */
export function getSummary(db) {
  // 시스템별 미해결 이슈 수 및 카테고리 분포
  const systemStats = db.prepare(`
    SELECT related_system, category, COUNT(*) as count
    FROM issues
    WHERE status NOT IN ('resolved')
    GROUP BY related_system, category
    ORDER BY related_system, category
  `).all();

  // 전체 상태별 통계
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM issues
    GROUP BY status
  `).all();

  // 최근 설계 변경 5건
  const recentDesignChanges = db.prepare(`
    SELECT issue_number, title, status, updated_at
    FROM issues
    WHERE category = 'design_change'
    ORDER BY updated_at DESC
    LIMIT 5
  `).all();

  // 디렉터 코멘트 중 최근 10건 (director가 작성한 코멘트)
  const directorComments = db.prepare(`
    SELECT ic.id, ic.content, ic.created_at, ic.author, i.issue_number, i.title
    FROM issue_comments ic
    JOIN issues i ON ic.issue_id = i.id
    WHERE ic.author = 'director'
    ORDER BY ic.created_at DESC
    LIMIT 10
  `).all();

  // 현재 블로킹된 이슈 (미해결 이슈 중 blocks 관계가 있는 것)
  const blockedIssues = db.prepare(`
    SELECT
      ti.issue_number as blocked_issue,
      si.issue_number as blocked_by
    FROM issue_relations ir
    JOIN issues si ON ir.source_issue_id = si.id
    JOIN issues ti ON ir.target_issue_id = ti.id
    WHERE ir.relation_type = 'blocks'
      AND ti.status != 'resolved'
      AND si.status != 'resolved'
    ORDER BY ti.issue_number
  `).all();

  // 전체 이슈 수
  const totalIssues = db.prepare('SELECT COUNT(*) as count FROM issues').get();

  return {
    total_issues: totalIssues.count,
    status_summary: statusStats,
    system_category_distribution: systemStats,
    recent_design_changes: recentDesignChanges,
    recent_director_comments: directorComments,
    blocked_issues: blockedIssues,
  };
}

/**
 * 기존에 사용된 related_system 값 목록 조회
 */
export function getExistingSystemNames(db) {
  return db.prepare(
    'SELECT DISTINCT related_system FROM issues ORDER BY related_system'
  ).all().map(row => row.related_system);
}
