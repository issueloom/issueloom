# Contributing to IssueLoom

Thank you for your interest in contributing to IssueLoom!

## Getting Started

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd src/viewer/client && npm install
   ```
3. Initialize a test database:
   ```bash
   node bin/cli.js init --db ./test.db
   ```

## Development

### Project Structure

```
issueloom/
├── bin/cli.js              # CLI entry point
├── src/
│   ├── db/                 # SQLite schema, connection, queries
│   ├── mcp/                # MCP server and tool handlers
│   └── viewer/             # Web viewer (Express + React)
│       ├── client/         # React frontend source
│       └── dist/           # Built frontend (included in package)
└── tests/                  # Integration tests
```

### Running Tests

```bash
npm test
```

### Building the Frontend

```bash
npm run build:viewer
```

### Running the MCP Server Locally

```bash
node bin/cli.js --db ./test.db
```

### Running the Web Viewer Locally

```bash
node bin/cli.js viewer --db ./test.db --port 3000
```

## Submitting Changes

1. Create a feature branch from `main`
2. Make your changes
3. Run the test suite and confirm all tests pass
4. Build the frontend if you changed any client code
5. Submit a pull request with a clear description of the change

## Code Guidelines

- **Security first**: Always use parameterized SQL queries. Never concatenate user input into SQL strings.
- **Input validation**: Validate at the boundary (MCP tool handlers, API route handlers).
- **No `dangerouslySetInnerHTML`**: The web viewer relies on React's default escaping for XSS prevention.
- **Keep it simple**: Avoid over-engineering. Only add what is necessary for the current change.

## Reporting Issues

Use [GitHub Issues](https://github.com/issueloom/issueloom/issues) to report bugs or suggest features.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
