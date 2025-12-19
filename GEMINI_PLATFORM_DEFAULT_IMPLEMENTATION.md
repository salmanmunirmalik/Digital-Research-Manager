# Gemini Platform Default Implementation

## Overview
Updated the platform to use **Google Gemini API key as the platform default** for basic AI features, while allowing users to add their own API keys for advanced features.

## Strategy

### Basic Features (Platform Gemini Key)
- **Default behavior**: Uses platform's `GEMINI_API_KEY` from environment variables
- **Use cases**: Basic chat, embeddings, simple AI responses
- **No user configuration needed**: Works out of the box for all users

### Advanced Features (User API Keys)
- **User preference**: Users can add their own API keys in Settings
- **Priority**: User keys take precedence over platform key
- **Use cases**: Advanced workflows, higher rate limits, premium models

## Implementation Details

### 1. New Helper Functions (`server/routes/aiProviderKeys.ts`)

#### `getPlatformGeminiKey()`
Returns the platform's Gemini API key from environment variables.

#### `getApiKeyWithFallback(userId, provider, usePlatformDefaultForBasic)`
Smart fallback strategy:
1. **First**: Try user's API key for the provider
2. **Second**: Use platform Gemini key (for basic features)
3. **Third**: Return null (if no fallback available)

#### Updated `getUserApiKey(userId, provider, allowPlatformFallback)`
Now supports fallback to platform Gemini key when `allowPlatformFallback` is true.

#### Updated `getUserDefaultProvider(userId, type)`
- **Default changed**: From `'openai'` to `'google_gemini'`
- **Fallback**: Returns `'google_gemini'` when user has no preferences

### 2. Updated Services

All services now use the new fallback system:

#### `server/routes/aiResearchAgent.ts`
- `generateEmbedding()`: Uses Gemini as default, falls back to platform key
- Updated imports to include new helper functions

#### `server/routes/aiTraining.ts`
- `generateEmbedding()`: Uses Gemini as default
- Training endpoint: Uses fallback system

#### `server/services/UserContextRetriever.ts`
- Embedding generation: Uses Gemini with platform fallback

#### `server/services/UserAIContentProcessor.ts`
- Content processing: Uses Gemini as default
- Embedding generation: Uses fallback system

#### `server/utils/autoIndexing.ts`
- Auto-indexing: Uses Gemini as default for embeddings

### 3. Environment Variables

**Updated `env.example`:**
```env
# GEMINI_API_KEY is REQUIRED for basic AI features (platform default)
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Other AI providers (users can add their own keys in Settings)
OPENAI_API_KEY=
```

## API Key Resolution Flow

```
User Request
    ↓
Has user's API key for provider?
    ├─ YES → Use user's key
    └─ NO → Is provider Gemini?
            ├─ YES → Use platform GEMINI_API_KEY
            └─ NO → Return null (user must add their own key)
```

## Benefits

1. **Zero Configuration**: Basic features work immediately for all users
2. **Cost Effective**: Platform only pays for basic Gemini usage
3. **User Flexibility**: Users can upgrade to premium providers
4. **Scalable**: Platform costs don't grow with user base
5. **Better Defaults**: Gemini is free tier friendly and fast

## Migration Notes

### For Existing Users
- Users with existing API keys: **No change** - their keys still work
- Users without keys: **Automatic upgrade** - now get Gemini for free

### For Platform Administrators
- **Required**: Set `GEMINI_API_KEY` in environment variables
- **Recommended**: Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Free Tier**: Gemini has generous free tier (60 requests/minute)

## Testing

To test the implementation:

1. **Without user API key**:
   ```bash
   # Should use platform Gemini key
   curl -X POST http://localhost:5002/api/ai-research-agent/chat \
     -H "Authorization: Bearer <token>" \
     -d '{"message": "Hello"}'
   ```

2. **With user API key**:
   ```bash
   # Should use user's key (if configured)
   # Add API key in Settings → API Management
   ```

## Next Steps

1. ✅ Platform uses Gemini for basic features
2. ✅ Users can add their own keys for advanced features
3. 🔄 Consider adding usage tracking for platform Gemini key
4. 🔄 Add rate limiting for platform key usage
5. 🔄 Monitor costs and usage patterns

## Files Modified

- `server/routes/aiProviderKeys.ts` - Core API key management
- `server/routes/aiResearchAgent.ts` - Research agent endpoints
- `server/routes/aiTraining.ts` - AI training endpoints
- `server/services/UserContextRetriever.ts` - Context retrieval
- `server/services/UserAIContentProcessor.ts` - Content processing
- `server/utils/autoIndexing.ts` - Auto-indexing utility
- `env.example` - Environment variable documentation

## Summary

The platform now intelligently uses:
- **Platform Gemini key** for basic features (default, no user config needed)
- **User API keys** for advanced features (when users add their own keys)

This provides the best of both worlds: immediate functionality for all users, with the option to upgrade for power users.

