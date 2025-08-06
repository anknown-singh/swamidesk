# SwamIDesk Release Process Documentation

## 🚀 Automated Release System Overview

SwamIDesk uses **Google's Release Please** for fully automated version management and deployments to Vercel. This system automatically handles versioning, changelog generation, and production deployments.

## 📋 Current System Status

- **Current Version**: v1.0.0
- **Release System**: ✅ Active (Release Please + Vercel)
- **Auto Deployments**: ✅ Working
- **Manual Triggers**: ✅ Available

## 🔄 How It Works

### Automatic Release Flow

1. **Developer commits** with conventional commit messages to `main` branch
2. **Release Please analyzes** commits since last release
3. **Creates Release PR** with version bump and changelog
4. **Merge Release PR** → Creates GitHub release + git tag
5. **Triggers Vercel deployment** → Automatic production deployment
6. **Posts deployment status** with live URL

### Conventional Commit Format

```bash
<type>(<scope>): <description>

# Examples:
feat: add patient appointment booking system
fix: resolve queue synchronization issue
feat!: breaking change to authentication system
docs: update API documentation
chore: update dependencies
```

### Commit Types & Version Impact

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | **PATCH** (1.0.0 → 1.0.1) | Bug fixes, small improvements |
| `feat:` | **MINOR** (1.0.0 → 1.1.0) | New features, enhancements |
| `feat!:` or `BREAKING CHANGE:` | **MAJOR** (1.0.0 → 2.0.0) | Breaking changes |
| `docs:`, `chore:`, `style:` | **No version bump** | Non-functional changes |

## 🎯 Usage Instructions

### Normal Development Workflow

1. **Make your changes** in feature branches
2. **Create PR** to `main` branch
3. **Use conventional commit messages** in your commits
4. **Merge PR** - Release Please will analyze changes
5. **Check for Release PR** - Will be created automatically if needed
6. **Review & Merge Release PR** - Triggers deployment

### Manual Release Triggers

If you need to force a release:

1. Go to **GitHub Actions** tab
2. Select **Manual Release Trigger** workflow
3. Click **Run workflow**
4. Choose release type: `patch`, `minor`, or `major`
5. Provide reason (optional)
6. Click **Run**

### Check Current Version

```bash
npm run release:status
```

## 📁 Generated Files

Release Please automatically maintains:

- **CHANGELOG.md** - Auto-generated from conventional commits
- **package.json** - Version field updated automatically
- **Git tags** - Created for each release
- **GitHub releases** - With release notes

## 🔧 Configuration Files

- `.github/workflows/release-please.yml` - Main release automation
- `.github/workflows/manual-release.yml` - Manual trigger workflow
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.github/workflows/vercel_deploy.yml` - Preview deployments
- `commitlint.config.js` - Commit message validation

## 🌐 Deployment Targets

### Production
- **Trigger**: Release created (merge Release PR)
- **URL**: https://swamidesk.vercel.app (dynamic)
- **Environment**: Production
- **Branch**: main

### Preview
- **Trigger**: Pull request created
- **URL**: Auto-generated Vercel preview URL
- **Environment**: Preview
- **Branch**: Any branch with PR to main

## 📊 Monitoring & Status

### Check Release Status
```bash
# Current version
npm run release:status

# Recent releases
git log --oneline --grep="release" -5

# Check pending Release Please PR
# Go to GitHub → Pull Requests → Look for "chore(main): release" PR
```

### Deployment Status
- **GitHub Actions**: Monitor workflow runs
- **Vercel Dashboard**: Check deployment status
- **Live Site**: https://swamidesk.vercel.app

## 🐛 Troubleshooting

### Release PR Not Created
- **Cause**: No conventional commits since last release
- **Solution**: Ensure commits use conventional format (`feat:`, `fix:`, etc.)

### Deployment Failed
- **Check**: GitHub Actions logs in "Release Please" workflow
- **Verify**: Vercel secrets are properly configured
- **Action**: Re-run failed workflow or trigger manual release

### Version Not Bumped
- **Cause**: Only `docs:`, `chore:`, or `style:` commits since last release
- **Solution**: Add `feat:` or `fix:` commits, or use manual trigger

### Vercel URL Issues
- **Check**: Vercel project settings
- **Verify**: Production domain configuration
- **Update**: Workflow uses dynamic URL capture now

## ⚙️ Advanced Configuration

### Modify Version Bump Rules
Edit `.github/workflows/release-please.yml`:
```yaml
changelog-types: '[
  {"type":"feat","section":"Features","hidden":false},
  {"type":"fix","section":"Bug Fixes","hidden":false},
  // Add more types as needed
]'
```

### Customize Release Notes
Release Please uses conventional commits to auto-generate release notes. Follow the format:

```bash
feat(appointments): add real-time booking system

- Implement WebSocket connections for live updates
- Add appointment conflict resolution  
- Support for multiple user roles

Closes #123
```

## 📋 Team Guidelines

### For Developers
1. **Always use conventional commits**
2. **Include scope when relevant**: `feat(auth):`, `fix(billing):`
3. **Add breaking change notes** for major changes
4. **Reference issues**: `Closes #123`

### For Release Managers
1. **Review Release PRs carefully** before merging
2. **Test preview deployments** before production release
3. **Monitor deployment status** after releases
4. **Use manual triggers sparingly** - prefer automatic flow

### For DevOps
1. **Monitor GitHub Actions** for workflow failures
2. **Maintain Vercel secrets** and project configuration
3. **Update workflows** as deployment needs change
4. **Review release metrics** periodically

## 🎉 Success Indicators

Your release system is working correctly when:

- ✅ Conventional commits trigger Release Please PRs
- ✅ Merging Release PRs creates GitHub releases
- ✅ Production deployments happen automatically
- ✅ Vercel URLs are captured and reported dynamically
- ✅ CHANGELOG.md is updated automatically
- ✅ Version numbers increment appropriately

## 📞 Support

If you encounter issues with the release system:
1. Check this documentation first
2. Review GitHub Actions logs
3. Verify commit message format
4. Use manual release trigger as backup
5. Check Vercel deployment logs

---

**Current Status**: ✅ Release system is fully operational and optimized for Vercel hosting.