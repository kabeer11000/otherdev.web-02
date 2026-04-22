// File types read directly as plain text (no OCR needed)
const PLAIN_TEXT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/css',
  'text/html',
  'text/csv',
  'text/xml',
  'application/json',
  'application/javascript',
  'text/javascript',
  'text/typescript',
  'application/typescript',
  'application/x-python',
  'text/x-python',
  'application/xml',
]);

// File types that require server-side Mistral OCR
const OCR_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/epub+zip',
  'application/rtf',
  'text/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/x-tex',
  'text/x-tex',
]);

const SUPPORTED_IMAGE_PREFIX = 'image/';

// Images supported by Mistral OCR
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/avif',
  'image/tiff',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/webp',
]);

const IMAGE_BASE64_LIMIT = 4 * 1024 * 1024; // 4MB

export type Attachment = {
  type: 'file';
  mediaType: string;
  url: string;
  filename: string;
};

async function extractTextViaMistralOcr(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/process-document', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'OCR failed' }));
    throw new Error((err as { error?: string }).error ?? 'OCR failed');
  }

  const { text } = (await res.json()) as { text: string };
  return text;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const mimeType = file.type.split(';')[0].toLowerCase();

  if (PLAIN_TEXT_TYPES.has(mimeType)) {
    return file.text();
  }

  if (OCR_DOCUMENT_TYPES.has(mimeType) || SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    return extractTextViaMistralOcr(file);
  }

  throw new Error(`Unsupported file type: ${file.type}`);
}

export function encodeImageToBase64(file: File): Promise<string> {
  if (!file.type.startsWith(SUPPORTED_IMAGE_PREFIX)) {
    return Promise.reject(new Error('Only image files are supported'));
  }

  if (file.size > IMAGE_BASE64_LIMIT) {
    return Promise.reject(
      new Error(`Image exceeds 4MB base64 limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function processAttachment(file: File): Promise<Attachment> {
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    const dataUrl = await fileToBase64(file);
    return {
      type: 'file' as const,
      mediaType: file.type,
      url: dataUrl,
      filename: file.name,
    };
  }

  const text = await extractTextFromFile(file);
  const dataUrl = `data:text/plain;base64,${btoa(text)}`;
  return {
    type: 'file' as const,
    mediaType: 'text/plain',
    url: dataUrl,
    filename: file.name,
  };
}

export function validateAttachment(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File exceeds 50MB limit' };
  }
  return { valid: true };
}
