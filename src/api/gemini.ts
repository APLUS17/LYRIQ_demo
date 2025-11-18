import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

export interface RhymeWord {
  word: string;
  relevance?: number;
}

/**
 * Get contextual rhyming words for a given word and context
 * @param word - The word to find rhymes for
 * @param context - The lyric line context (optional)
 * @returns Array of rhyming words
 */
export async function getRhymeSuggestions(
  word: string,
  context?: string
): Promise<RhymeWord[]> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
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

    // Parse JSON response
    const parsed = JSON.parse(text);

    // Handle different response formats
    let rhymes: RhymeWord[] = [];
    if (Array.isArray(parsed)) {
      rhymes = parsed;
    } else if (parsed.rhymes && Array.isArray(parsed.rhymes)) {
      rhymes = parsed.rhymes;
    } else if (parsed.words && Array.isArray(parsed.words)) {
      rhymes = parsed.words.map((w: string) => ({ word: w }));
    }

    // Filter out multi-word entries and ensure we have valid words
    return rhymes
      .filter((r: any) => r.word && typeof r.word === 'string' && !r.word.includes(' '))
      .slice(0, 10);

  } catch (error) {
    console.error('Error getting rhyme suggestions:', error);
    return [];
  }
}

/**
 * Get lyric improvement suggestions from Gemini
 * @param lyrics - The lyrics to improve
 * @param context - Additional context (theme, mood, etc.)
 * @returns Improved lyrics or suggestions
 */
export async function getLyricSuggestions(
  lyrics: string,
  context?: string
): Promise<string> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = context
      ? `Improve these lyrics with the following context: ${context}\n\nLyrics:\n${lyrics}\n\nProvide improved versions or alternative suggestions.`
      : `Suggest improvements or alternatives for these lyrics:\n${lyrics}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error getting lyric suggestions:', error);
    throw error;
  }
}

/**
 * Get creative writing prompts from Gemini
 * @param theme - Theme or topic
 * @param mood - Desired mood/emotion
 * @returns Writing prompt or ideas
 */
export async function getWritingPrompt(
  theme?: string,
  mood?: string
): Promise<string> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = 'Provide creative songwriting prompts and ideas';
    if (theme) prompt += ` about ${theme}`;
    if (mood) prompt += ` with a ${mood} mood`;
    prompt += '.';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error getting writing prompt:', error);
    throw error;
  }
}
