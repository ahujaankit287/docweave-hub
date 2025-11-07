# Documentation Storage System

## Overview
Generated documentation is now saved as markdown files and linked to repositories, allowing persistent storage and easy viewing through the UI.

## Architecture

### File Storage
```
data/
├── repositories.json          # Repository metadata
└── documentation/             # Generated documentation
    ├── my-repo-1.md          # Documentation for repo ID 1
    ├── api-service-2.md      # Documentation for repo ID 2
    └── microservice-3.md     # Documentation for repo ID 3
```

### Data Flow

#### Documentation Generation
```
1. User triggers generation
   ↓
2. Repository is cloned and analyzed
   ↓
3. LLM generates documentation
   ↓
4. Documentation saved to file
   data/documentation/{repo-name}-{repo-id}.md
   ↓
5. Repository updated with filename
   repositories.json → documentationFile: "repo-name-1.md"
   ↓
6. Status updated to "up-to-date"
```

#### Documentation Viewing
```
1. User clicks Eye icon
   ↓
2. GET /api/documentation/{id}
   ↓
3. Fetch repository metadata
   ↓
4. Read documentation file
   data/documentation/{documentationFile}
   ↓
5. Display in modal
```

## Implementation

### 1. Documentation Storage Module
**File**: `src/lib/documentationStorage.js`

```javascript
// Save documentation
await saveDocumentation(repoId, repoName, documentation);
// Returns: "my-repo-1.md"

// Read documentation
const content = await readDocumentation("my-repo-1.md");

// Delete documentation
await deleteDocumentation("my-repo-1.md");

// List all documentation
const files = await listDocumentation();
```

### 2. Repository Linking
**File**: `data/repositories.json`

```json
{
  "id": "1",
  "name": "my-repo",
  "documentationFile": "my-repo-1.md",
  "hasDocumentation": true,
  "status": "up-to-date"
}
```

### 3. API Endpoint
**Endpoint**: `GET /api/documentation/{id}`

**Response**:
```json
{
  "success": true,
  "documentation": "# My Repo Documentation\n...",
  "source": "file",
  "filename": "my-repo-1.md",
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. UI Components

#### Eye Icon (View Documentation)
- **Location**: Repository list in DocweaveHub and ManageIntegrations
- **Condition**: Only shown when `hasDocumentation === true`
- **Action**: Opens modal with documentation content
- **Icon Color**: Green (indicates available documentation)

#### Modal Display
- **Reuses existing modal** from DocweaveHub
- **Features**:
  - Markdown rendering with syntax highlighting
  - Copy to clipboard
  - Download as .md file
  - Responsive design

## File Naming Convention

### Pattern
```
{repo-name}-{repo-id}.md
```

### Examples
```
my-awesome-repo-1.md
api-service-2.md
payment-microservice-3.md
```

### Rules
- Repository name is sanitized (non-alphanumeric → hyphen)
- Converted to lowercase
- Repository ID ensures uniqueness
- Always ends with `.md`

## Storage Benefits

### 1. Persistence
- Documentation survives server restarts
- No data loss on application updates
- Easy backup and restore

### 2. Performance
- File system is faster than database for large text
- No memory overhead
- Efficient for read-heavy operations

### 3. Portability
- Standard markdown format
- Can be viewed in any text editor
- Easy to version control (if desired)
- Simple migration to other systems

### 4. Debugging
- Easy to inspect generated content
- Can manually edit if needed
- Clear file structure

## Fallback Mechanism

The system includes a fallback to in-memory storage:

```javascript
// Try file storage first
if (repository.documentationFile) {
  return await readDocumentation(repository.documentationFile);
}

// Fallback to memory
return getDocumentation(id);
```

This ensures backward compatibility with existing data.

## Cleanup

### Manual Cleanup
```bash
# Remove all documentation files
rm data/documentation/*.md

# Remove specific file
rm data/documentation/my-repo-1.md
```

### Automatic Cleanup
When a repository is deleted, its documentation file should be removed:

```javascript
// In DELETE /api/repositories/[id]
const repo = await getRepositoryById(id);
if (repo.documentationFile) {
  await deleteDocumentation(repo.documentationFile);
}
await deleteRepository(id);
```

## Backup and Migration

### Backup
```bash
# Backup all documentation
tar -czf docs-backup.tar.gz data/documentation/

# Backup specific repository
cp data/documentation/my-repo-1.md backups/
```

### Restore
```bash
# Restore all documentation
tar -xzf docs-backup.tar.gz

# Restore specific file
cp backups/my-repo-1.md data/documentation/
```

### Migration
```bash
# Copy to new instance
scp -r data/documentation/ user@newserver:/path/to/app/data/
```

## Security Considerations

### 1. File Access
- Files are stored server-side only
- Not directly accessible via HTTP
- Accessed only through API endpoints

### 2. Input Validation
- Repository ID is validated
- Filename is sanitized
- Path traversal is prevented

### 3. Permissions
- Documentation directory should have restricted permissions
- Only application should have write access

```bash
chmod 750 data/documentation
```

## Monitoring

### File Size
```bash
# Check total size
du -sh data/documentation/

# Check individual files
ls -lh data/documentation/
```

### File Count
```bash
# Count documentation files
ls data/documentation/*.md | wc -l
```

### Orphaned Files
Files without corresponding repository entries:

```javascript
// List all documentation files
const files = await listDocumentation();

// Get all repositories
const repos = await getAllRepositories();

// Find orphaned files
const linkedFiles = repos.map(r => r.documentationFile).filter(Boolean);
const orphaned = files.filter(f => !linkedFiles.includes(f));
```

## Troubleshooting

### Documentation Not Showing
1. Check if `hasDocumentation` is true
2. Verify `documentationFile` field exists
3. Check if file exists in `data/documentation/`
4. Check file permissions

### File Not Found Error
1. Verify filename in repository metadata
2. Check if file was deleted manually
3. Regenerate documentation

### Large Files
1. Monitor file sizes
2. Consider compression for very large docs
3. Implement file size limits

## Future Enhancements

1. **Versioning**: Keep multiple versions of documentation
2. **Compression**: Gzip large documentation files
3. **CDN**: Serve documentation from CDN
4. **Search**: Full-text search across all documentation
5. **Export**: Bulk export all documentation
6. **Templates**: Custom documentation templates
