import { describe, expect, it, beforeEach, beforeAll, mock, afterEach } from "bun:test";
import { processAttachment, validateAttachment } from "../ai-sdk-attachments";

// Mock file-processor module
const mockExtractText = mock(() => Promise.resolve("extracted text content"));

mock.module("../file-processor", () => ({
  extractTextFromFile: mockExtractText,
}));

// Helper to create test files
function makeFile(name: string, type: string, content: string | ArrayBuffer = "test content"): File {
  const blob = content instanceof ArrayBuffer ? new Blob([content], { type }) : new Blob([content], { type });
  return new File([blob], name, { type });
}

// Mock FileReader for Node environment
beforeAll(() => {
  (global as any).FileReader = class MockFileReader {
    _file: File | null = null;
    onload: ((this: any, event: any) => void) | null = null;
    onerror: ((this: any, event: any) => void) | null = null;
    result: string | null = null;

    readAsDataURL(file: File) {
      this._file = file;
      // Read file content and convert to base64
      const text = typeof file === 'object' && 'arrayBuffer' in file
        ? 'mock-image-data'
        : String(file);
      const base64 = Buffer.from(text).toString('base64');
      this.result = `data:${file.type};base64,${base64}`;

      // Simulate async onload
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: { result: this.result } });
        }
      }, 0);
    }
  };
});

describe("AI SDK Attachment Utilities", () => {
  afterEach(() => {
    mockExtractText.mockClear();
  });

  it("should process image files to base64", async () => {
    const file = makeFile("test.png", "image/png", "test");
    const result = await processAttachment(file);

    expect(result.url).toMatch(/^data:image\/png;base64,/);
  });

  it("should validate files under size limit", () => {
    const file = makeFile("test.pdf", "application/pdf");
    const result = validateAttachment(file);
    expect(result.valid).toBe(true);
  });

  it("should reject files over size limit", () => {
    const bigFile = makeFile("big.pdf", "application/pdf", new ArrayBuffer(51 * 1024 * 1024));
    const result = validateAttachment(bigFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("50MB");
  });

  it("should process non-image files by extracting text", async () => {
    const file = makeFile("test.pdf", "application/pdf");
    const result = await processAttachment(file);

    expect(result.url).toMatch(/^data:text\/plain;base64,/);
    expect(mockExtractText).toHaveBeenCalledWith(file);
  });
});
