/**
 * 입력 검증 + related_system 정규화
 */

// 열거형 화이트리스트
export const ALLOWED_CATEGORIES = ['error', 'design_change', 'escalation', 'tech_debt'];
export const ALLOWED_STATUSES = ['open', 'in_progress', 'resolved', 'deferred'];
export const ALLOWED_PRIORITIES = ['low', 'normal', 'high', 'critical'];
export const ALLOWED_RELATION_TYPES = ['caused_by', 'related_to', 'blocks', 'duplicates'];

// 쓰기 권한이 필요한 역할
export const WRITE_ROLES = ['lead_agent', 'director'];

// 필드별 길이 제한
export const MAX_LENGTHS = {
  title: 200,
  description: 5000,
  content: 2000,  // 코멘트
  related_system: 100,
  author: 100,
  iteration: 100,
  created_by: 100,
};

/**
 * LLM 에이전트의 줄바꿈 입력 정규화
 * LLM이 JSON 구성 시 실제 개행 문자(0x0A) 대신 백슬래시+n 리터럴을 넣는 경우를 보정
 * - \\n (리터럴 백슬래시+n) → 실제 개행 문자
 * - \\\\n (의도적 이스케이프) → \\n (리터럴 보존)
 */
export function normalizeNewlines(input) {
  if (typeof input !== 'string') return input;
  // 1단계: \\\\n(의도적 이스케이프)을 임시 플레이스홀더로 치환
  const placeholder = '\x00ESCAPED_NEWLINE\x00';
  let result = input.replace(/\\\\n/g, placeholder);
  // 2단계: \\n(리터럴 백슬래시+n)을 실제 개행으로 치환
  result = result.replace(/\\n/g, '\n');
  // 3단계: 플레이스홀더를 \\n(리터럴)으로 복원
  result = result.replace(new RegExp(placeholder, 'g'), '\\n');
  return result;
}

/**
 * related_system을 소문자 + 스네이크케이스로 정규화
 * 예: "MonsterAI" → "monster_ai", "procedural-map" → "procedural_map"
 */
export function normalizeSystemName(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('related_system is required and must be a string');
  }

  return input
    .trim()
    // camelCase/PascalCase 경계에 언더스코어 삽입
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    // 하이픈, 공백을 언더스코어로 변환
    .replace(/[-\s]+/g, '_')
    // 소문자로 변환
    .toLowerCase()
    // 연속 언더스코어 제거
    .replace(/_+/g, '_')
    // 앞뒤 언더스코어 제거
    .replace(/^_|_$/g, '');
}

/**
 * 열거형 검증
 */
export function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new Error(`Invalid ${fieldName}: "${value}". Allowed values: ${allowedValues.join(', ')}`);
  }
}

/**
 * 문자열 길이 검증
 */
export function validateLength(value, fieldName, maxLength) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length === 0) {
    throw new Error(`${fieldName} must not be empty`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters (got ${value.length})`);
  }
}

/**
 * 쓰기 권한 검증
 */
export function validateWritePermission(agentRole) {
  if (!agentRole || !WRITE_ROLES.includes(agentRole)) {
    throw new Error(`Write operations require lead_agent or director role. Got: "${agentRole || 'none'}"`);
  }
}

/**
 * create_issue 입력 검증
 */
export function validateCreateIssue(data) {
  validateLength(data.title, 'title', MAX_LENGTHS.title);
  validateLength(data.description, 'description', MAX_LENGTHS.description);
  validateEnum(data.category, ALLOWED_CATEGORIES, 'category');
  validateLength(data.related_system, 'related_system', MAX_LENGTHS.related_system);
  validateWritePermission(data.agent_role);

  if (data.priority !== undefined) {
    validateEnum(data.priority, ALLOWED_PRIORITIES, 'priority');
  }
  if (data.created_by) {
    validateLength(data.created_by, 'created_by', MAX_LENGTHS.created_by);
  }
  if (data.iteration) {
    validateLength(data.iteration, 'iteration', MAX_LENGTHS.iteration);
  }

  return {
    ...data,
    title: normalizeNewlines(data.title),
    description: normalizeNewlines(data.description),
    related_system: normalizeSystemName(data.related_system),
  };
}

/**
 * update_issue 입력 검증
 */
export function validateUpdateIssue(data) {
  validateWritePermission(data.agent_role);

  if (data.title !== undefined) {
    data.title = normalizeNewlines(data.title);
    validateLength(data.title, 'title', MAX_LENGTHS.title);
  }
  if (data.description !== undefined) {
    data.description = normalizeNewlines(data.description);
    validateLength(data.description, 'description', MAX_LENGTHS.description);
  }
  if (data.status !== undefined) {
    validateEnum(data.status, ALLOWED_STATUSES, 'status');
  }
  if (data.priority !== undefined) {
    validateEnum(data.priority, ALLOWED_PRIORITIES, 'priority');
  }
  if (data.related_system !== undefined) {
    validateLength(data.related_system, 'related_system', MAX_LENGTHS.related_system);
    data.related_system = normalizeSystemName(data.related_system);
  }
  if (data.iteration !== undefined) {
    validateLength(data.iteration, 'iteration', MAX_LENGTHS.iteration);
  }

  return data;
}

/**
 * add_comment 입력 검증
 */
export function validateAddComment(data) {
  data.content = normalizeNewlines(data.content);
  validateLength(data.content, 'content', MAX_LENGTHS.content);
  validateLength(data.author, 'author', MAX_LENGTHS.author);
}

/**
 * bulk_update_issues 입력 검증
 */
export function validateBulkUpdate(data) {
  validateWritePermission(data.agent_role);

  if (!Array.isArray(data.issue_numbers) || data.issue_numbers.length === 0) {
    throw new Error('issue_numbers must be a non-empty array');
  }
  if (data.issue_numbers.length > 50) {
    throw new Error('issue_numbers must not exceed 50 items');
  }
  if (data.status !== undefined) {
    validateEnum(data.status, ALLOWED_STATUSES, 'status');
  }
  if (data.priority !== undefined) {
    validateEnum(data.priority, ALLOWED_PRIORITIES, 'priority');
  }
}

/**
 * link_issues 입력 검증
 */
export function validateLinkIssues(data) {
  validateWritePermission(data.agent_role);
  validateEnum(data.relation_type, ALLOWED_RELATION_TYPES, 'relation_type');

  if (data.source_issue === data.target_issue) {
    throw new Error('Cannot link an issue to itself');
  }
}
