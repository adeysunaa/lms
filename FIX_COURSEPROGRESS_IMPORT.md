# Fix: CourseProgress Import Error

## Issue

The server was crashing with the error:
```
SyntaxError: The requested module does not provide an export named 'CourseProgress'
```

This error occurred because `userController.js` was using a **named import** for CourseProgress, but the model was exported as a **default export**.

## Root Cause

In `server/models/CourseProgress.js`, the model is exported as default:
```javascript
export default CourseProgress;
```

However, in `server/controllers/userController.js`, it was being imported as a named export:
```javascript
import { CourseProgress } from '../models/CourseProgress.js';  // ❌ WRONG
```

## Solution Applied

Changed the import statement in `server/controllers/userController.js` from named import to default import:

**Before:**
```javascript
import { CourseProgress } from '../models/CourseProgress.js';
```

**After:**
```javascript
import CourseProgress from '../models/CourseProgress.js';
```

## Files Modified

- `server/controllers/userController.js` - Line 5: Changed import statement

## Verification

All other files are using the correct import pattern:
- ✅ `server/controllers/progressController.js` - Uses default import
- ✅ `server/controllers/certificateController.js` - Uses default import
- ✅ `server/controllers/quizController.js` - Uses dynamic import with `.default`

## Import Patterns Summary

### Correct Patterns for CourseProgress

1. **Default Import (Most Common):**
   ```javascript
   import CourseProgress from '../models/CourseProgress.js';
   ```

2. **Dynamic Import:**
   ```javascript
   const CourseProgress = (await import("../models/CourseProgress.js")).default;
   ```

### Why This Matters

ES6 modules have two types of exports:
- **Default exports**: `export default Something` → `import Something from 'module'`
- **Named exports**: `export { Something }` → `import { Something } from 'module'`

Mixing them causes syntax errors at runtime.

## Testing

After this fix:
1. ✅ Server starts without errors
2. ✅ No linter errors in any files
3. ✅ CourseProgress model can be accessed correctly
4. ✅ All progress tracking functionality works

## Related Models Export Patterns

For consistency, here are the export patterns used in the project:

- `User.js` - **Default export**: `export default User`
- `Course.js` - **Default export**: `export default Course`
- `CourseProgress.js` - **Default export**: `export default CourseProgress`
- `Purchase.js` - **Named export**: `export { Purchase }`
- `ForumPost.js` - **Named export**: `export { ForumPost }`
- `Certificate.js` - **Named exports**: `export { CertificateTemplate, IssuedCertificate }`

## Best Practice

When creating new models, decide on one export pattern and document it. For this project:
- Use **default export** for primary/single models
- Use **named exports** when exporting multiple related models from one file


