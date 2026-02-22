/**
 * API 라우트 — 이슈 CRUD + 요약
 * queries.js와 validation.js를 100% 재활용
 */

import { Router } from 'express';
import { listIssues, getIssue, updateIssue, addComment, linkIssues, unlinkIssues, getSummary, getExistingSystemNames } from '../../db/queries.js';
import {
  validateLength, validateEnum,
  ALLOWED_STATUSES, ALLOWED_PRIORITIES, ALLOWED_RELATION_TYPES, MAX_LENGTHS,
  normalizeSystemName,
} from '../../mcp/validation.js';
import { issueCsrfToken } from '../middleware.js';

/**
 * 라우터 팩토리 — DB 인스턴스를 주입받아 라우터를 반환
 */
export function createRouter(db) {
  const router = Router();

  // GET /api/csrf-token — CSRF 토큰 발급
  router.get('/csrf-token', (req, res) => {
    const token = issueCsrfToken();
    res.json({ token });
  });

  // GET /api/issues — 이슈 목록 (쿼리 파라미터 필터)
  router.get('/issues', (req, res) => {
    const filters = {};
    const { status, category, related_system, iteration, priority } = req.query;
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (related_system) filters.related_system = related_system;
    if (iteration) filters.iteration = iteration;
    if (priority) filters.priority = priority;

    const issues = listIssues(db, filters);
    res.json({ issues });
  });

  // GET /api/issues/:issueNumber — 이슈 상세
  router.get('/issues/:issueNumber', (req, res) => {
    const { issueNumber } = req.params;

    // issueNumber 형식 검증 (PREFIX-NNN)
    if (!/^[A-Z]{3}-\d{3,}$/.test(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number format. Expected: PREFIX-NNN (e.g., ERR-001)' });
      return;
    }

    const issue = getIssue(db, issueNumber);
    if (!issue) {
      res.status(404).json({ error: `Issue not found: ${issueNumber}` });
      return;
    }
    res.json({ issue });
  });

  // PATCH /api/issues/:issueNumber — 이슈 업데이트 (CSRF 필요)
  router.patch('/issues/:issueNumber', (req, res) => {
    const { issueNumber } = req.params;

    if (!/^[A-Z]{3}-\d{3,}$/.test(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number format. Expected: PREFIX-NNN (e.g., ERR-001)' });
      return;
    }

    const updates = {};

    try {
      // 허용된 필드만 추출 및 검증
      if (req.body.title !== undefined) {
        validateLength(req.body.title, 'title', MAX_LENGTHS.title);
        updates.title = req.body.title;
      }
      if (req.body.description !== undefined) {
        validateLength(req.body.description, 'description', MAX_LENGTHS.description);
        updates.description = req.body.description;
      }
      if (req.body.status !== undefined) {
        validateEnum(req.body.status, ALLOWED_STATUSES, 'status');
        updates.status = req.body.status;
      }
      if (req.body.priority !== undefined) {
        validateEnum(req.body.priority, ALLOWED_PRIORITIES, 'priority');
        updates.priority = req.body.priority;
      }
      if (req.body.related_system !== undefined) {
        validateLength(req.body.related_system, 'related_system', MAX_LENGTHS.related_system);
        updates.related_system = normalizeSystemName(req.body.related_system);
      }
      if (req.body.iteration !== undefined) {
        validateLength(req.body.iteration, 'iteration', MAX_LENGTHS.iteration);
        updates.iteration = req.body.iteration;
      }
    } catch (e) {
      res.status(400).json({ error: e.message });
      return;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const result = updateIssue(db, issueNumber, updates);
    if (!result) {
      res.status(404).json({ error: `Issue not found: ${issueNumber}` });
      return;
    }

    res.json({ issue: result });
  });

  // POST /api/issues/:issueNumber/comments — 코멘트 추가 (CSRF 필요)
  router.post('/issues/:issueNumber/comments', (req, res) => {
    const { issueNumber } = req.params;

    if (!/^[A-Z]{3}-\d{3,}$/.test(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number format. Expected: PREFIX-NNN (e.g., ERR-001)' });
      return;
    }

    const { content } = req.body;

    try {
      if (!content) {
        throw new Error('content is required');
      }
      validateLength(content, 'content', MAX_LENGTHS.content);
    } catch (e) {
      res.status(400).json({ error: e.message });
      return;
    }

    // 웹 뷰어는 디렉터 전용
    const author = 'director';

    const result = addComment(db, issueNumber, author, content);
    if (!result) {
      res.status(404).json({ error: `Issue not found: ${issueNumber}` });
      return;
    }

    res.status(201).json({ comment: result });
  });

  // POST /api/issues/:issueNumber/relations — 관계 추가 (CSRF 필요)
  router.post('/issues/:issueNumber/relations', (req, res) => {
    const { issueNumber } = req.params;

    if (!/^[A-Z]{3}-\d{3,}$/.test(issueNumber)) {
      res.status(400).json({ error: 'Invalid issue number format. Expected: PREFIX-NNN (e.g., ERR-001)' });
      return;
    }

    const { target_issue, relation_type } = req.body;

    try {
      if (!target_issue || typeof target_issue !== 'string') {
        throw new Error('target_issue is required');
      }
      if (!/^[A-Z]{3}-\d{3,}$/.test(target_issue)) {
        throw new Error('Invalid target issue number format. Expected: PREFIX-NNN (e.g., ERR-001)');
      }
      if (!relation_type) {
        throw new Error('relation_type is required');
      }
      validateEnum(relation_type, ALLOWED_RELATION_TYPES, 'relation_type');
      if (issueNumber === target_issue) {
        throw new Error('Cannot link an issue to itself');
      }
    } catch (e) {
      res.status(400).json({ error: e.message });
      return;
    }

    const result = linkIssues(db, issueNumber, target_issue, relation_type);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ relation: result });
  });

  // DELETE /api/relations/:relationId — 관계 삭제 (CSRF 필요)
  router.delete('/relations/:relationId', (req, res) => {
    const { relationId } = req.params;
    const id = parseInt(relationId, 10);

    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid relation ID' });
      return;
    }

    const result = unlinkIssues(db, id);
    if (result.error) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ deleted: result.deleted });
  });

  // GET /api/summary — 통계 요약
  router.get('/summary', (req, res) => {
    const summary = getSummary(db);
    res.json({ summary });
  });

  // GET /api/systems — 시스템명 목록
  router.get('/systems', (req, res) => {
    const systems = getExistingSystemNames(db);
    res.json({ systems });
  });

  return router;
}
