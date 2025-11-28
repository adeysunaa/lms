# Fix: Google Generative AI Package Not Found

## Issue

The backend server was crashing with the error:
```
Module not found: @google/generative-ai
```

This error occurred because the Google Generative AI package, which is required for the AI chatbot functionality, was not installed in the server's `node_modules`.

## Solution

Installed the missing package using npm:

```bash
npm install @google/generative-ai
```

## Package Details

- **Package Name**: `@google/generative-ai`
- **Version Installed**: `^0.24.1`
- **Purpose**: Powers the AI chatbot feature using Google's Gemini API
- **Location**: `server/package.json` dependencies

## Files Using This Package

- `server/controllers/chatController.js` - Main chatbot controller that uses the Google Generative AI SDK

## Verification

The package is now listed in `server/package.json`:

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    ...
  }
}
```

## Server Status

The server should now start successfully without the "module not found" error. The AI chatbot functionality will work as expected.

## Related Configuration

Make sure your `.env` file contains:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `GEMINI_MODEL` - Optional, comma-separated list of preferred models (e.g., "gemini-1.5-flash,gemini-1.5-pro")

## Testing

To verify the fix:
1. Start the server: `npm start` or `npm run server` (for development)
2. Check that the server starts without errors
3. Test the AI chatbot functionality in the client application
4. Verify chatbot responses are working

## Notes

- The chatbot controller includes error handling for missing API keys
- It automatically falls back to available models if the specified model is not available
- The controller caches the selected model for better performance



