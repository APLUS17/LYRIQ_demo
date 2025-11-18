# Multi-Provider AI Support

## Overview

LYRIQ now supports **multiple AI providers** for rhyme suggestions and lyric assistance! You can use any combination of:

- 🌟 **Google Gemini** (Primary - best for rhymes)
- 🤖 **OpenAI GPT-4** (Fallback)
- 🧠 **Anthropic Claude** (Fallback)
- ⚡ **Grok** (Fallback)

The app automatically uses the best available provider and falls back to others if one fails.

---

## Why Multi-Provider?

✅ **Flexibility** - Use whatever API you already have
✅ **Reliability** - Automatic fallback if one provider fails
✅ **No vendor lock-in** - Switch providers anytime
✅ **Cost optimization** - Use free tiers from multiple providers

---

## Quick Start

### 1. Choose Your Provider

You only need **ONE** of these API keys to get started:

#### Option A: Gemini (Recommended - Free Tier)
```bash
# Get key from: https://makersuite.google.com/app/apikey
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
```
- ✅ FREE: 60 requests/minute
- ✅ Best JSON formatting for rhymes
- ✅ Fast and reliable

#### Option B: OpenAI (If you already have it)
```bash
# Get key from: https://platform.openai.com/api-keys
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=your_key_here
```
- ✅ Already integrated in the app
- ✅ GPT-4 is very creative
- ⚠️ Pay-per-use pricing

#### Option C: Anthropic (If you already have it)
```bash
# Get key from: https://console.anthropic.com/
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=your_key_here
```
- ✅ Already integrated in the app
- ✅ Claude is excellent at creative writing
- ⚠️ Pay-per-use pricing

#### Option D: Grok (If you already have it)
```bash
# Get key from: https://console.x.ai/
EXPO_PUBLIC_GROK_API_KEY=your_key_here
```
- ✅ Already integrated in the app
- ✅ Alternative option
- ⚠️ Limited availability

### 2. Set Up Your .env File

```bash
# Copy the example
cp .env.example .env

# Edit .env and add your API key(s)
# You can add multiple for redundancy!
```

### 3. Restart Expo

```bash
bun start --clear
```

---

## How It Works

### Automatic Provider Selection

The app tries providers in this order:

1. **Gemini** (if configured)
2. **OpenAI** (if configured)
3. **Anthropic** (if configured)
4. **Grok** (if configured)

If the first provider fails, it automatically tries the next one. No manual switching needed!

### Provider Status Indicator

Tap the **⋮ menu** in the app to see which providers are active:

```
AI Providers Active
✨ Gemini  💡 OpenAI  🟣 Claude
Primary: Gemini
```

### Rhyme Suggestion Flow

```
User selects word "night"
         ↓
Try Gemini → Success! Return rhymes
         ↓ (if fails)
Try OpenAI → Success! Return rhymes
         ↓ (if fails)
Try Anthropic → Success! Return rhymes
         ↓ (if fails)
Try Grok → Success! Return rhymes
         ↓ (if all fail)
Show friendly error message
```

---

## Features Using AI

### 1. Rhyme Suggestions ✨
- **How:** Select any word in your lyrics
- **Result:** Get 10 contextual rhyming words
- **Providers:** All supported

### 2. Lyric Improvements 📝
- **How:** Coming soon in UI
- **Result:** AI suggests better phrasing
- **Providers:** All supported

### 3. Writing Prompts 💡
- **How:** Coming soon in UI
- **Result:** Creative prompts based on theme/mood
- **Providers:** All supported

---

## Cost Comparison

| Provider | Free Tier | Rhyme Request Cost | Notes |
|----------|-----------|-------------------|-------|
| **Gemini** | 60 req/min | ~$0.00025 | Best value |
| **OpenAI** | None | ~$0.002 | 8x more expensive |
| **Anthropic** | Some credits | ~$0.003 | Creative output |
| **Grok** | Limited | Varies | Alternative option |

**Example:** Looking up rhymes for 30 words in a song:
- Gemini: **$0.0075**
- OpenAI: **$0.06**
- Anthropic: **$0.09**

