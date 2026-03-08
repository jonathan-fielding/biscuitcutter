# Contributing

Contributions are welcome, and they are greatly appreciated! Every little bit helps, and credit will always be given.

## Types of Contributions

### Report Bugs

Report bugs by opening an issue.

If you are reporting a bug, please include:

- Your operating system name and version.
- Your Node.js version (`node --version`).
- Any details about your local setup that might be helpful in troubleshooting.
- Detailed steps to reproduce the bug.

### Fix Bugs

Look through the GitHub issues for bugs. Anything tagged with "bug" is open to whoever wants to implement it.

### Implement Features

Look through the GitHub issues for features. Anything tagged with "enhancement" is open to whoever wants to implement it.

Please do not combine multiple feature enhancements into a single pull request.

### Write Documentation

BiscuitCutter could always use more documentation, whether as part of the official docs, in code comments, or even on the web in blog posts and articles.

### Submit Feedback

The best way to send feedback is to file an issue.

If you are proposing a feature:

- Explain in detail how it would work.
- Keep the scope as narrow as possible, to make it easier to implement.
- Remember that this is a volunteer-driven project, and that contributions are welcome!

## Setting Up the Code for Local Development

1. Fork the repo on GitHub.

2. Clone your fork locally:

   ```bash
   git clone git@github.com:your_name_here/biscuitcutter.git
   ```

3. Install dependencies:

   ```bash
   cd biscuitcutter
   npm install
   ```

4. Create a branch for local development:

   ```bash
   git checkout -b name-of-your-bugfix-or-feature
   ```

   Now you can make your changes locally.

5. Build the project to ensure TypeScript compiles correctly:

   ```bash
   npm run build
   ```

6. When you're done making changes, run the tests:

   ```bash
   npm test
   ```

7. Commit your changes and push your branch to GitHub:

   ```bash
   git add .
   git commit -m "Your detailed description of your changes"
   git push origin name-of-your-bugfix-or-feature
   ```

8. Submit a pull request through GitHub.

## Pull Request Guidelines

Before you submit a pull request, check that it meets these guidelines:

1. The pull request should include tests for new functionality.
2. If the pull request adds functionality, the docs should be updated.
3. The pull request should work for Node.js 18 and later.
4. Make sure all tests pass.

## Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode

## Code Style

- Use TypeScript for all new code.
- Follow existing code conventions in the project.
- Use meaningful variable and function names.
- Add JSDoc comments for public APIs.
- Keep functions small and focused.

## Testing

Tests are written using [Vitest](https://vitest.dev/). Place test files in the `tests/` directory with the naming convention `*.test.ts`.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
biscuitcutter/
├── src/
│   ├── cli/          # Command-line interface
│   ├── config/       # Configuration handling
│   ├── core/         # Core business logic
│   ├── repository/   # Repository handling (git, zip, etc.)
│   ├── template/     # Template engine
│   └── utils/        # Utility functions
├── tests/            # Test files
└── dist/             # Compiled output (generated)
```

## Questions?

Feel free to open an issue if you have any questions about contributing.
