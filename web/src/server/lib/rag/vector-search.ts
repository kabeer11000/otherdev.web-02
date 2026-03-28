import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { cache } from "react";

function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "Firebase environment variables are missing. Firestore will not be available.",
        );
      }
      return null;
    }

    initializeApp({
      credential: cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, "\n"),
        clientEmail,
      }),
    });
  }
  return getFirestore();
}

const DOCUMENTS_COLLECTION = "documents";

export interface MatchedDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    title: string;
    type: string;
    category?: string;
    subtype?: string;
    project?: string;
    year?: string;
  };
  similarity: number;
}

// Cache document search per-request to avoid duplicate Firestore queries
// for the same embedding within a single request
export const searchSimilarDocuments = cache(async function searchSimilarDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.1,
  matchCount: number = 5,
): Promise<MatchedDocument[]> {
  const db = getDb();
  if (!db) {
    console.error("Firestore database is not initialized.");
    return [];
  }
  const collection = db.collection(DOCUMENTS_COLLECTION);

  const vectorQuery = collection.findNearest({
    vectorField: "embedding",
    queryVector: FieldValue.vector(queryEmbedding),
    limit: matchCount,
    distanceMeasure: "COSINE",
    distanceResultField: "distance",
    distanceThreshold: 1 - matchThreshold,
  });

  const snapshot = await vectorQuery.get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const distance = data.distance as number;
    return {
      id: doc.id,
      content: data.content as string,
      metadata: data.metadata as MatchedDocument["metadata"],
      similarity: 1 - distance,
    };
  });
});

export async function deleteAllDocuments(): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("Firestore database is not initialized.");
    return;
  }
  const collection = db.collection(DOCUMENTS_COLLECTION);
  const snapshot = await collection.get();

  if (snapshot.empty) return;

  const batchSize = 500;
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + batchSize)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

export async function insertDocument(
  content: string,
  metadata: {
    source: string;
    title: string;
    type: string;
    category?: string;
    subtype?: string;
    project?: string;
    year?: string;
  },
  embedding: number[],
): Promise<string> {
  const db = getDb();
  if (!db) {
    throw new Error("Firestore database is not initialized.");
  }
  const collection = db.collection(DOCUMENTS_COLLECTION);

  const docRef = await collection.add({
    content,
    metadata,
    embedding: FieldValue.vector(embedding),
    createdAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}
