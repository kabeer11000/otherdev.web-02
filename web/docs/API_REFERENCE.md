# API Reference

> Comprehensive API documentation for OtherDev Next.js application

## Table of Contents

- [Overview](#overview)
- [tRPC Configuration](#trpc-configuration)
- [API Routers](#api-routers)
  - [Contact Router](#contact-router)
  - [Content Router](#content-router)
- [Chat API](#chat-api)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)

---

## Overview

The OtherDev application uses **tRPC** for type-safe API communication between client and server. All API endpoints are automatically type-checked and provide full TypeScript IntelliSense support.

### Tech Stack

- **tRPC v11** - End-to-end type safety
- **Zod** - Runtime schema validation
- **SuperJSON** - Enhanced serialization (handles Date, Map, Set)
- **React Query** - Data fetching and caching

### Base Configuration

```typescript
// src/server/trpc.ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

export const createTRPCContext = async (opts: { req: Request }) => {
  const domain = opts.req.headers.get("x-tenant-domain") || "otherdev.com";
  return { domain };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
```

---

## tRPC Configuration

### Client Setup

```typescript
// src/components/providers.tsx
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});
```

### API Endpoint

All tRPC procedures are accessible via:

```
POST /api/trpc/[procedure]
```

The HTTP handler is located at:
- `src/app/api/trpc/[trpc]/route.ts`

---

## API Routers

### Contact Router

**Location:** `src/server/routers/contact.ts`

Handles contact form submissions with dual integration (Google Sheets + Gmail).

#### Procedures

##### `contact.submit`

Submit a contact form request.

**Type:** `mutation`

**Input Schema:**

```typescript
{
  name: string;        // Min 2 characters
  companyName: string; // Required
  email: string;       // Valid email format
  subject: string;     // Required
  message: string;     // Min 10 characters
}
```

**Returns:**

```typescript
{
  message: string;     // "Form submitted successfully"
}
```

**Example Usage:**

```typescript
// Client-side
import { trpc } from "@/lib/trpc";

function ContactForm() {
  const submitMutation = trpc.contact.submit.useMutation();

  const handleSubmit = async (data) => {
    try {
      await submitMutation.mutateAsync({
        name: "John Doe",
        companyName: "Acme Inc",
        email: "john@example.com",
        subject: "Project Inquiry",
        message: "I'd like to discuss a new project...",
      });
      // Success!
    } catch (error) {
      // Handle error
    }
  };
}
```

**Backend Operations:**

1. Validates input with Zod schema
2. Appends data to Google Sheet (timestamp + all fields)
3. Sends email via Gmail SMTP
4. Both operations run in parallel via `Promise.all()`

**Required Environment Variables:**

```bash
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-sheet-id
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
GMAIL_RECIPIENTS=recipient1@example.com,recipient2@example.com  # Optional, defaults to GMAIL_USER
```

**Error Scenarios:**

| Error | Status | Description |
|-------|--------|-------------|
| Invalid email | 400 | Email format validation failed |
| Missing field | 400 | Required field not provided |
| Google Sheets API error | 500 | Failed to append to sheet |
| Gmail SMTP error | 500 | Failed to send email |

---

### Content Router

**Location:** `src/server/routers/content.ts`

Fetches blog posts and categories from Payload CMS via Canvas SDK. Domain context is automatically injected via tRPC context.

#### Procedures

##### `content.getBlogPosts`

Fetch paginated blog posts for the current domain.

**Type:** `query`

**Input Schema:**

```typescript
{
  limit?: number;  // Default: 10
  page?: number;   // Default: 1
}
```

**Returns:**

```typescript
{
  docs: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    publishedAt: Date;
    author?: {
      name: string;
      avatar?: string;
    };
    categories?: Array<{ name: string; slug: string }>;
  }>;
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

**Example Usage:**

```typescript
function BlogList() {
  const { data, isLoading } = trpc.content.getBlogPosts.useQuery({
    limit: 12,
    page: 1,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.docs.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

---

##### `content.getBlogPost`

Fetch a single blog post by slug.

**Type:** `query`

**Input Schema:**

```typescript
{
  slug: string;
}
```

**Returns:**

```typescript
{
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  publishedAt: Date;
  author?: {
    name: string;
    avatar?: string;
  };
  categories?: Array<{ name: string; slug: string }>;
  seo?: {
    title: string;
    description: string;
    image?: string;
  };
}
```

**Example Usage:**

```typescript
function BlogPost({ slug }: { slug: string }) {
  const { data, isLoading } = trpc.content.getBlogPost.useQuery({ slug });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Post not found</div>;

  return (
    <article>
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.content }} />
    </article>
  );
}
```

---

##### `content.getCategories`

Fetch all blog categories for the current domain.

**Type:** `query`

**Input:** None (uses domain from context)

**Returns:**

```typescript
Array<{
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}>
```

**Example Usage:**

```typescript
function CategoryList() {
  const { data } = trpc.content.getCategories.useQuery();

  return (
    <ul>
      {data?.map((category) => (
        <li key={category.id}>
          {category.name} ({category.postCount})
        </li>
      ))}
    </ul>
  );
}
```

---

## Chat API

**Endpoint:** `POST /api/chat/stream`

**Location:** `src/app/api/chat/stream/route.ts`

RAG-powered AI chat endpoint using Groq LLM with vector search.

### Request Format

```typescript
{
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
```

### Response Format

Server-Sent Events (SSE) stream:

```
data: {"content":"Hello"}
data: {"content":" there!"}
data: [DONE]
```

### Features

- **Vector Search:** Semantic search in Supabase pgvector
- **RAG Context:** Retrieves relevant knowledge base documents
- **Streaming:** Real-time response streaming
- **Rate Limiting:** 10 requests/minute per IP
- **Input Sanitization:** Prevents prompt injection attacks

### Example Usage

```typescript
async function chat(messages: Message[]) {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;

        const parsed = JSON.parse(data);
        console.log(parsed.content);
      }
    }
  }
}
```

### Configuration

**Environment Variables:**

```bash
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_API_KEY=your-hf-api-key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional configuration
RAG_SIMILARITY_THRESHOLD=0.1          # Vector search threshold (0-1)
RAG_MATCH_COUNT=5                     # Number of documents to retrieve
RAG_MAX_MESSAGE_LENGTH=500            # Max characters per message
```

### Rate Limiting

**Headers:**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1640000000000
```

**429 Response:**

```json
{
  "error": "Too many requests. Please try again later."
}
```

With headers:
```
Retry-After: 60
```

### Security Features

1. **Input Sanitization:** Removes dangerous prompt injection patterns
2. **Message Length Limit:** Caps messages at 500 characters
3. **IP-Based Rate Limiting:** Prevents abuse
4. **Safe Context Injection:** Validated knowledge base only

---

## Rate Limiting

**Location:** `src/server/lib/rate-limit.ts`

In-memory rate limiting with sliding window algorithm.

### Configuration

- **Window:** 60 seconds
- **Max Requests:** 10 per window
- **Identifier:** IP address (from headers)

### API

```typescript
import { checkRateLimit, getClientIdentifier } from '@/server/lib/rate-limit';

const clientId = getClientIdentifier(request);
const result = checkRateLimit(clientId);

if (!result.allowed) {
  // Rate limit exceeded
  console.log(result.resetTime);    // Timestamp when limit resets
  console.log(result.remaining);    // 0
}
```

---

## Error Handling

### tRPC Errors

tRPC automatically handles errors with proper HTTP status codes:

```typescript
// Client-side error handling
const mutation = trpc.contact.submit.useMutation({
  onError: (error) => {
    if (error.data?.code === "BAD_REQUEST") {
      console.log("Validation error:", error.message);
    } else if (error.data?.code === "INTERNAL_SERVER_ERROR") {
      console.log("Server error:", error.message);
    }
  },
});
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid input or validation error |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `TIMEOUT` | 408 | Request timeout |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Validation Errors

Zod validation errors include detailed field-level information:

```typescript
{
  code: "BAD_REQUEST",
  message: "Validation error",
  data: {
    zodError: {
      fieldErrors: {
        email: ["Invalid email address"],
        message: ["String must contain at least 10 character(s)"]
      }
    }
  }
}
```

---

## Client-Side Hooks

### Query Hooks

```typescript
// Basic query
const { data, isLoading, error } = trpc.content.getBlogPosts.useQuery({
  limit: 10,
});

// With options
const { data } = trpc.content.getBlogPost.useQuery(
  { slug: "my-post" },
  {
    enabled: !!slug,          // Only fetch when slug exists
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  }
);
```

### Mutation Hooks

```typescript
const mutation = trpc.contact.submit.useMutation({
  onSuccess: (data) => {
    console.log("Success:", data.message);
  },
  onError: (error) => {
    console.error("Error:", error.message);
  },
});

// Usage
mutation.mutate({ name: "...", email: "...", ... });

// Async
await mutation.mutateAsync({ ... });
```

---

## Type Safety

All API types are automatically inferred:

```typescript
import type { AppRouter } from "@/server/routers";

// Infer input types
type ContactInput = RouterInputs["contact"]["submit"];

// Infer output types
type BlogPosts = RouterOutputs["content"]["getBlogPosts"];

// Use in components
function handleSubmit(data: ContactInput) {
  // Fully typed!
}
```

---

## Best Practices

1. **Use React Query features** - Leverage caching, background refetch, optimistic updates
2. **Handle loading states** - Always provide feedback during data fetching
3. **Error boundaries** - Wrap components with error boundaries for graceful degradation
4. **Input validation** - Validate on both client and server
5. **Rate limiting awareness** - Handle 429 responses with retry logic
6. **Type safety** - Let TypeScript catch errors at compile time

---

## Testing

### Unit Testing tRPC Procedures

```typescript
import { appRouter } from "@/server/routers";

describe("Contact Router", () => {
  it("should validate email format", async () => {
    const caller = appRouter.createCaller({ domain: "test.com" });

    await expect(
      caller.contact.submit({
        name: "Test",
        companyName: "Test Inc",
        email: "invalid-email",
        subject: "Test",
        message: "Test message",
      })
    ).rejects.toThrow("Invalid email");
  });
});
```

---

For more information, see:
- [Developer Guide](./DEVELOPER_GUIDE.md) - Development workflow
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Component Library](./COMPONENTS.md) - UI components
