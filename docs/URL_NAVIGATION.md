# URL Navigation for Documentation Viewing

## Overview
The application supports URL parameters to directly open documentation from external links or the manage page.

## URL Format

### View Documentation
```
/?view={repoId}&name={repoName}
```

### Parameters
- **view** (required): Repository ID
- **name** (optional): Repository name for display

### Examples
```
# View repository with ID 1
/?view=1

# View repository with ID and name
/?view=1&name=my-awesome-repo

# View from manage page
/?view=3&name=payment-microservice
```

## Implementation

### 1. URL Parameter Detection
**File**: `src/components/DocweaveHub.jsx`

```javascript
useEffect(() => {
  fetchRepositories();
  
  // Check for view parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const viewId = urlParams.get('view');
  const viewName = urlParams.get('name');
  
  if (viewId) {
    setTimeout(() => {
      viewDocumentation(viewId, viewName || 'Repository');
    }, 500);
  }
}, []);
```

### 2. Navigation from Manage Page
**File**: `src/components/ManageIntegrations.jsx`

```javascript
const viewDocumentation = (repoId, repoName) => {
  window.location.href = `/?view=${repoId}&name=${encodeURIComponent(repoName)}`;
};
```

### 3. URL Cleanup
After opening the modal, URL parameters are removed for cleaner URLs:

```javascript
// Clean up URL parameters after opening modal
if (window.location.search) {
  window.history.replaceState({}, '', window.location.pathname);
}
```

## User Flow

### From Manage Page
```
1. User clicks Eye icon on repository
   ↓
2. Navigate to /?view=1&name=my-repo
   ↓
3. Main page loads
   ↓
4. Detects URL parameters
   ↓
5. Fetches documentation
   ↓
6. Opens modal automatically
   ↓
7. Cleans up URL → /
```

### Direct Link
```
1. User visits /?view=1
   ↓
2. Page loads with parameters
   ↓
3. Fetches documentation
   ↓
4. Opens modal
   ↓
5. URL cleaned to /
```

## Benefits

### 1. Deep Linking
- Share direct links to documentation
- Bookmark specific documentation
- Navigate from external tools

### 2. Seamless Navigation
- Click Eye icon in manage page
- Automatically opens in main page
- No manual navigation needed

### 3. Clean URLs
- Parameters removed after use
- Browser history stays clean
- No clutter in address bar

### 4. Flexible
- Works with or without name parameter
- Handles missing documentation gracefully
- Shows error notifications if needed

## Error Handling

### Documentation Not Found
```javascript
if (!response.ok) {
  setNotification({
    type: "error",
    message: "Documentation not found",
  });
}
```

### Invalid Repository ID
- Shows error notification
- Modal doesn't open
- User stays on main page

### Network Errors
- Catches fetch errors
- Shows user-friendly message
- Doesn't break the page

## Use Cases

### 1. Team Collaboration
```
# Share documentation link with team
https://docweave.app/?view=5&name=api-service

# Team member clicks link
# Documentation opens automatically
```

### 2. Documentation Portal
```
# List of documentation links
- [API Service](/?view=1&name=api-service)
- [Auth Service](/?view=2&name=auth-service)
- [Payment Service](/?view=3&name=payment-service)
```

### 3. External Integration
```
# Link from project management tool
https://docweave.app/?view=7&name=mobile-app

# Link from Slack/Teams
Check out the docs: /?view=7
```

### 4. Manage Page Navigation
```
# User in manage page
# Clicks Eye icon
# Redirects to main page with documentation open
```

## Technical Details

### Timing
- 500ms delay ensures component is ready
- Allows repositories to load first
- Prevents race conditions

### URL Encoding
- Repository names are URL-encoded
- Handles special characters
- Prevents URL parsing issues

### History Management
- Uses `replaceState` not `pushState`
- Doesn't add to browser history
- Back button works as expected

## Testing

### Manual Testing
```bash
# Test with ID only
http://localhost:3000/?view=1

# Test with ID and name
http://localhost:3000/?view=1&name=test-repo

# Test with special characters
http://localhost:3000/?view=1&name=my%20awesome%20repo

# Test invalid ID
http://localhost:3000/?view=999

# Test from manage page
# Click Eye icon and verify redirect
```

### Edge Cases
- ✅ Missing documentation file
- ✅ Invalid repository ID
- ✅ Network errors
- ✅ Special characters in name
- ✅ Missing name parameter
- ✅ Multiple parameters

## Future Enhancements

1. **Query String Builder**
   ```javascript
   const buildDocUrl = (repoId, repoName) => {
     const params = new URLSearchParams({ view: repoId });
     if (repoName) params.set('name', repoName);
     return `/?${params}`;
   };
   ```

2. **Analytics**
   - Track documentation views
   - Monitor popular docs
   - Analyze navigation patterns

3. **Sharing Features**
   - Copy link button
   - Social media sharing
   - QR code generation

4. **Versioning**
   - Add version parameter
   - View historical documentation
   - Compare versions
