# Contributing to SwamIDesk

We welcome contributions to SwamIDesk! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/swamidesk.git`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

## Development Workflow

1. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test your changes: `npm run build` and `npm run lint`
4. Commit your changes: `git commit -m "feat: add your feature"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Create a Pull Request

## Commit Message Convention

We use [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting, missing semicolons, etc.
- `refactor:` code changes that neither fix bugs nor add features
- `test:` adding or updating tests
- `chore:` maintenance tasks

Examples:
- `feat: add patient appointment booking`
- `fix: resolve dashboard loading issue`
- `docs: update installation instructions`

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint)
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure all components are properly typed

## Testing

- Test your changes in all user roles (Admin, Doctor, Patient, Receptionist)
- Ensure the build passes: `npm run build`
- Check for linting errors: `npm run lint`
- Test responsive design on different screen sizes

## Pull Request Guidelines

1. **Clear Description**: Describe what your PR does and why
2. **Screenshots**: Include screenshots for UI changes
3. **Testing**: Describe how you tested the changes
4. **Breaking Changes**: Clearly mark any breaking changes
5. **Documentation**: Update documentation if needed

## Adding New Features

When adding new features:

1. **Plan First**: Discuss major changes in an issue before implementing
2. **Type Safety**: Use proper TypeScript types
3. **Role-Based Access**: Consider permissions for different user roles
4. **Responsive Design**: Ensure mobile compatibility
5. **Accessibility**: Follow accessibility best practices

## Security

- Never commit sensitive information (API keys, passwords, etc.)
- Use environment variables for configuration
- Follow secure coding practices
- Report security vulnerabilities privately

## Questions?

- Create an issue for bug reports or feature requests
- Start a discussion for general questions
- Check existing issues before creating new ones

## Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Focus on constructive feedback
- Welcome newcomers to the project

Thank you for contributing to SwamIDesk! 🚀