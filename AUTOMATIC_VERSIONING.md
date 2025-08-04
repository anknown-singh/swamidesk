# 🚀 Automatic Version Management Guide

SwamIDesk now features **fully automated version management** using Release-Please and conventional commits!

## 🎯 How It Works

### 1. **Conventional Commits Trigger Versions**
Your commit messages determine version bumps:

```bash
# Minor version (1.0.0 → 1.1.0)
feat(dashboard): add patient search functionality

# Patch version (1.0.0 → 1.0.1)  
fix(auth): resolve login redirect issue

# Major version (1.0.0 → 2.0.0)
feat(api)!: change authentication to OAuth2

BREAKING CHANGE: API now requires OAuth2 tokens
```

### 2. **Release-Please Creates PRs**
When you push conventional commits to main:
- 🤖 Release-Please analyzes your commits
- 📝 Creates a Release PR with version bump
- 📋 Generates changelog automatically
- 🏷️ Proposes the next semantic version

### 3. **Merge PR = Release**
When you merge the Release PR:
- ✅ Version is bumped in package.json
- 🏷️ Git tag is created
- 📦 GitHub release is published
- 🚀 Vercel automatically deploys

## 🛠️ Developer Workflow

### Option 1: Guided Commits (Recommended)
```bash
# Use commitizen for interactive commit creation
npm run commit

# Follow the prompts:
# ? Select the type of change: feat
# ? What is the scope: dashboard  
# ? Short description: add patient search
# ? Longer description: (optional)
# ? Breaking changes: (optional)
```

### Option 2: Manual Conventional Commits
```bash
# Follow the format: type(scope): description
git commit -m "feat(dashboard): add patient search functionality"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "docs(readme): update installation guide"
```

### Option 3: Use Git Message Template
```bash
# Set up the template (one-time setup)
git config commit.template .gitmessage

# Now git commit opens editor with helpful template
git commit
```

## 🔍 Commit Types Reference

| Type | Description | Version Impact | Example |
|------|-------------|----------------|---------|
| `feat` | New feature | **Minor** | `feat(auth): add 2FA support` |
| `fix` | Bug fix | **Patch** | `fix(dashboard): resolve chart display` |
| `docs` | Documentation | None | `docs(api): update endpoint docs` |
| `style` | Code formatting | None | `style(components): format with prettier` |
| `refactor` | Code restructure | None | `refactor(utils): simplify helper functions` |
| `perf` | Performance improvement | **Patch** | `perf(images): optimize loading speed` |
| `test` | Tests | None | `test(auth): add login unit tests` |
| `build` | Build system | None | `build(deps): update dependencies` |
| `ci` | CI/CD changes | None | `ci(github): add deployment workflow` |
| `chore` | Maintenance | None | `chore(config): update eslint rules` |

## 🚨 Breaking Changes

To trigger a **major version bump**, use one of these methods:

### Method 1: Exclamation Mark
```bash
git commit -m "feat(api)!: change authentication method"
```

### Method 2: Breaking Change Footer
```bash
git commit -m "feat(api): change authentication method

BREAKING CHANGE: API now requires OAuth2 instead of basic auth"
```

## 📋 What Happens Automatically

### On Push to Main:
1. ✅ CI/CD runs tests and linting
2. 🤖 Release-Please analyzes commits since last release
3. 📝 Creates/updates Release PR if changes warrant a release
4. 🔄 Preview deployment created for PR testing

### On Release PR Merge:
1. 📦 Version bumped in package.json
2. 🏷️ Git tag created (e.g., v1.1.0)
3. 📋 CHANGELOG.md updated automatically
4. 🚀 GitHub release published
5. 🌐 Production deployment to Vercel
6. 💬 Deployment notification comment

## 🎛️ Configuration

### Release-Please Settings
Located in `.github/workflows/release-please.yml`:
- **Release type**: `node` (for Next.js projects)
- **Package name**: `swamidesk`
- **Changelog sections** for different commit types
- **Automatic Vercel deployment** on release

### Commit Validation
- **Commitlint**: Validates commit message format
- **Husky**: Git hooks for commit message validation
- **Commitizen**: Interactive commit message creation

## 🔧 Developer Setup

### First-time Setup
```bash
# Install dependencies (already done)
npm install

# Set up git message template (optional)
git config commit.template .gitmessage

# Test commit validation
npm run commit
```

### Daily Workflow
```bash
# 1. Make your changes
# ... code changes ...

# 2. Stage changes
git add .

# 3. Create conventional commit
npm run commit
# OR
git commit -m "feat(component): add new feature"

# 4. Push to main
git push origin main

# 5. Wait for Release-Please PR (if changes warrant release)
# 6. Review and merge Release PR when ready
```

## 📊 Release Monitoring

### GitHub Actions
- Monitor workflows in **Actions** tab
- Check Release-Please PR creation
- View deployment status

### Vercel Dashboard
- Production deployments tracked
- Performance metrics available
- Deployment logs accessible

### Release History
- All releases in **GitHub Releases**
- Changelog automatically maintained
- Semantic version tags preserved

## 🚨 Troubleshooting

### Commit Message Rejected
```bash
# Error: commit message doesn't follow conventional format
# Solution: Use npm run commit or fix message format
git commit -m "fix(auth): resolve login issue"  # ✅ Correct
git commit -m "fixed login bug"                 # ❌ Incorrect
```

### Release-Please Not Creating PR
- Ensure commits follow conventional format
- Check if changes warrant a release (feat/fix required)
- Verify GitHub Actions have proper permissions

### Deployment Issues
- Check Vercel secrets in GitHub repository settings
- Verify build passes locally: `npm run build`
- Monitor GitHub Actions for error logs

## 🎯 Benefits

✅ **Automated versioning** based on semantic meaning  
✅ **Consistent changelog** generation  
✅ **No manual version management** needed  
✅ **Integration with deployment** pipeline  
✅ **Enforced commit conventions** for better history  
✅ **Collaborative release process** through PRs  
✅ **Rollback capabilities** through git tags  

## 🆕 Migration from Manual Versioning

The old manual version commands still work but are no longer needed:
```bash
# OLD WAY (still works, but not recommended)
npm run version:minor
git push origin main --follow-tags

# NEW WAY (recommended)
npm run commit  # or conventional commit
git push origin main
# Release-Please handles the rest!
```

---

🎉 **Your SwamIDesk project now has professional, automated version management!** 

Every meaningful change automatically gets the appropriate version number, changelog entry, and deployment. Focus on building features – let automation handle releases! 🚀