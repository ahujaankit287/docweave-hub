# Repository Options

Each integrated repository has two automation options that control how documentation is managed.

## Auto-run on Code Change

**Field**: `autoUpdate`  
**Type**: Boolean  
**Default**: `false`

### What it does
When enabled, the system automatically regenerates documentation whenever code changes are detected in the repository.

### Use Cases
- **Continuous Documentation**: Keep docs always in sync with code
- **Active Development**: Useful for rapidly changing codebases
- **Team Collaboration**: Ensure all team members see latest docs

### How it works
1. System monitors repository for changes (via webhooks or polling)
2. When changes detected, triggers documentation generation
3. Updates documentation automatically
4. Notifies team of new documentation version

### When to enable
✅ Active development repositories  
✅ Frequently updated services  
✅ Team-shared documentation  

### When to disable
❌ Stable/archived repositories  
❌ Infrequently updated projects  
❌ Manual documentation review required  

---

## Auto-merge README Commit

**Field**: `autoMerge`  
**Type**: Boolean  
**Default**: `false`

### What it does
When enabled, automatically merges the generated README documentation back into the repository as a commit.

### Use Cases
- **Self-Documenting Repos**: Keep README.md always up-to-date
- **Automated Workflows**: Part of CI/CD pipeline
- **Single Source of Truth**: Generated docs become the official README

### How it works
1. Documentation is generated
2. System creates a new README.md file
3. Commits the file to the repository
4. Automatically merges the commit (if enabled)
5. Updates repository with new documentation

### When to enable
✅ Automated documentation workflows  
✅ Trusted generation process  
✅ No manual review needed  

### When to disable
❌ Manual review required  
❌ Custom README formatting  
❌ Multiple documentation sources  

---

## Configuration

### Via UI (Add Repository)
1. Enter repository URL
2. Check "Auto-run on code change" for `autoUpdate`
3. Check "Auto-merge README commit" for `autoMerge`
4. Click "Add & Auto Generate Documentation"

### Via UI (Manage Integrations)
1. Navigate to `/manage`
2. Click edit icon on repository
3. Toggle checkboxes for desired options
4. Click "Save Changes"

### Via JSON File
Edit `data/repositories.json`:
```json
{
  "id": "1",
  "name": "my-repo",
  "url": "https://github.com/user/repo.git",
  "branch": "main",
  "autoUpdate": true,
  "autoMerge": false,
  ...
}
```

### Via API
```javascript
// Create repository with options
POST /api/repositories
{
  "name": "my-repo",
  "url": "https://github.com/user/repo.git",
  "branch": "main",
  "autoUpdate": true,
  "autoMerge": false
}

// Update repository options
PUT /api/repositories/1
{
  "autoUpdate": true,
  "autoMerge": false
}
```

---

## Recommended Combinations

### Development Repository
```json
{
  "autoUpdate": true,
  "autoMerge": false
}
```
Generate docs on every change, but review before merging.

### Production Service
```json
{
  "autoUpdate": false,
  "autoMerge": false
}
```
Manual control over documentation updates.

### Automated Pipeline
```json
{
  "autoUpdate": true,
  "autoMerge": true
}
```
Fully automated documentation workflow.

### Archived Project
```json
{
  "autoUpdate": false,
  "autoMerge": false
}
```
No automatic updates for stable/archived code.

---

## Security Considerations

### Auto-merge Risks
- Requires write access to repository
- Could overwrite manual README changes
- Should be used with trusted generation process

### Recommendations
1. Test with `autoMerge: false` first
2. Review generated documentation quality
3. Enable `autoMerge` only when confident
4. Use branch protection rules
5. Require pull request reviews for sensitive repos

---

## Troubleshooting

### Auto-update not triggering
- Check webhook configuration
- Verify repository access permissions
- Check system logs for errors

### Auto-merge failing
- Verify write permissions
- Check for merge conflicts
- Review branch protection rules
- Ensure README.md path is correct

### Documentation not updating
- Check repository status (should be "generating")
- Verify API key is configured
- Check error logs in console
- Try manual regeneration
