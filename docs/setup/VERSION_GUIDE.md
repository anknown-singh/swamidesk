# Version Management Quick Reference

## 🏷️ Current Version: 1.0.0

## 🚀 **NEW: Automatic Version Bumping**

SwamIDesk now uses **Release-Please** for automatic version management based on conventional commits!

## 📋 Conventional Commit Commands

```bash
# Use commitizen for guided commits
npm run commit

# Manual conventional commits format:
# <type>(<scope>): <subject>

# Examples:
git commit -m "feat(auth): add user authentication system"        # Minor bump
git commit -m "fix(dashboard): resolve loading spinner issue"     # Patch bump
git commit -m "feat(api)!: change authentication method"          # Major bump
```

## 🔄 New Automated Release Workflow

1. **Make changes** and test locally
2. **Use conventional commits**: `npm run commit` or follow format
3. **Push to main**: `git push origin main`
4. **Release-Please creates PR** with version bump and changelog
5. **Review and merge PR** to trigger release and deployment
6. **Vercel automatically deploys** the new version

## 📝 Commit Types & Version Impact

| Commit Type | Version Impact | Example |
|-------------|---------------|---------|
| `feat:` | **Minor** (1.0.0 → 1.1.0) | New features |
| `fix:` | **Patch** (1.0.0 → 1.0.1) | Bug fixes |
| `feat!:` or `BREAKING CHANGE:` | **Major** (1.0.0 → 2.0.0) | Breaking changes |
| `docs:`, `style:`, `test:`, `chore:` | **No bump** | Non-functional changes |

## 🛠️ Available Commit Types

- **feat**: New features
- **fix**: Bug fixes  
- **docs**: Documentation changes
- **style**: Code formatting (no logic changes)
- **refactor**: Code restructuring (no behavior changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI/CD configuration changes
- **chore**: Maintenance tasks

## 📊 Version History

### v1.0.0 (Initial Release)
- ✅ Role-based authentication system
- ✅ Admin, Doctor, Patient, Receptionist dashboards  
- ✅ Modern UI with Next.js 14 + TypeScript
- ✅ Responsive design with Tailwind CSS
- ✅ shadcn/ui component library
- ✅ Mock authentication for development

### Planned Versions

#### v1.1.0 (Next Minor)
- [ ] Real authentication integration
- [ ] Database connection setup
- [ ] Enhanced appointment management
- [ ] Email notifications

#### v1.2.0
- [ ] Real-time notifications
- [ ] Advanced search and filtering
- [ ] File upload capabilities
- [ ] Enhanced analytics

#### v2.0.0 (Future Major)
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced reporting system
- [ ] Integration with external systems

## 🏗️ Branching Strategy

```
main (production ready)
├── develop (integration branch)
├── feature/user-authentication
├── feature/real-database
├── hotfix/login-bug
└── release/v1.1.0
```

## 📝 Commit Message Convention

```bash
# Feature
git commit -m "feat: add real authentication system"

# Bug fix  
git commit -m "fix: resolve dashboard loading issue"

# Documentation
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor: optimize database queries"

# Style
git commit -m "style: format code with prettier"

# Test
git commit -m "test: add unit tests for auth module"
```

## 🎯 Release Checklist

### Before Release
- [ ] All tests pass: `npm run build && npm run lint`
- [ ] CHANGELOG.md updated
- [ ] Version bumped: `npm run version:*`
- [ ] Documentation reviewed
- [ ] Security audit clean: `npm audit`

### After Release
- [ ] GitHub release created with notes
- [ ] Production deployment updated
- [ ] Team notified of new version
- [ ] Monitor for issues post-release

## 🔍 Checking Versions

```bash
# Current project version
cat package.json | grep version

# Git tags (all versions)
git tag -l

# Latest commit info
git log --oneline -1

# Branch status
git status
```

## 🚨 Emergency Hotfix Process

1. Create hotfix branch from main: `git checkout -b hotfix/critical-bug main`
2. Fix the issue and test
3. Bump patch version: `npm run version:patch`
4. Merge to main: `git checkout main && git merge hotfix/critical-bug`
5. Deploy immediately
6. Merge back to develop: `git checkout develop && git merge main`

## 📞 Need Help?

- Check [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
- Create an issue for questions
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help