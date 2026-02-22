# Changelog

[한국어](./CHANGELOG.ko.md)

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-02-22

Feedback-driven update.

### Bug Fixes

- **Newline normalization**: Fixed `\\n` literals being stored instead of actual newlines in MCP tool calls
  - Added `normalizeNewlines()` to `validation.js`
  - Automatically normalizes `description` and `content` fields before storage

### New Features

- **`bulk_update_issues` MCP tool**: Batch update statuses of multiple issues
  - Pre-validation: checks all issue numbers before applying changes; returns error with no changes if any are invalid
  - Atomic transaction for all updates when valid
  - Designed for closing multiple issues at the end of an iteration

- **Blocking dependency display**: Surfaces existing `blocks` relation data in list and summary views
  - `list_issues` response now includes `blocked_by` issue number array
  - `get_summary` response now includes a "currently blocked issues" section
  - Web viewer shows blocking status badges in issue list

- **Web viewer relation management**: Add/remove issue relations from the detail page
  - New API endpoints for creating and deleting relations
  - UI controls on the issue detail page

- **Web viewer legend update**: Added Blocked badge to the Legend component
  - Unified badge sizing across all status types
  - Improved vertical alignment in legend and issue list
  - Hover tooltip explaining behavior in issue list

## [0.1.0] - 2026-02-20

Initial release.

### Features

- **Database + MCP Server (Phase 1)**: SQLite with WAL mode, 8 MCP tools
  - init_tracker, create_issue, list_issues, get_issue, update_issue, add_comment, link_issues, get_summary
- **Web Viewer Backend (Phase 2)**: Express API with 7 endpoints
- **Web Viewer Frontend (Phase 3)**: React 19 + Vite 6 — Dashboard, Issue List, Issue Detail pages
- **Packaging (Phase 4)**: npm distribution configuration

### Security

- SQL injection prevention (parameterized bindings)
- Stored prompt injection prevention (data framing)
- Web viewer: Host header validation, CSRF tokens, XSS prevention
- DB path traversal protection
