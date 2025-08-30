# API Configuration Guide for LYRIQ Demo

## Overview
This guide explains how to configure API keys for the LYRIQ demo project, which uses both Anthropic (Claude) and OpenAI APIs for AI-powered features.

## Required API Keys

### 1. Anthropic API Key
- **Purpose**: Powers Claude AI assistant features for lyrics and music creation
- **Service**: Anthropic Claude (claude-3-5-sonnet, claude-3-5-haiku, etc.)
- **Get your key**: [Anthropic Console](https://console.anthropic.com/)

### 2. OpenAI API Key
- **Purpose**: Powers GPT models for additional AI features
- **Service**: OpenAI GPT-4, GPT-4o, etc.
- **Get your key**: [OpenAI Platform](https://platform.openai.com/)

## Configuration Methods

### Method 1: Environment Variables (Recommended for Development)

Create a `.env` file in your project root:

```bash
# Anthropic API Configuration
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here

# OpenAI API Configuration  
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=sk-your-actual-openai-key-here

# Project ID
EXPO_PUBLIC_PROJECT_ID=your-project-id
```

### Method 2: App Configuration (Current Setup)

The `app.json` file is already configured with placeholder values. Replace the placeholder values with your actual API keys:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_PROJECT_ID": "your-actual-project-id",
      "EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY": "sk-ant-api03-your-actual-anthropic-key",
      "EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY": "sk-your-actual-openai-key"
    }
  }
}
```

## Security Best Practices

1. **Never commit API keys to version control**
   - The `.gitignore` file is configured to exclude `.env` files
   - Use placeholder values in `app.json` for public repositories

2. **Use environment variables for sensitive data**
   - Environment variables are automatically loaded by Expo
   - They're accessible via `process.env.VARIABLE_NAME`

3. **Rotate keys regularly**
   - Monitor API usage in your respective dashboards
   - Revoke and regenerate keys if compromised

## Testing Your Configuration

After setting up your API keys:

1. **Restart your Expo development server**
   ```bash
   npm start
   # or
   expo start
   ```

2. **Check the console for warnings**
   - If you see "API key not found" warnings, check your configuration
   - Verify the environment variable names match exactly

3. **Test AI features**
   - Try using the AI assistant button
   - Test lyric generation features
   - Verify transcription services work

## Troubleshooting

### Common Issues

1. **"API key not found" warning**
   - Check spelling of environment variable names
   - Ensure no extra spaces or quotes
   - Restart the development server

2. **API calls failing**
   - Verify your API key is valid and active
   - Check your account has sufficient credits
   - Review API rate limits

3. **Environment variables not loading**
   - Ensure `.env` file is in project root
   - Check file permissions
   - Verify Expo version supports environment variables

### Getting Help

- Check the [Expo Environment Variables documentation](https://docs.expo.dev/guides/environment-variables/)
- Review API service dashboards for usage and limits
- Check the project's `src/api/` directory for API client implementations

## Current API Configuration

The project is configured to use these environment variables:

- `EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY` - For Claude AI features
- `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` - For GPT model features  
- `EXPO_PUBLIC_PROJECT_ID` - For project identification

All variables are prefixed with `EXPO_PUBLIC_` to make them available in the client-side code.
