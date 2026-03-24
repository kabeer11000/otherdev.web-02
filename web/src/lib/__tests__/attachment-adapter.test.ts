import { OcrAttachmentAdapter } from "../attachment-adapter";
import { validateFile, encodeImageToBase64, extractTextFromFile } from "../file-processor";

jest.mock("../file-processor", () => ({
  validateFile: jest.fn(),
  encodeImageToBase64: jest.fn(),
  extractTextFromFile: jest.fn(),
  OCR_DOCUMENT_TYPES: new Set(["application/pdf"]),
  SUPPORTED_IMAGE_TYPES: new Set(["image/png", "image/jpeg"]),
}));

const mockValidateFile = validateFile as jest.Mock;
const mockEncodeImage = encodeImageToBase64 as jest.Mock;
const mockExtractText = extractTextFromFile as jest.Mock;

function makeFile(name: string, type: string, size = 100): File {
  const blob = new Blob(["x".repeat(size)], { type });
  return new File([blob], name, { type });
}

async function drainAdd(adapter: OcrAttachmentAdapter, file: File) {
  const gen = adapter.add({ file });
  const yielded: object[] = [];
  while (true) {
    const result = await gen.next();
    if (result.done) return { yielded, final: result.value };
    yielded.push(result.value);
  }
}

describe("OcrAttachmentAdapter.add()", () => {
  let adapter: OcrAttachmentAdapter;

  beforeEach(() => {
    adapter = new OcrAttachmentAdapter();
    mockValidateFile.mockReturnValue({ valid: true });
    mockEncodeImage.mockResolvedValue("data:image/png;base64,abc123");
    mockExtractText.mockResolvedValue("extracted text content");
  });

  afterEach(() => jest.clearAllMocks());

  it("yields running then returns requires-action for an image", async () => {
    const file = makeFile("photo.png", "image/png");
    const { yielded, final } = await drainAdd(adapter, file);

    expect(yielded).toHaveLength(1);
    expect((yielded[0] as any).status.type).toBe("running");
    expect((final as any).status.type).toBe("requires-action");
    expect((final as any).status.reason).toBe("composer-send");
    expect(mockEncodeImage).toHaveBeenCalledWith(file);
  });

  it("yields running then returns requires-action for plain text", async () => {
    const file = makeFile("notes.txt", "text/plain");
    const { yielded, final } = await drainAdd(adapter, file);

    expect(yielded).toHaveLength(1);
    expect((yielded[0] as any).status.type).toBe("running");
    expect((final as any).status.type).toBe("requires-action");
    expect(mockExtractText).toHaveBeenCalledWith(file);
  });

  it("yields running then returns requires-action for a PDF", async () => {
    const file = makeFile("document.pdf", "application/pdf");
    const { yielded, final } = await drainAdd(adapter, file);

    expect(yielded).toHaveLength(1);
    expect((yielded[0] as any).status.type).toBe("running");
    expect((final as any).status.type).toBe("requires-action");
    expect(mockExtractText).toHaveBeenCalledWith(file);
  });

  it("returns incomplete with no yield for an invalid file", async () => {
    mockValidateFile.mockReturnValue({ valid: false, error: "File exceeds 50MB limit" });
    const file = makeFile("huge.pdf", "application/pdf");
    const { yielded, final } = await drainAdd(adapter, file);

    expect(yielded).toHaveLength(0);
    expect((final as any).status.type).toBe("incomplete");
    expect(mockEncodeImage).not.toHaveBeenCalled();
    expect(mockExtractText).not.toHaveBeenCalled();
  });

  it("returns incomplete when attachment count is already at 5", async () => {
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`f${i}.txt`, "text/plain"));
    await Promise.all(files.map((f) => drainAdd(adapter, f)));

    const { yielded, final } = await drainAdd(adapter, makeFile("sixth.txt", "text/plain"));

    expect(yielded).toHaveLength(0);
    expect((final as any).status.type).toBe("incomplete");
  });

  it("returns incomplete when processing throws", async () => {
    mockEncodeImage.mockRejectedValue(new Error("encode failed"));
    const { final } = await drainAdd(adapter, makeFile("broken.jpg", "image/jpeg"));

    expect((final as any).status.type).toBe("incomplete");
  });

  it("resolves 3 concurrent adds independently", async () => {
    const files = [
      makeFile("a.png", "image/png"),
      makeFile("b.txt", "text/plain"),
      makeFile("c.pdf", "application/pdf"),
    ];
    const results = await Promise.all(files.map((f) => drainAdd(adapter, f)));

    expect(results).toHaveLength(3);
    for (const r of results) {
      expect((r.final as any).status.type).toBe("requires-action");
    }
  });
});

describe("OcrAttachmentAdapter.send()", () => {
  let adapter: OcrAttachmentAdapter;

  beforeEach(() => {
    adapter = new OcrAttachmentAdapter();
    mockValidateFile.mockReturnValue({ valid: true });
    mockEncodeImage.mockResolvedValue("data:image/png;base64,abc123");
    mockExtractText.mockResolvedValue("extracted text content");
  });

  afterEach(() => jest.clearAllMocks());

  it("returns { type: 'image', image } for image attachment", async () => {
    const { final } = await drainAdd(adapter, makeFile("photo.png", "image/png"));
    const complete = await adapter.send(final as any);

    expect(complete.status.type).toBe("complete");
    expect(complete.content).toHaveLength(1);
    expect(complete.content![0].type).toBe("image");
    expect((complete.content![0] as any).image).toBe("data:image/png;base64,abc123");
  });

  it("returns { type: 'text', text } for PDF attachment", async () => {
    const { final } = await drainAdd(adapter, makeFile("doc.pdf", "application/pdf"));
    const complete = await adapter.send(final as any);

    expect(complete.status.type).toBe("complete");
    expect(complete.content![0].type).toBe("text");
    expect((complete.content![0] as any).text).toContain("doc.pdf");
  });

  it("returns empty content for cache-miss (removed before send)", async () => {
    const { final } = await drainAdd(adapter, makeFile("doc.pdf", "application/pdf"));
    await adapter.remove(final as any);
    const complete = await adapter.send(final as any);

    expect(complete.status.type).toBe("complete");
    expect(complete.content).toHaveLength(0);
  });
});

describe("OcrAttachmentAdapter.remove()", () => {
  let adapter: OcrAttachmentAdapter;

  beforeEach(() => {
    adapter = new OcrAttachmentAdapter();
    mockValidateFile.mockReturnValue({ valid: true });
    mockEncodeImage.mockResolvedValue("data:image/png;base64,abc123");
    mockExtractText.mockResolvedValue("extracted text");
  });

  afterEach(() => jest.clearAllMocks());

  it("decrements live count so a new file can be added after removing one", async () => {
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`f${i}.txt`, "text/plain"));
    const results = await Promise.all(files.map((f) => drainAdd(adapter, f)));
    await adapter.remove(results[0].final as any);

    const { final } = await drainAdd(adapter, makeFile("new.txt", "text/plain"));
    expect((final as any).status.type).toBe("requires-action");
  });

  it("evicts cache so re-add reprocesses", async () => {
    const { final } = await drainAdd(adapter, makeFile("doc.pdf", "application/pdf"));
    await adapter.remove(final as any);

    mockExtractText.mockResolvedValue("new content");
    await drainAdd(adapter, makeFile("doc.pdf", "application/pdf"));

    expect(mockExtractText).toHaveBeenCalledTimes(2);
  });
});
