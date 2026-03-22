const SUPPORTED_IMAGE_PREFIX = "image/";
const PDF_TYPE = "application/pdf";

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
 * Extract text from a PDF file using pdfjs-dist
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

/**
 * Extract text from documents and code files
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const baseMimeType = file.type.split(";")[0];

  if (baseMimeType === PDF_TYPE) {
    return extractTextFromPdf(file);
  }

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
  const isPdf = baseMimeType === PDF_TYPE;

  if (!isImage && !isText && !isPdf) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }

  return { valid: true };
}
