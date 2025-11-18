/**
 * Syllable counter utility based on English pronunciation rules
 * Adapted for lyric writing applications
 */

/**
 * Count syllables in a single word
 * @param word - The word to count syllables for
 * @returns Number of syllables
 */
export function countSyllablesInWord(word: string): number {
  if (!word || word.trim().length === 0) return 0;

  word = word.toLowerCase().trim();

  // Remove non-alphabetic characters except apostrophes
  word = word.replace(/[^a-z']/g, '');

  if (word.length <= 2) return 1;

  // Special cases and exceptions
  const specialCases: Record<string, number> = {
    'area': 3,
    'idea': 3,
    'fire': 2,
    'hour': 2,
    'lower': 2,
    'our': 2,
    'power': 2,
    'real': 2,
    'flower': 2,
    'being': 2,
    'everyone': 3,
    'everything': 3,
    'diamond': 3,
    'violet': 3,
    'every': 3,
    'library': 4,
    'different': 3,
  };

  if (specialCases[word]) {
    return specialCases[word];
  }

  // Count vowel groups
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, ''); // silent e
  word = word.replace(/^y/, ''); // initial y

  const vowelGroups = word.match(/[aeiouy]{1,2}/g);
  let count = vowelGroups ? vowelGroups.length : 0;

  // Minimum of 1 syllable
  return Math.max(1, count);
}

/**
 * Count syllables in a line of text
 * @param line - The text line to count syllables for
 * @returns Number of syllables
 */
export function countSyllablesInLine(line: string): number {
  if (!line || line.trim().length === 0) return 0;

  // Split by whitespace and filter out empty strings
  const words = line.trim().split(/\s+/).filter(w => w.length > 0);

  return words.reduce((total, word) => {
    return total + countSyllablesInWord(word);
  }, 0);
}

/**
 * Count syllables for multiple lines
 * @param lines - Array of text lines
 * @returns Array of syllable counts corresponding to each line
 */
export function countSyllablesInLines(lines: string[]): number[] {
  return lines.map(line => countSyllablesInLine(line));
}

/**
 * Parse lyrics text into lines and count syllables
 * @param text - The full lyrics text
 * @returns Object with lines and their syllable counts
 */
export function parseLyricsWithSyllables(text: string): {
  lines: string[];
  syllableCounts: number[];
} {
  const lines = text.split('\n');
  const syllableCounts = countSyllablesInLines(lines);

  return { lines, syllableCounts };
}

/**
 * Check if lines have matching syllable patterns (useful for verses/choruses)
 * @param lines - Array of text lines
 * @param tolerance - Allowed difference in syllable count
 * @returns True if all lines match within tolerance
 */
export function hasMatchingSyllablePattern(
  lines: string[],
  tolerance: number = 0
): boolean {
  if (lines.length <= 1) return true;

  const counts = countSyllablesInLines(lines);
  const first = counts[0];

  return counts.every(count => Math.abs(count - first) <= tolerance);
}

/**
 * Get syllable pattern statistics for a section
 * @param text - The lyrics text
 * @returns Statistics object
 */
export function getSyllableStats(text: string): {
  totalSyllables: number;
  lineCount: number;
  averageSyllablesPerLine: number;
  minSyllables: number;
  maxSyllables: number;
  syllableCounts: number[];
} {
  const { lines, syllableCounts } = parseLyricsWithSyllables(text);
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const nonEmptyCounts = syllableCounts.filter(c => c > 0);

  const totalSyllables = syllableCounts.reduce((sum, count) => sum + count, 0);
  const lineCount = nonEmptyLines.length;
  const averageSyllablesPerLine = lineCount > 0 ? totalSyllables / lineCount : 0;
  const minSyllables = nonEmptyCounts.length > 0 ? Math.min(...nonEmptyCounts) : 0;
  const maxSyllables = nonEmptyCounts.length > 0 ? Math.max(...nonEmptyCounts) : 0;

  return {
    totalSyllables,
    lineCount,
    averageSyllablesPerLine,
    minSyllables,
    maxSyllables,
    syllableCounts,
  };
}
