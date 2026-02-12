import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    }),
  });
}

const db = getFirestore();

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

export async function searchSimilarDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.1,
  matchCount: number = 5,
): Promise<MatchedDocument[]> {
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
}

export async function deleteAllDocuments(): Promise<void> {
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
  const collection = db.collection(DOCUMENTS_COLLECTION);

  const docRef = await collection.add({
    content,
    metadata,
    embedding: FieldValue.vector(embedding),
    createdAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}