**Recommendation:** Use Gemini's free tier first, add others as backup.

---

## Configuration Examples

### Minimal Setup (Gemini Only)
```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

### Recommended Setup (Gemini + OpenAI Backup)
```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=sk-proj-...
```

### Maximum Reliability (All Providers)
```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=sk-proj-...
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_GROK_API_KEY=xai-...
```

---

## Troubleshooting

### No AI Providers Configured

**Symptom:** Options menu shows "No AI providers configured"

**Solution:**
1. Check your `.env` file exists
2. Ensure at least one API key is set
3. Restart Expo: `bun start --clear`

### Rhyme Suggestions Not Working

**Symptom:** Loading spinner never stops

**Check:**
```bash
# In your .env file, verify keys are set
cat .env | grep API_KEY
```

**Debug:**
- Check Expo console for error messages
- Try a different provider
- Verify API key is valid on provider's website

### Wrong Provider Being Used

**Symptom:** Want to use OpenAI but Gemini is being used

**Solution:**
- Remove or comment out Gemini key in `.env`
- Or: We'll add provider preference UI soon

### All Providers Failing

**Check:**
1. Internet connection
2. API key validity
3. API quota/credits
4. Console errors in Expo

---

## API Key Security

### ✅ Best Practices

- Never commit `.env` to git (it's in `.gitignore`)
- Use different keys for dev/production
- Rotate keys periodically
- Monitor usage on provider dashboards

### ⚠️ Don't Do This

```javascript
// ❌ NEVER hardcode API keys
const apiKey = "AIzaSy..."; // WRONG!

// ✅ Always use environment variables
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
```

---

## Getting API Keys

### Gemini (Recommended)
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key to `.env`

### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create account / sign in
3. Click "Create new secret key"
4. Copy key to `.env`

### Anthropic
1. Visit https://console.anthropic.com/
2. Create account / sign in
3. Go to API Keys
4. Create new key
5. Copy key to `.env`

### Grok
1. Visit https://console.x.ai/
2. Sign up (limited availability)
3. Generate API key
4. Copy key to `.env`

---

## Advanced Usage

### Check Available Providers Programmatically

```typescript
import { getAvailableProviders } from './src/api/aiRhymeService';

const providers = getAvailableProviders();
console.log('Available:', providers);
// ['gemini', 'openai', 'anthropic']
```

### Get Rhymes

```typescript
import { getRhymeSuggestions } from './src/api/aiRhymeService';

const rhymes = await getRhymeSuggestions('night', 'Dancing through the night');
// Automatically uses best available provider
```

### Get Lyric Suggestions

```typescript
import { getLyricSuggestions } from './src/api/aiRhymeService';

const suggestions = await getLyricSuggestions(
  'The sun is shining bright',
  'upbeat summer song'
);
```

---

## Future Enhancements

Coming soon:
- [ ] Manual provider selection in UI
- [ ] Provider performance stats
- [ ] Usage tracking per provider
- [ ] Cost estimation
- [ ] Rate limit handling
- [ ] Caching layer for common rhymes

---

## FAQ

**Q: Can I use multiple providers at once?**
A: Yes! Configure multiple API keys and the app will automatically fall back if one fails.

**Q: Which provider is best for rhymes?**
A: Gemini with JSON mode gives the most consistent results.

**Q: Do I need all providers?**
A: No, just one is enough. Multiple providers add redundancy.

**Q: Can I switch providers mid-session?**
A: The app automatically picks the best available provider for each request.

**Q: Is my API key safe?**
A: Yes, it's stored in `.env` which is not committed to git. Only you have access.

**Q: What if I hit rate limits?**
A: The app will automatically try the next provider.

---

## Support

- **Documentation:** See `REFACTORING_GUIDE.md`
- **Issues:** Check console logs in Expo
- **Questions:** Review the code in `src/api/aiRhymeService.ts`

---

**Last Updated:** 2025-01-18
**Version:** 2.0.0
**Multi-Provider Support:** ✅ Enabled
