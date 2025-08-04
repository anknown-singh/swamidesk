# Version Management Quick Reference

## 🏷️ Current Version: 1.0.0

## 📋 Quick Commands

```bash
# Check current version
npm version

# Create patch version (bug fixes) - 1.0.0 → 1.0.1
npm run version:patch

# Create minor version (new features) - 1.0.0 → 1.1.0  
npm run version:minor

# Create major version (breaking changes) - 1.0.0 → 2.0.0
npm run version:major

# Build and test before release
npm run build && npm run lint

# Push version and tags to GitHub
git push origin main && git push origin --tags
```

## 🔄 Release Workflow

1. **Make changes** and test locally
2. **Update CHANGELOG.md** with changes
3. **Run version command**: `npm run version:[patch|minor|major]`
4. **Push to GitHub**: `git push origin main --follow-tags`
5. **Create release** on GitHub with release notes

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