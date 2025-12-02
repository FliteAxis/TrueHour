# GitHub Wiki Migration Guide

This guide explains how to migrate the wiki documentation from the repository to GitHub Wiki.

## Overview

The flight-budget wiki documentation is currently stored in the `/wiki` directory of the repository. GitHub Wiki is a separate Git repository that can be cloned, edited, and pushed independently.

## Why Migrate to GitHub Wiki?

**Pros:**
- Native GitHub integration with Wiki tab
- Separate versioning from code
- Easier discoverability for users
- Built-in wiki navigation sidebar
- GitHub renders wiki pages with special features

**Cons:**
- Separate Git repository to manage
- Requires separate clone/push workflow
- Loses integration with code PRs
- No code review for wiki changes by default

## Migration Steps

### Option 1: One-Time Manual Push

If you want to do a one-time migration and then manage the wiki separately:

1. **Enable GitHub Wiki on your repository**
   - Go to your repository on GitHub
   - Click **Settings** > **Features**
   - Enable **Wikis**

2. **Create initial wiki page**
   - Go to the **Wiki** tab
   - Click **Create the first page**
   - Enter any content (it will be replaced)
   - Click **Save Page**

3. **Clone the Wiki repository**
   ```bash
   # From your project root
   cd ..
   git clone https://github.com/ryakel/flight-budget.wiki.git
   ```

4. **Copy wiki files to Wiki repository**
   ```bash
   # Copy all markdown files
   cp flight_budget/wiki/*.md flight-budget.wiki/

   cd flight-budget.wiki
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Initial wiki migration from repository

   Migrated all documentation from /wiki directory to GitHub Wiki"

   git push origin master
   ```

6. **Verify migration**
   - Visit https://github.com/ryakel/flight-budget/wiki
   - Check that all pages appear correctly
   - Test internal links

### Option 2: Git Subtree (Advanced)

If you want to keep the wiki in-repo but also sync to GitHub Wiki:

```bash
# Add GitHub Wiki as a remote
git remote add wiki https://github.com/ryakel/flight-budget.wiki.git

# Push wiki subtree to GitHub Wiki
git subtree push --prefix=wiki wiki master
```

**Note**: This approach requires careful management to avoid conflicts.

### Option 3: Automated Sync with GitHub Actions

Create a workflow to automatically sync wiki changes:

**`.github/workflows/sync-wiki.yml`:**
```yaml
name: Sync Wiki

on:
  push:
    branches:
      - main
    paths:
      - 'wiki/**'

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Checkout Wiki
        uses: actions/checkout@v4
        with:
          repository: ${{ github.repository }}.wiki
          path: wiki-repo
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Sync wiki files
        run: |
          # Copy all markdown files
          cp wiki/*.md wiki-repo/

          cd wiki-repo

          # Configure git
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # Commit and push if there are changes
          if [[ -n $(git status -s) ]]; then
            git add .
            git commit -m "Sync wiki from repository

            Automated sync from main branch

            Co-Authored-By: github-actions[bot] <github-actions[bot]@users.noreply.github.com>"
            git push origin master
          fi
```

## Post-Migration Tasks

### Update Repository Links

After migrating to GitHub Wiki, update links in your repository:

**In README.md and other docs:**
```markdown
# Change from:
[Documentation](wiki/Home.md)

# To:
[Documentation](https://github.com/ryakel/flight-budget/wiki)
```

**For specific pages:**
```markdown
# Change from:
[Quick Start](wiki/Quick-Start.md)

# To:
[Quick Start](https://github.com/ryakel/flight-budget/wiki/Quick-Start)
```

### Create Wiki Sidebar

GitHub Wiki supports a special `_Sidebar.md` file for navigation:

**`_Sidebar.md`:**
```markdown
### Flight Budget Wiki

**Getting Started**
- [Home](Home)
- [Quick Start](Quick-Start)

**Deployment**
- [Deployment Guide](Deployment)
- [Container Setup](Container-Setup)
- [Pre-Deployment Checklist](Pre-Deployment-Checklist)

**Development**
- [Branch Strategy](Branch-Strategy)
- [GitHub Actions](GitHub-Actions)
- [Dependency Management](Dependency-Management)

**Infrastructure**
- [Docker Build Setup](Docker-Build-Setup)
- [Local Multi-Arch Build](Local-Multi-Arch-Build)

**Reference**
- [Project Structure](Project-Structure)
- [Quick Reference](Quick-Reference)
```

