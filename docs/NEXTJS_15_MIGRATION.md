# Next.js 15 Migration Notes

## Dynamic Route Parameters

In Next.js 15, route parameters are now asynchronous and must be awaited before accessing their properties.

### ❌ Old Way (Next.js 14 and earlier)
```javascript
export async function GET(request, { params }) {
  const { id } = params; // Direct access
  // ...
}
```

### ✅ New Way (Next.js 15)
```javascript
export async function GET(request, { params }) {
  const { id } = await params; // Must await
  // ...
}
```

## Affected Files

All dynamic route handlers have been updated:

- ✅ `src/app/api/repositories/[id]/route.js` - GET, PUT, DELETE
- ✅ `src/app/api/documentation/[id]/route.js` - GET, POST
- ✅ `src/app/api/status/[id]/route.js` - GET, POST

## Error Message

If you see this error:
```
Error: Route "/api/repositories/[id]" used `params.id`. 
`params` is a Promise and must be unwrapped with `await` 
or `React.use()` before accessing its properties.
```

**Solution**: Add `await` before accessing `params`:
```javascript
const { id } = await params;
```

## Why This Change?

Next.js 15 made this change to:
1. Support streaming and partial prerendering
2. Enable better performance optimizations
3. Provide more consistent async behavior

## Reference

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Dynamic Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
