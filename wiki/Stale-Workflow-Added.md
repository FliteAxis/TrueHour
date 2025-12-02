# Stale Workflow Added

## Summary

The stale issues workflow has been successfully added to the TrueHour repository, matching the configuration from your stream-harvestarr repository.

---

## What Was Added

### File: `.github/workflows/stale.yml`

**Purpose**: Automatically close inactive issues and pull requests to keep the repository clean and manageable.

**Configuration**:
- **Schedule**: Runs daily at 1:30 AM UTC
- **Permissions**: Issues, pull requests, and contents (write access)

---

## How It Works

### Issues
1. **After 30 days** of inactivity → Marked as `stale`
   - Comment added: "This issue is stale because it has been open 30 days with no activity. Remove stale label or comment or this will be closed in 5 days."

2. **After 5 more days** (35 total) → Issue closed
   - Comment added: "This issue was closed because it has been stalled for 5 days with no activity."

### Pull Requests
1. **After 45 days** of inactivity → Marked as `stale`
   - Comment added: "This PR is stale because it has been open 45 days with no activity. Remove stale label or comment or this will be closed in 10 days."

2. **After 10 more days** (55 total) → PR closed
   - Comment added: "This PR was closed because it has been stalled for 10 days with no activity."

---

## Exempt Labels

Issues or PRs with these labels will **never** be marked stale or closed:
- `awaiting-approval` - Items waiting for review
- `wip` - Work in progress

---

## How to Prevent Closure

If you want to keep an issue or PR open, you have several options:

### Option 1: Add a Comment
Any comment on the issue/PR resets the inactivity timer.

```
Example: "Still working on this, need more time to investigate."
```

### Option 2: Remove the Stale Label
Once the bot adds the `stale` label, you can manually remove it:
1. Go to the issue/PR
2. Click the `stale` label to remove it
3. Timer resets

### Option 3: Add an Exempt Label
Add one of the exempt labels:
- `awaiting-approval`
- `wip`

---

## Timeline Examples

### Issue Timeline
```
Day 0:  Issue opened
Day 15: Last comment/activity
Day 45: [30 days later] Marked stale + warning comment
Day 48: Someone adds comment → Stale label removed
Day 78: [30 days later] Marked stale again
Day 83: [5 days later] Issue closed
```

### Pull Request Timeline
```
Day 0:  PR opened
Day 10: Last commit/comment
Day 55: [45 days later] Marked stale + warning comment
Day 60: No activity
Day 65: [10 days later] PR closed
```

---

## Benefits

### Repository Maintenance
- ✅ Keeps issue list clean and focused
- ✅ Encourages timely responses
- ✅ Reduces clutter from abandoned issues/PRs

### Contributor Experience
- ✅ Clear expectations about activity
- ✅ Fair warning before closure (5-10 days)
- ✅ Easy to reopen if needed

### Project Management
- ✅ Identifies truly active work
- ✅ Surfaces issues that need attention
- ✅ Automates repetitive maintenance tasks

---

## Monitoring

### View Stale Workflow Runs
```
Repository → Actions → Close inactive issues
```

### Check for Stale Items
```
Repository → Issues → Filter by label: stale
Repository → Pull Requests → Filter by label: stale
```

### Workflow Logs
Each run shows:
- Number of issues/PRs checked
- Items marked stale
- Items closed
- Items exempted

---

## Customization

If you need to adjust the timing, edit [`.github/workflows/stale.yml`](../.github/workflows/stale.yml):

### Change Stale Period
```yaml
days-before-issue-stale: 30   # Change to 60 for longer wait
days-before-pr-stale: 45      # Change to 90 for longer wait
```

### Change Close Period
```yaml
days-before-issue-close: 5    # Change to 14 for longer warning
days-before-pr-close: 10      # Change to 21 for longer warning
```

### Add More Exempt Labels
```yaml
exempt-issue-labels: 'awaiting-approval,wip,on-hold,blocked'
exempt-pr-labels: 'awaiting-approval,wip,on-hold,blocked'
```

### Change Schedule
```yaml
schedule:
  - cron: "30 1 * * *"    # Daily at 1:30 AM UTC
  - cron: "0 0 * * 0"     # Weekly on Sunday at midnight UTC
  - cron: "0 0 1 * *"     # Monthly on 1st at midnight UTC
```

---

## Reopening Closed Items

If an issue or PR was closed by the stale bot but needs to be reopened:

1. **Reopen the issue/PR** (standard GitHub reopen)
2. **Add a comment** explaining why it's still relevant
3. **Add an exempt label** if it will take time to complete
4. **Remove stale label** if present

The bot will respect your manual intervention.

---

## Comparison with Other Workflows

| Workflow | Frequency | Purpose | Impact |
|----------|-----------|---------|--------|
| **Stale Issues** | Daily | Close inactive items | Maintenance |
| **Docker Builder** | On push | Build & deploy | Production |
| **Update Dependencies** | Weekly | Update libraries | Security |

---

## GitHub Actions Usage

**Estimated cost**: ~15 minutes/month
- Runs daily: ~30 seconds per run
- 30 days × 30 seconds = 15 minutes

**Impact on free tier**: Minimal (2000 min/month available)

---

## Related Documentation

- **[GitHub Actions Overview](GITHUB_ACTIONS.md)** - All workflows explained
- **[Docker Build Setup](DOCKER_BUILD_SETUP.md)** - Semantic versioning
- **[Automated Updates](AUTOMATED_DEPENDENCY_UPDATES.md)** - Dependency management

---

## Status

✅ **Stale workflow active**
✅ **Runs daily at 1:30 AM UTC**
✅ **Configuration matches stream-harvestarr**
✅ **No secrets required**

---

**Implemented**: 2025-11-27
**Source**: https://github.com/ryakel/stream-harvestarr/blob/main/.github/workflows/stale.yaml
**Status**: Operational
**Next run**: Tomorrow at 1:30 AM UTC
