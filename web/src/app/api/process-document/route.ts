import { Mistral } from "@mistralai/mistralai";
import type { NextRequest } from "next/server";
import {
  OCR_DOCUMENT_TYPES,
  SUPPORTED_IMAGE_TYPES,
} from "@/lib/file-processor";
import { createJsonResponse } from "@/server/lib/api-helpers";

const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

const OCR_MIME_TYPES = new Set([
  ...OCR_DOCUMENT_TYPES,
  ...SUPPORTED_IMAGE_TYPES,
]);

async function uploadFileToMistral(
  file: File,
  apiKey: string,
): Promise<{ id: string }> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("purpose", "ocr");

  const res = await fetch("https://api.mistral.ai/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mistral file upload failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<{ id: string }>;
}

export async function POST(request: NextRequest): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return createJsonResponse({ error: "No file provided" }, 400);
  }

  if (file.size > FILE_SIZE_LIMIT) {
    return createJsonResponse({ error: "File exceeds 50MB limit" }, 400);
  }

  const mimeType = file.type.split(";")[0].toLowerCase();

  if (!OCR_MIME_TYPES.has(mimeType)) {
    return createJsonResponse(
      { error: `Unsupported file type for OCR: ${file.type}` },
      400,
    );
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return createJsonResponse({ error: "Mistral API key not configured" }, 500);
  }

  const client = new Mistral({ apiKey });

  const uploaded = await uploadFileToMistral(file, apiKey);

  try {
    const signedUrl = await client.files.getSignedUrl({
      fileId: uploaded.id,
    });

    const result = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: { type: "document_url", documentUrl: signedUrl.url },
    });

    const text = result.pages
      .map((p) => p.markdown)
      .join("\n\n---\n\n")
      .trim();

    return createJsonResponse({ text }, 200);
  } finally {
    await client.files
      .delete({ fileId: uploaded.id })
      .catch((err) => console.error("Failed to delete Mistral file:", err));
  }
}
