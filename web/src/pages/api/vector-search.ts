import { cert, getApps, initializeApp } from 'firebase-admin/app'
import type { DocumentData, QuerySnapshot } from 'firebase-admin/firestore'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { cache } from 'react'

function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

    if (!projectId || !privateKey || !clientEmail) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('Firebase environment variables are missing. Firestore will not be available.')
      }
      return null
    }

    initializeApp({
      credential: cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      }),
    })
  }
  return getFirestore()
}

const DOCUMENTS_COLLECTION = 'documents'

export interface MatchedDocument {
  id: string
  content: string
  metadata: {
    source: string
    title: string
    type: string
    category?: string
    subtype?: string
    project?: string
    year?: string
  }
  similarity: number
}

export const searchSimilarDocuments = cache(async function searchSimilarDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.1,
  matchCount: number = 5
): Promise<MatchedDocument[]> {
  const db = getDb()
  if (!db) {
    console.error('Firestore database is not initialized.')
    return []
  }
  const collection = db.collection(DOCUMENTS_COLLECTION)

  const vectorQuery = collection.findNearest({
    vectorField: 'embedding',
    queryVector: FieldValue.vector(queryEmbedding),
    limit: matchCount,
    distanceMeasure: 'COSINE',
    distanceResultField: 'distance',
    distanceThreshold: 1 - matchThreshold,
  })

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Firestore vector search timed out after 10s')), 10000)
  })

  let snapshot: QuerySnapshot<DocumentData>
  try {
    snapshot = await Promise.race([vectorQuery.get(), timeoutPromise])
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      console.error('[VectorSearch] Query timed out:', error.message)
      return []
    }
    throw error
  }

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map(doc => {
    const data = doc.data()
    const distance = data.distance as number
    return {
      id: doc.id,
      content: data.content as string,
      metadata: data.metadata as MatchedDocument['metadata'],
      similarity: 1 - distance,
    }
  })
})
