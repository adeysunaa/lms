# 🤖 Chatbot API Key Setup Guide

## ⚠️ Quick Diagnosis

**Seeing this error?** Here's what it means:

| Error Message | Cause | Quick Fix |
|---------------|-------|-----------|
| "Failed to send message" | Wrong API key or quota exceeded | Check `.env` file, verify API key |
| "No available Gemini model found" | All models failed to load | Verify API key at https://aistudio.google.com/app/apikey |
| "Quota exceeded" / 429 error | Free tier limit reached | Wait 1 minute and try again |
| "API key is not configured" | Missing `GEMINI_API_KEY` in `.env` | Add API key to `server/.env` |

## Problem

You're getting an error: "Sorry, I encountered an error. Please try again."

This is because the Gemini API key is not configured correctly or has quota issues.

## ⚠️ Common Mistake

**`gemini-2.5-pro` is NOT an API key** - it's a model name!

- ❌ Wrong: `GEMINI_API_KEY=gemini-2.5-pro`
- ✅ Correct: `GEMINI_API_KEY=AIzaSyC...` (long string starting with AIza)

---

## 🔑 Step 1: Get Your Gemini API Key

1. Visit **Google AI Studio**: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the API key (it looks like: `AIzaSyC...`)

---

## 📝 Step 2: Add API Key to .env File

1. Open `server/.env` file (create it if it doesn't exist)
2. Add or update this line:

```env
GEMINI_API_KEY=AIzaSyC...your_actual_key_here
```

3. **Optional**: Specify the model (for fastest response):

```env
GEMINI_MODEL=gemini-1.5-flash
```

### Example .env file:

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Clerk Auth
CLERK_SECRET_KEY=sk_test_...

# Gemini API (ADD THIS)
GEMINI_API_KEY=AIzaSyC...your_actual_key_here
GEMINI_MODEL=gemini-1.5-flash

# Other settings...
PORT=5000
```

---

## 🚀 Step 3: Restart Backend Server

After adding the API key:

```bash
cd server
npm start
```

---

## ✅ Testing

1. Open your LMS app
2. Click the chatbot icon (bottom right)
3. Send a test message: "Hello"
4. You should get a response within 2-4 seconds!

---

## 🆓 Free Tier Limits

Google Gemini API Free Tier:

- ✅ **60 requests per minute**
- ✅ **1,500 requests per day**
- ✅ Free forever for moderate use

If you hit the limit:

- Wait 1 minute and try again
- Or upgrade to paid plan at https://ai.google.dev/pricing

---

## 🐛 Troubleshooting

### Error: "API key is not configured"

- Make sure `.env` file exists in `server/` folder
- Check the key starts with `AIzaSy...`
- Restart the server after changes

### Error: "No available Gemini model found"

This means the chatbot can't find a working AI model. **SOLUTION:**

1. **Check your API key is correct** in `server/.env`
2. **Verify your API key is active** at https://aistudio.google.com/app/apikey
3. **Check you haven't exceeded quota** at https://aistudio.google.com/
4. **Restart the server** after fixing:
   ```bash
   cd server
   npm start
   ```

### Error: "Quota exceeded" or "429 Too Many Requests"

- You've hit the free tier limit
- **Wait 1 minute** for per-minute limits
- **Wait 24 hours** for daily limits
- **Check your usage**: https://ai.dev/usage?tab=rate-limit
- Consider upgrading your API plan at https://ai.google.dev/pricing

### Error: "Failed to send message. Please try again."

This is usually one of these issues:
1. **Wrong API Key**: Double-check your `GEMINI_API_KEY` in `.env`
2. **Quota Exceeded**: Wait and try again
3. **Model Not Available**: The server logs will show which models failed

**How to fix:**
```bash
# 1. Check server logs for detailed error
# 2. Verify .env file has correct API key
# 3. Restart server
cd server
npm start
```

### Still slow?

- Make sure you're using `gemini-1.5-flash` (fastest model)
- Check your internet connection
- API key from wrong region (some regions are slower)

---

## 📚 Model Comparison

| Model              | Speed              | Quality     | Use Case              | Availability |
| ------------------ | ------------------ | ----------- | --------------------- | ------------ |
| `gemini-1.5-flash` | ⚡⚡⚡ Fast (2-4s) | ✅ Good     | Chatbot (Recommended) | ✅ Free Tier |
| `gemini-1.5-pro`   | ⚡ Slower (5-10s)  | ✅✅ Better | Complex tasks         | ✅ Free Tier |
| `gemini-pro`       | ⚡⚡ Fast (3-5s)   | ✅ Good     | Legacy fallback       | ✅ Free Tier |

**Note:** The chatbot will automatically try these models in order and use the first one that works.

---

## 💡 Quick Fix

If you just want to test quickly:

1. Go to: https://aistudio.google.com/app/apikey
2. Copy your API key
3. Open `server/.env`
4. Add: `GEMINI_API_KEY=your_key_here`
5. Save and restart server

**That's it!** 🎉
