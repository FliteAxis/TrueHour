# GitHub Wiki Setup Instructions

This directory contains all the documentation formatted for GitHub Wiki.

## Setting Up the Wiki

### Option 1: Using GitHub's Web Interface

1. Go to your repository on GitHub
2. Click the "Wiki" tab
3. Click "Create the first page"
4. Copy the content from `wiki/Home.md` into the wiki editor
5. For each additional page, click "New Page" and copy the corresponding file content

### Option 2: Clone and Push the Wiki Repository

GitHub wikis are actually Git repositories. You can clone and push to them directly:

```bash
# Clone the wiki repository
git clone https://github.com/yourusername/flight_budget.wiki.git

# Copy all wiki files
cp -r wiki/* flight_budget.wiki/

# Commit and push
cd flight_budget.wiki
git add .
git commit -m "Initialize wiki documentation"
git push origin master
```

### Option 3: Automated Script

Run this script from the project root (after enabling the wiki on GitHub):

```bash
#!/bin/bash

# Clone wiki repo
git clone https://github.com/yourusername/flight_budget.wiki.git temp_wiki

# Copy files
cp wiki/*.md temp_wiki/

# Push changes
cd temp_wiki
git add .
git commit -m "Update wiki documentation"
git push origin master

# Cleanup
cd ..
rm -rf temp_wiki
```

## Wiki File Naming Convention

GitHub wiki pages use the following naming convention:
- Spaces in links become hyphens in filenames
- `Home.md` is the main landing page
- `Quick-Start.md` is accessed via the "Quick Start" link

## Maintaining the Wiki

When you update documentation:

1. Update the corresponding `.md` file in the `docs/` directory (source of truth)
2. Copy the updated file to `wiki/` with the appropriate name
3. Push changes to the wiki repository using one of the methods above

## Alternative: Keep in Main Repo

If you prefer to keep documentation in the main repository instead of a separate wiki:

1. Keep the `wiki/` directory in the main repo
2. Update the main README.md to link to wiki files
3. GitHub will render the markdown files directly in the browser

Example links in README.md:
```markdown
- [Quick Start](wiki/Quick-Start.md)
- [Aircraft Management](wiki/Aircraft-Management.md)
```

This approach keeps everything in one repository and maintains version control history for documentation.
