const SUPPORTED_IMAGE_PREFIX = "image/";

const SUPPORTED_TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/css",
  "text/html",
  "application/json",
  "application/javascript",
  "text/javascript",
  "text/typescript",
  "application/typescript",
  "application/x-python",
  "text/x-python",
]);

const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
const IMAGE_BASE64_LIMIT = 4 * 1024 * 1024; // 4MB

/**
 * Encode image file to data URI format for Groq
 */
export function encodeImageToBase64(file: File): Promise<string> {
  if (!file.type.startsWith(SUPPORTED_IMAGE_PREFIX)) {
    return Promise.reject(new Error("Only image files are supported"));
  }

  if (file.size > IMAGE_BASE64_LIMIT) {
    return Promise.reject(
      new Error(
        `Image exceeds 4MB base64 limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text from documents and code files
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const baseMimeType = file.type.split(";")[0];

  if (!SUPPORTED_TEXT_TYPES.has(baseMimeType)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  return file.text();
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_SIZE_LIMIT) {
    return { valid: false, error: "File exceeds 50MB limit" };
  }

  const baseMimeType = file.type.split(";")[0];
  const isImage = file.type.startsWith(SUPPORTED_IMAGE_PREFIX);
  const isText = SUPPORTED_TEXT_TYPES.has(baseMimeType);

  if (!isImage && !isText) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }

  return { valid: true };
}
