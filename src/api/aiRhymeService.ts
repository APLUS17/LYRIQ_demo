/**
 * Multi-Provider AI Rhyme Service
 *
 * This service provides rhyme suggestions using multiple AI providers:
 * - Google Gemini (primary, if configured)
 * - OpenAI GPT-4 (fallback)
 * - Anthropic Claude (fallback)
 * - Grok (fallback)
 *
 * The service automatically tries each provider in order until one succeeds.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getOpenAIChatResponse, getAnthropicChatResponse, getGrokChatResponse } from './chat-service';

export interface RhymeWord {
  word: string;
  relevance?: number;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'grok';

/**
 * Get the available AI providers based on configured API keys
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
    providers.push('gemini');
  }
  if (process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY) {
    providers.push('openai');
  }
  if (process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY) {
    providers.push('anthropic');
  }
  if (process.env.EXPO_PUBLIC_GROK_API_KEY) {
    providers.push('grok');
  }

  return providers;
}

/**
 * Get rhymes using Gemini
 */
async function getRhymesFromGemini(word: string, context?: string): Promise<RhymeWord[]> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = context
    ? `Given the lyric line "${context}", provide a list of up to 10 contextual rhyming words for "${word}". Return only single words that rhyme and fit the context. Format as JSON array of objects with "word" property.`
    : `Provide a list of up to 10 rhyming words for "${word}". Return only single words. Format as JSON array of objects with "word" property.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const parsed = JSON.parse(text);

  let rhymes: RhymeWord[] = [];
  if (Array.isArray(parsed)) {
    rhymes = parsed;
  } else if (parsed.rhymes && Array.isArray(parsed.rhymes)) {
    rhymes = parsed.rhymes;
  } else if (parsed.words && Array.isArray(parsed.words)) {
    rhymes = parsed.words.map((w: string) => ({ word: w }));
  }

  return rhymes
    .filter((r: any) => r.word && typeof r.word === 'string' && !r.word.includes(' '))
    .slice(0, 10);
}

/**
 * Get rhymes using OpenAI
 */
async function getRhymesFromOpenAI(word: string, context?: string): Promise<RhymeWord[]> {
  const prompt = context
    ? `Given the lyric line "${context}", provide a list of up to 10 contextual rhyming words for "${word}". Return only single words that rhyme and fit the context. Format your response as a JSON array of objects with "word" property, like: [{"word": "light"}, {"word": "sight"}]`
    : `Provide a list of up to 10 rhyming words for "${word}". Return only single words. Format your response as a JSON array of objects with "word" property, like: [{"word": "light"}, {"word": "sight"}]`;

  const response = await getOpenAIChatResponse(prompt);

  // Try to extract JSON from response
  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from OpenAI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed
    .filter((r: any) => r.word && typeof r.word === 'string' && !r.word.includes(' '))
    .slice(0, 10);
}

/**
 * Get rhymes using Anthropic Claude
 */
async function getRhymesFromAnthropic(word: string, context?: string): Promise<RhymeWord[]> {
  const prompt = context
    ? `Given the lyric line "${context}", provide a list of up to 10 contextual rhyming words for "${word}". Return only single words that rhyme and fit the context. Format your response as a JSON array of objects with "word" property, like: [{"word": "light"}, {"word": "sight"}]`
    : `Provide a list of up to 10 rhyming words for "${word}". Return only single words. Format your response as a JSON array of objects with "word" property, like: [{"word": "light"}, {"word": "sight"}]`;

  const response = await getAnthropicChatResponse(prompt);

  // Try to extract JSON from response
  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from Anthropic response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed
    .filter((r: any) => r.word && typeof r.word === 'string' && !r.word.includes(' '))
    .slice(0, 10);
}

/**
 * Get rhymes using Grok
 */
async function getRhymesFromGrok(word: string, context?: string): Promise<RhymeWord[]> {
  const prompt = context
    ? `Given the lyric line "${context}", provide a list of up to 10 contextual rhyming words for "${word}". Return only single words that rhyme and fit the context. Format your response as a JSON array of objects with "word" property, like: [{"word": "light"}, {"word": "sight"}]`
    : `Provide a list of up to 10 rhyming words for "${word}". Return only single words. Format your response as a JSON array of objects with "word" property, like: [{"word": "light"}, {"word": "sight"}]`;

  const response = await getGrokChatResponse(prompt);

  // Try to extract JSON from response
  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from Grok response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed
    .filter((r: any) => r.word && typeof r.word === 'string' && !r.word.includes(' '))
    .slice(0, 10);
}

/**
 * Get rhyme suggestions using the best available AI provider
 * Tries providers in this order: Gemini -> OpenAI -> Anthropic -> Grok
 *
 * @param word - The word to find rhymes for
 * @param context - The lyric line context (optional)
 * @returns Array of rhyming words
 */
export async function getRhymeSuggestions(
  word: string,
  context?: string
): Promise<RhymeWord[]> {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    console.warn('No AI providers configured. Please add API keys to .env file.');
    return [];
  }

  // Try each provider in order until one succeeds
  const errors: Record<string, Error> = {};

  for (const provider of availableProviders) {
    try {
      console.log(`Trying to get rhymes from ${provider}...`);

      switch (provider) {
        case 'gemini':
          return await getRhymesFromGemini(word, context);
        case 'openai':
          return await getRhymesFromOpenAI(word, context);
        case 'anthropic':
          return await getRhymesFromAnthropic(word, context);
        case 'grok':
          return await getRhymesFromGrok(word, context);
      }
    } catch (error) {
      console.error(`Error getting rhymes from ${provider}:`, error);
      errors[provider] = error as Error;
      // Continue to next provider
    }
  }

  // All providers failed
  console.error('All AI providers failed:', errors);
  return [];
}

/**
 * Get lyric improvement suggestions using the best available AI provider
 */
export async function getLyricSuggestions(
  lyrics: string,
  context?: string
): Promise<string> {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    throw new Error('No AI providers configured');
  }

  const prompt = context
    ? `Improve these lyrics with the following context: ${context}\n\nLyrics:\n${lyrics}\n\nProvide improved versions or alternative suggestions.`
    : `Suggest improvements or alternatives for these lyrics:\n${lyrics}`;

  // Try each provider
  for (const provider of availableProviders) {
    try {
      let response;
      switch (provider) {
        case 'openai':
          response = await getOpenAIChatResponse(prompt);
          return response.content;
        case 'anthropic':
          response = await getAnthropicChatResponse(prompt);
          return response.content;
        case 'grok':
          response = await getGrokChatResponse(prompt);
          return response.content;
        case 'gemini':
          // Gemini is handled separately
          const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
          if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const geminiResponse = await result.response;
            return geminiResponse.text();
          }
          break;
      }
    } catch (error) {
      console.error(`Error getting suggestions from ${provider}:`, error);
      // Continue to next provider
    }
  }

  throw new Error('All AI providers failed');
}

/**
 * Get creative writing prompts using the best available AI provider
 */
export async function getWritingPrompt(
  theme?: string,
  mood?: string
): Promise<string> {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    throw new Error('No AI providers configured');
  }

  let prompt = 'Provide creative songwriting prompts and ideas';
  if (theme) prompt += ` about ${theme}`;
  if (mood) prompt += ` with a ${mood} mood`;
  prompt += '.';

  // Try each provider
  for (const provider of availableProviders) {
    try {
      let response;
      switch (provider) {
        case 'openai':
          response = await getOpenAIChatResponse(prompt);
          return response.content;
        case 'anthropic':
          response = await getAnthropicChatResponse(prompt);
          return response.content;
        case 'grok':
          response = await getGrokChatResponse(prompt);
          return response.content;
        case 'gemini':
          const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
          if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const geminiResponse = await result.response;
            return geminiResponse.text();
          }
          break;
      }
    } catch (error) {
      console.error(`Error getting prompt from ${provider}:`, error);
      // Continue to next provider
    }
  }

  throw new Error('All AI providers failed');
}
