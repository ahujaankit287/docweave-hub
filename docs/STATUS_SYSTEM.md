# Repository Status System

## Overview
The application uses a simple three-state status system to track repository documentation generation.

## Status Values

### `generating`
- **Meaning**: Documentation is currently being generated
- **Icon**: Spinning refresh icon (yellow)
- **When Set**: 
  - When a repository is first added
  - When documentation regeneration is triggered
- **Next States**: `up-to-date` or `error`

### `up-to-date`
- **Meaning**: Documentation has been successfully generated and is current
- **Icon**: Check circle (green)
- **When Set**: 
  - After successful documentation generation
  - After successful documentation regeneration
- **Next States**: `generating` (when regenerated)

### `error`
- **Meaning**: Documentation generation failed
- **Icon**: Alert circle (red)
- **When Set**: 
  - When repository cloning fails
  - When analysis fails
  - When LLM API call fails
  - When any error occurs during generation
- **Next States**: `generating` (when retry is triggered)

## Status Flow

```
[New Repository Added]
         ↓
    generating
         ↓
    ┌────┴────┐
    ↓         ↓
up-to-date  error
    ↓         ↓
    └────┬────┘
         ↓
   [Regenerate]
         ↓
    generating
```

## Implementation

### Frontend Components
- `DocweaveHub.jsx` - Displays status icons and text in repository list
- `ManageIntegrations.jsx` - Shows detailed status in management interface

### Backend
- `repositoryStorage.js` - Stores status in JSON file
- `repositories/route.js` - Updates status during generation
- `generate/route.js` - Sets status based on generation result

## Status Display

| Status | Icon | Color | Text |
|--------|------|-------|------|
| generating | ⟳ | Yellow | "Generating..." |
| up-to-date | ✓ | Green | "Up-to-date" |
| error | ⚠ | Red | "Error" |

## Best Practices

1. **Always set status to `generating` before starting generation**
   ```javascript
   await updateRepositoryStatus(repoId, "generating");
   ```

2. **Update to `up-to-date` on success**
   ```javascript
   await updateRepositoryStatus(repoId, "up-to-date", true);
   ```

3. **Update to `error` on failure**
   ```javascript
   await updateRepositoryStatus(repoId, "error", false);
   ```

4. **Include `hasDocumentation` flag**
   - `true` when status is `up-to-date`
   - `false` when status is `generating` or `error`

## Migration Notes

Previously, the system used both `success` and `up-to-date` statuses. These have been consolidated into a single `up-to-date` status for simplicity and clarity.

If migrating from an older version, update any `success` status values to `up-to-date` in your `data/repositories.json` file.
