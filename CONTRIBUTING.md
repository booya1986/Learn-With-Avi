# Contributing to LearnWithAvi

Thank you for your interest in contributing to LearnWithAvi! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

---

## Code of Conduct

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be collaborative**: Work together constructively
- **Be inclusive**: Welcome diverse perspectives and backgrounds
- **Be professional**: Maintain professional communication
- **Be constructive**: Provide helpful feedback

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Spam or self-promotion
- Sharing private information without permission

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/learnwithavi.git
   cd learnwithavi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed  # Optional: seed with sample data
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Verify setup**
   - Open http://localhost:3000
   - Run tests: `npm test` (when available)
   - Run linter: `npm run lint`

For detailed setup instructions, see [Getting Started Guide](docs/getting-started/quickstart-checklist.md).

---

## Development Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/voice-commands`)
- `fix/` - Bug fixes (e.g., `fix/video-playback-safari`)
- `docs/` - Documentation changes (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/chat-components`)
- `test/` - Test additions/updates (e.g., `test/rag-system`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
feat(chat): add voice input support
fix(video): resolve playback issues on Safari
docs(api): update admin API documentation
refactor(rag): optimize embedding generation
```

### Development Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow project coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint          # Check code style
   npm test              # Run tests (when available)
   npm run build         # Verify build succeeds
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Keep your branch updated**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

6. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

---

## Coding Standards

### TypeScript

- **Use TypeScript**: All new code should be TypeScript
- **Type safety**: Avoid `any`, use proper types
- **Interfaces over types**: Prefer interfaces for object shapes
- **Export types**: Export types that might be reused

### React/Next.js

- **Functional components**: Use functional components with hooks
- **Component structure**:
  ```tsx
  // 1. Imports
  // 2. Type definitions
  // 3. Component definition
  // 4. Styled components (if any)
  // 5. Exports
  ```

- **Props typing**: Always type component props
  ```tsx
  interface MyComponentProps {
    title: string;
    onSave: () => void;
  }

  export function MyComponent({ title, onSave }: MyComponentProps) {
    // ...
  }
  ```

- **Hooks**: Follow React hooks rules
  - Only call hooks at the top level
  - Only call hooks from React functions
  - Use custom hooks for reusable logic

### Code Style

- **Formatting**: Use Prettier (runs automatically on commit)
- **Linting**: Follow ESLint rules
- **Naming conventions**:
  - Components: PascalCase (`VideoPlayer`)
  - Functions: camelCase (`handleSubmit`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
  - Files: kebab-case (`video-player.tsx`)

- **File organization**:
  ```
  src/
  ├── app/              # Next.js app directory
  ├── components/       # React components
  │   ├── ui/          # Reusable UI components
  │   ├── chat/        # Chat-related components
  │   └── video/       # Video-related components
  ├── lib/             # Utilities and services
  ├── hooks/           # Custom React hooks
  └── types/           # TypeScript type definitions
  ```

### Best Practices

- **Single Responsibility**: One component/function does one thing
- **DRY**: Don't Repeat Yourself - extract reusable logic
- **Readability**: Write code for humans to read
- **Comments**: Explain **why**, not **what**
- **Error Handling**: Always handle errors gracefully
- **Accessibility**: Follow WCAG 2.1 AA guidelines
- **Performance**: Optimize for performance (memoization, lazy loading)

---

## Documentation

### When to Document

- New features or significant changes
- Public APIs and exported functions
- Complex algorithms or logic
- Configuration options
- Setup or deployment procedures

### Documentation Types

1. **Code Comments** - JSDoc/TSDoc for functions and classes
   ```typescript
   /**
    * Generates embeddings for the given text
    *
    * @param text - The text to generate embeddings for
    * @param options - Optional configuration
    * @returns Promise resolving to embedding vector
    *
    * @example
    * ```ts
    * const embedding = await getEmbedding("Hello world");
    * ```
    */
   export async function getEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]> {
     // ...
   }
   ```

2. **README Updates** - Update README for new features
3. **API Documentation** - Auto-generated with TypeDoc
4. **Guides** - Add to `docs/guides/` for how-to documentation
5. **CHANGELOG** - Update CHANGELOG.md for all changes

### Documentation Tools

```bash
# Generate API documentation
npm run docs:generate

# Validate documentation
npm run docs:validate

# Check for broken links
node scripts/docs-manager.js check-links

# Find orphaned docs
node scripts/docs-manager.js find-orphans
```

See [Documentation Hub](docs/README.md) for complete documentation guidelines.

---

## Testing

### Testing Philosophy

- Write tests for all new features
- Maintain or improve test coverage
- Test user-facing functionality
- Test edge cases and error conditions

### Testing Stack

- **Unit Tests**: Vitest (when configured)
- **Integration Tests**: Playwright (when configured)
- **E2E Tests**: Playwright (when configured)

### Writing Tests

```typescript
// Example unit test
describe('getEmbedding', () => {
  it('should generate embeddings for valid text', async () => {
    const text = 'Hello world';
    const embedding = await getEmbedding(text);

    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536); // OpenAI embedding dimension
  });

  it('should handle empty text', async () => {
    await expect(getEmbedding('')).rejects.toThrow();
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm test -- --watch   # Run in watch mode
npm run test:coverage # Generate coverage report
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No linter errors or warnings
- [ ] Build succeeds
- [ ] Commits follow conventional commit format
- [ ] Branch is up-to-date with main

### PR Title Format

Use conventional commit format:
```
feat(chat): add voice input support
fix(video): resolve Safari playback issue
docs(api): update admin API reference
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**: CI runs linting, tests, build
2. **Code Review**: Maintainers review the code
3. **Feedback**: Address review comments
4. **Approval**: PR approved by maintainer(s)
5. **Merge**: Squash and merge to main

### After Merge

- Delete your branch
- Update your local repository
- Celebrate! 🎉

---

## Project Structure

```
learnwithavi/
├── src/
│   ├── app/              # Next.js app directory (pages, layouts, routes)
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── chat/        # Chat components
│   │   ├── video/       # Video components
│   │   └── admin/       # Admin panel components
│   ├── lib/             # Utilities and services
│   │   ├── auth/        # Authentication utilities
│   │   ├── rag/         # RAG system
│   │   ├── embeddings/  # Embedding generation
│   │   └── youtube/     # YouTube integration
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript type definitions
├── docs/                # Documentation
├── scripts/             # Utility scripts
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── tests/               # Test files (when added)
```

### Key Directories

- **`src/app/`** - Next.js 15 App Router pages and routes
- **`src/components/`** - Reusable React components
- **`src/lib/`** - Core business logic and utilities
- **`docs/`** - Project documentation
- **`prisma/`** - Database schema and migrations

---

## Getting Help

### Resources

- **Documentation**: [docs/README.md](docs/README.md)
- **Architecture**: [docs/architecture/overview.md](docs/architecture/overview.md)
- **API Reference**: [docs/api-reference/README.md](docs/api-reference/README.md)
- **Skills & Agents**: [docs/agents/overview.md](docs/agents/overview.md)

### Contact

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the docs first

---

## Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor documentation

Thank you for contributing to LearnWithAvi! Your efforts help make this project better for everyone. 🚀