### Create Wiki Footer

GitHub Wiki supports a special `_Footer.md` file:

**`_Footer.md`:**
```markdown
---
📖 [View on GitHub](https://github.com/ryakel/flight-budget) | 🐛 [Report Issue](https://github.com/ryakel/flight-budget/issues) | 💬 [Discussions](https://github.com/ryakel/flight-budget/discussions)
```

## Managing Both Repository and Wiki

If you choose to keep documentation in both places:

### Keep Repository Wiki as Source of Truth
- Edit all documentation in `/wiki` directory
- Use GitHub Actions to auto-sync to GitHub Wiki
- Set up branch protection to require PR reviews for wiki changes

### Benefits of Dual Approach
- ✅ Version control with code reviews (repository)
- ✅ Easy discoverability (GitHub Wiki)
- ✅ Automatic synchronization
- ✅ Documentation versioned with code

### Workflow
1. Make changes to `/wiki/*.md` in the repository
2. Create PR and get review
3. Merge to main
4. GitHub Actions automatically syncs to GitHub Wiki

## Keeping Wiki In-Repository Only

If you prefer to keep the wiki in the repository:

**Advantages:**
- ✅ Single source of truth
- ✅ Wiki changes reviewed with code
- ✅ Documentation versioned with features
- ✅ Easier for contributors (one repo)

**Disadvantages:**
- ❌ No native GitHub Wiki tab
- ❌ Must navigate to `/wiki` directory
- ❌ Less discoverable for users

**Recommendation:** Add prominent link in README pointing to `/wiki` directory.

## Recommendations

For this project, I recommend **Option 3: Automated Sync** because:

1. **Best of both worlds**: Keep wiki in repository for version control and code review, but also sync to GitHub Wiki for discoverability
2. **Single source of truth**: Repository `/wiki` is authoritative
3. **Automated**: No manual sync required
4. **Versioned with code**: Wiki changes are part of pull requests
5. **User-friendly**: GitHub Wiki tab works for users who expect it

## Implementation Checklist

- [ ] Enable GitHub Wiki in repository settings
- [ ] Create initial wiki page on GitHub
- [ ] Clone GitHub Wiki repository
- [ ] Copy all markdown files from `/wiki` to Wiki repository
- [ ] Commit and push to GitHub Wiki
- [ ] Create `_Sidebar.md` for navigation
- [ ] Create `_Footer.md` for footer links
- [ ] Add GitHub Actions workflow for auto-sync (optional)
- [ ] Update repository README.md links
- [ ] Test all wiki links
- [ ] Update issue templates if they reference wiki
- [ ] Document wiki workflow in CONTRIBUTING.md

## Troubleshooting

### Wiki Repository Clone Fails
**Error:** `Repository not found`
**Solution:** You must create at least one page in the GitHub Wiki before you can clone it.

### Broken Internal Links
**Issue:** Links between wiki pages don't work
**Solution:** GitHub Wiki uses different link format. Change `[Page](Page.md)` to `[Page](Page)`.

### Images Not Displaying
**Issue:** Images referenced in wiki don't show
**Solution:**
- Upload images to wiki repository (not supported via web)
- Or use absolute URLs to images in main repository
- Or use GitHub Issues to host images (upload to issue, copy URL)

### Sync Workflow Fails
**Issue:** GitHub Actions can't push to wiki
**Solution:** Ensure `GITHUB_TOKEN` has write permissions:
```yaml
permissions:
  contents: write
```

## Additional Resources

- [GitHub Wiki Documentation](https://docs.github.com/en/communities/documenting-your-project-with-wikis)
- [Markdown Guide](https://guides.github.com/features/mastering-markdown/)
- [Git Subtree Tutorial](https://www.atlassian.com/git/tutorials/git-subtree)

## Questions?

If you need help with wiki migration:
- 🐛 [Open an Issue](https://github.com/ryakel/flight-budget/issues)
- 💬 [Start a Discussion](https://github.com/ryakel/flight-budget/discussions)
