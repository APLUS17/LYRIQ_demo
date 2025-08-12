// Audio file validation utility
import * as FileSystem from 'expo-file-system';

export interface AudioFileInfo {
  uri: string;
  isValid: boolean;
  duration?: number;
  fileSize?: number;
  error?: string;
}

/**
 * Validates an audio file URI and returns metadata
 * @param uri The audio file URI to validate
 * @returns Promise<AudioFileInfo> with validation results
 */
export async function validateAudioFile(uri: string): Promise<AudioFileInfo> {
  try {
    // Basic URI validation
    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
      return {
        uri,
        isValid: false,
        error: 'Invalid URI: Empty or non-string URI provided'
      };
    }

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      return {
        uri,
        isValid: false,
        error: 'File does not exist at the specified URI'
      };
    }

    // Get file size
    const fileSize = fileInfo.size || 0;
    
    // Check minimum file size (100 bytes minimum for a valid audio file)
    if (fileSize < 100) {
      return {
        uri,
        isValid: false,
        fileSize,
        error: 'File too small to be a valid audio file'
      };
    }

    // Check maximum file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxSize) {
      return {
        uri,
        isValid: false,
        fileSize,
        error: 'File too large (exceeds 50MB limit)'
      };
    }

    // Check file extension for common audio formats
    const supportedExtensions = ['.m4a', '.mp3', '.wav', '.aac', '.mp4', '.mov'];
    const fileExtension = uri.toLowerCase().substring(uri.lastIndexOf('.'));
    
    if (!supportedExtensions.includes(fileExtension)) {
      return {
        uri,
        isValid: false,
        fileSize,
        error: `Unsupported file format: ${fileExtension}. Supported formats: ${supportedExtensions.join(', ')}`
      };
    }

    // If all checks pass, consider the file valid
    // Note: We rely on the modern expo-audio hooks to handle actual playback validation
    return {
      uri,
      isValid: true,
      fileSize,
      duration: undefined // Duration will be determined by the audio player hook
    };

  } catch (error) {
    return {
      uri,
      isValid: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates multiple audio files in batch
 * @param uris Array of audio file URIs to validate
 * @returns Promise<AudioFileInfo[]> with validation results for each file
 */
export async function validateAudioFiles(uris: string[]): Promise<AudioFileInfo[]> {
  const validationPromises = uris.map(uri => validateAudioFile(uri));
  return Promise.all(validationPromises);
}

/**
 * Checks if an audio file is valid for recording/playback
 * @param uri The audio file URI to check
 * @returns Promise<boolean> true if valid, false otherwise
 */
export async function isValidAudioFile(uri: string): Promise<boolean> {
  const result = await validateAudioFile(uri);
  return result.isValid;
}