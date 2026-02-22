/**
 * Phase 1 통합 테스트
 * 전체 플로우: create → list → get → update → comment → link → summary
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

import { getDb } from '../src/db/connection.js';
import {
  createIssue, listIssues, getIssue, updateIssue,
  addComment, linkIssues, getSummary, getExistingSystemNames,
} from '../src/db/queries.js';
import {
  normalizeSystemName, validateEnum, validateLength,
  ALLOWED_CATEGORIES, ALLOWED_STATUSES, ALLOWED_PRIORITIES,
  validateCreateIssue,
} from '../src/mcp/validation.js';

const TEST_DB = path.join(process.cwd(), 'test-integration.db');

describe('DB + Queries 통합 테스트', () => {
  let db;

  before(() => {
    // 이전 테스트 DB 삭제
    for (const ext of ['', '-wal', '-shm']) {
      const f = TEST_DB + ext;
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    db = getDb(TEST_DB);
  });

  after(() => {
    db.close();
    for (const ext of ['', '-wal', '-shm']) {
      const f = TEST_DB + ext;
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  test('이슈 생성 — 원자적 채번', () => {
    const num1 = createIssue(db, {
      title: '테스트 에러 이슈',
      description: '에러 이슈 상세 설명',
      category: 'error',
      related_system: 'auth_module',
      created_by: 'lead_agent',
    });
    assert.equal(num1, 'ERR-001');

    const num2 = createIssue(db, {
      title: '두 번째 에러',
      description: '에러 이슈 2',
      category: 'error',
      related_system: 'auth_module',
      created_by: 'lead_agent',
    });
    assert.equal(num2, 'ERR-002');

    const num3 = createIssue(db, {
      title: '설계 변경',
      description: '설계 변경 상세',
      category: 'design_change',
      related_system: 'combat_system',
      created_by: 'lead_agent',
    });
    assert.equal(num3, 'DSG-001');
  });

  test('이슈 목록 조회 — 필터링', () => {
    const all = listIssues(db);
    assert.equal(all.length, 3);

    const errors = listIssues(db, { category: 'error' });
    assert.equal(errors.length, 2);

    const authIssues = listIssues(db, { related_system: 'auth_module' });
    assert.equal(authIssues.length, 2);
  });

  test('이슈 상세 조회', () => {
    const issue = getIssue(db, 'ERR-001');
    assert.ok(issue);
    assert.equal(issue.title, '테스트 에러 이슈');
    assert.equal(issue.status, 'open');
    assert.deepEqual(issue.comments, []);
    assert.deepEqual(issue.relations, []);
  });

  test('이슈 업데이트 — resolved 시 resolved_at 자동 설정', () => {
    const updated = updateIssue(db, 'ERR-001', { status: 'resolved' });
    assert.ok(updated);
    assert.equal(updated.status, 'resolved');
    assert.ok(updated.resolved_at);

    // 다시 open으로 되돌리면 resolved_at 초기화
    const reopened = updateIssue(db, 'ERR-001', { status: 'open' });
    assert.equal(reopened.status, 'open');
    assert.equal(reopened.resolved_at, null);
  });

  test('코멘트 추가', () => {
    const comment = addComment(db, 'ERR-001', 'director', '이 이슈 우선 처리 바람');
    assert.ok(comment);
    assert.equal(comment.author, 'director');

    const issue = getIssue(db, 'ERR-001');
    assert.equal(issue.comments.length, 1);
    assert.equal(issue.comments[0].content, '이 이슈 우선 처리 바람');
  });

  test('이슈 관계 설정', () => {
    const result = linkIssues(db, 'ERR-001', 'DSG-001', 'caused_by');
    assert.ok(result.id);
    assert.equal(result.relation_type, 'caused_by');

    const issue = getIssue(db, 'ERR-001');
    assert.equal(issue.relations.length, 1);
    assert.equal(issue.relations[0].related_issue, 'DSG-001');
    assert.equal(issue.relations[0].direction, 'outgoing');

    // 중복 관계 방지
    const dup = linkIssues(db, 'ERR-001', 'DSG-001', 'caused_by');
    assert.ok(dup.error);
  });

  test('요약 조회', () => {
    const summary = getSummary(db);
    assert.ok(summary.total_issues >= 3);
    assert.ok(Array.isArray(summary.status_summary));
    assert.ok(Array.isArray(summary.recent_design_changes));
    assert.ok(Array.isArray(summary.recent_director_comments));
    assert.equal(summary.recent_director_comments.length, 1);
  });

  test('기존 시스템 이름 목록', () => {
    const systems = getExistingSystemNames(db);
    assert.ok(systems.includes('auth_module'));
    assert.ok(systems.includes('combat_system'));
  });

  test('존재하지 않는 이슈 조회 — null 반환', () => {
    const issue = getIssue(db, 'ERR-999');
    assert.equal(issue, null);
  });

  test('존재하지 않는 이슈에 코멘트 — null 반환', () => {
    const result = addComment(db, 'ERR-999', 'test', 'content');
    assert.equal(result, null);
  });
});

describe('입력 검증 테스트', () => {
  test('normalizeSystemName — 다양한 형식', () => {
    assert.equal(normalizeSystemName('MonsterAI'), 'monster_ai');
    assert.equal(normalizeSystemName('procedural-map'), 'procedural_map');
    assert.equal(normalizeSystemName('auth module'), 'auth_module');
    assert.equal(normalizeSystemName('COMBAT_SYSTEM'), 'combat_system');
    assert.equal(normalizeSystemName('  spaced  '), 'spaced');
    assert.equal(normalizeSystemName('UIManager'), 'ui_manager');
  });

  test('validateEnum — 유효/무효 값', () => {
    assert.doesNotThrow(() => validateEnum('error', ALLOWED_CATEGORIES, 'category'));
    assert.throws(
      () => validateEnum('invalid', ALLOWED_CATEGORIES, 'category'),
      /Invalid category/
    );
  });

  test('validateLength — 길이 초과', () => {
    assert.doesNotThrow(() => validateLength('short', 'title', 200));
    assert.throws(
      () => validateLength('a'.repeat(201), 'title', 200),
      /exceeds maximum length/
    );
    assert.throws(
      () => validateLength('', 'title', 200),
      /must not be empty/
    );
  });

  test('validateCreateIssue — SQL 인젝션 시도', () => {
    // SQL 인젝션 입력은 검증을 통과하지만, 파라미터 바인딩으로 안전하게 처리됨
    const result = validateCreateIssue({
      title: "'; DROP TABLE issues; --",
      description: 'test',
      category: 'error',
      related_system: 'test_system',
      agent_role: 'lead_agent',
    });
    assert.equal(result.title, "'; DROP TABLE issues; --");
  });

  test('validateCreateIssue — 권한 검증', () => {
    assert.throws(
      () => validateCreateIssue({
        title: 'test',
        description: 'test',
        category: 'error',
        related_system: 'test',
        agent_role: 'teammate',
      }),
      /Write operations require/
    );
  });
});
