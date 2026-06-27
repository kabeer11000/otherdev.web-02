# Developer Guide

> Complete guide to developing with the Other Dev Next.js application

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Getting Started

### Prerequisites

- **Bun** >= 1.0 (recommended) or **Node.js** >= 18
- **Git**
- **Code Editor** (VS Code recommended)

### Initial Setup

1. **Clone the repository:**

```bash
git clone https://github.com/your-org/otherdev-v2.git
cd otherdev-v2/web
```

2. **Install dependencies:**

```bash
bun install
```

3. **Set up environment variables:**

Create `.env.local` in the `web/` directory:

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://otherdev.com

# Canvas CMS
CANVAS_API_URL=https://client5.otherdev.com/canvas/v1/api/
CANVAS_API_KEY=your-api-key
CANVAS_PROJECT_ID=your-project-id

# Contact Form
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
GMAIL_RECIPIENTS=recipient1@example.com,recipient2@example.com

# AI Services
GROQ_API_KEY=your-groq-api-key

# Vector Search (Qdrant)
QDRANT_URL=https://your-qdrant.cloud
QDRANT_API_KEY=your-qdrant-key

# Web Search (Tavily)
TAVILY_API_KEY=your-tavily-key

# Rate Limiting & Chat Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# RAG Configuration
RAG_SIMILARITY_THRESHOLD=0.1
RAG_MATCH_COUNT=5
RAG_MAX_MESSAGE_LENGTH=500
CHAT_HISTORY_TTL_SECONDS=1209600
RAG_RETRIEVAL_CACHE_TTL_SECONDS=21600
CHAT_RESPONSE_CACHE_TTL_SECONDS=86400
```

4. **Start the development server:**

```bash
bun dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server with hot reload |
| `bun build` | Create optimized production build |
| `bun start` | Start production server |
| `bun lint` | Run Biome linter checks |
| `bun format` | Auto-format code with Biome |
| `bun ingest` | Ingest knowledge base into Qdrant |
| `bun clear` | Clear all documents from Qdrant |
| `bun test-search` | Test vector search (runs test-search.ts) |

### Git Workflow

1. **Create a feature branch:**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes and commit:**

```bash
git add .
git commit -m "feat: add new feature"
```

3. **Push to remote:**

```bash
git push origin feature/your-feature-name
```

4. **Create a Pull Request** on GitHub

### Commit Message Convention

Follow conventional commits:

```
feat: add new feature
fix: resolve bug in contact form
docs: update README
style: format code with Biome
refactor: restructure component hierarchy
perf: optimize image loading
test: add unit tests for API router
chore: update dependencies
```

---

## Project Structure

```
web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Homepage
│   │   ├── about/page.tsx            # About page
│   │   ├── work/                     # Work pages
│   │   │   ├── page.tsx              # Work listing
│   │   │   └── [slug]/page.tsx       # Individual project
│   │   ├── blog/                     # Blog pages (optional)
│   │   └── api/                          # API routes
│   │       ├── contact/route.ts          # Contact form handler
│   │       ├── transcribe/route.ts       # Audio transcription
│   │       └── process-document/route.ts # PDF/image OCR
│   ├── components/
│   │   ├── ui/                           # Radix UI primitives (56 components)
│   │   ├── navigation.tsx                # Main navigation
│   │   ├── footer.tsx                    # Footer
│   │   ├── project-card.tsx              # Project card
│   │   ├── contact-dialog.tsx            # Contact form
│   │   ├── chat-widget.tsx               # AI chat widget
│   │   ├── chat-core.tsx                 # Chat core logic
│   │   ├── artifact-renderer.tsx         # Artifact display
│   │   └── providers.tsx                 # React Query provider
│   ├── lib/
│   │   ├── utils.ts                     # Utility functions
│   │   ├── projects.ts                  # Project data (~17 projects)
│   │   ├── knowledge-base.ts            # RAG knowledge base
│   │   └── constants.ts                 # App constants
│   ├── server/
│   │   └── lib/
│   │       ├── rate-limit.ts            # Upstash rate limiting
│   │       ├── chat/
│   │       │   ├── models.ts          # AI Gateway model definitions
│   │       │   ├── stream-handler.ts  # Tool-driven chat handler
│   │       │   └── tools.ts           # retrieveKnowledge, tavilySearch, createArtifact
│   │       └── rag/
│   │           ├── embeddings.ts        # Cohere via AI Gateway
│   │           ├── vector-search.ts    # Qdrant vector search
│   │           └── rerank.ts           # Cohere reranking
│   └── hooks/                           # Custom React hooks
├── public/
│   └── images/                       # Static images
├── scripts/
│   └── ingest-documents.ts           # Vector DB ingestion
├── biome.json                        # Biome configuration
├── components.json                   # shadcn/ui config
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies
```

---

## Common Tasks

### Adding a New Page

1. **Create page file:**

```bash
# Example: /services page
touch src/app/services/page.tsx
```

2. **Define page component:**

```tsx
// src/app/services/page.tsx
import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Services | Other Dev",
  description: "Our web development and design services",
};

export default function ServicesPage() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Our Services</h1>
        {/* Content */}
      </main>
      <Footer />
    </>
  );
}
```

3. **Add navigation link:**

Update `src/components/navigation.tsx` to include the new page link.

---

### Adding a New Component

1. **Create component file:**

```bash
# Example: feature card component
touch src/components/feature-card.tsx
```

2. **Define component:**

```tsx
// src/components/feature-card.tsx
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        {icon && <div className="mb-2">{icon}</div>}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
```

3. **Use component:**

```tsx
import { FeatureCard } from "@/components/feature-card";

<FeatureCard
  title="Fast Performance"
  description="Optimized for speed and efficiency"
  icon={<RocketIcon />}
/>
```

---

### Adding a UI Primitive

1. **Install Radix UI package:**

```bash
bun add @radix-ui/react-component-name
```

2. **Create wrapper component:**

```bash
touch src/components/ui/component-name.tsx
```

3. **Implement wrapper:**

```tsx
// src/components/ui/tooltip.tsx
"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

4. **Use component:**

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### Creating an API Route

1. **Create route file:**

```bash
mkdir -p src/app/api/newsletter
touch src/app/api/newsletter/route.ts
```

2. **Define route handler:**

```tsx
// src/app/api/newsletter/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    // Save email to database or mailing service
    console.log("Subscribing:", email);

    return NextResponse.json({ message: "Successfully subscribed!" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

3. **Call from client:**

```tsx
async function subscribe(email: string) {
  const response = await fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Subscription failed');
  }

  return response.json();
}
```

---

### Adding Knowledge Base Documents

1. **Edit knowledge base:**

```tsx
// src/lib/knowledge-base.ts
export const knowledgeBase: KnowledgeDocument[] = [
  // Existing documents...

  // Add new document
  {
    content: `
      Other Dev specializes in custom e-commerce development using Next.js,
      Shopify, and WooCommerce. We build scalable online stores with
      payment integration, inventory management, and analytics.
    `,
    metadata: {
      source: "website",
      title: "E-commerce Development Services",
      type: "service",
      category: "e-commerce",
    },
  },
];
```

2. **Ingest into vector DB:**

```bash
bun ingest
```

This will:
- Generate embeddings via Cohere embed-v4.0 through AI Gateway
- Insert into Qdrant collection `otherdev_documents` (idempotent upserts)
- Make them available for RAG chat with automatic reranking

---

### Knowledge Base Ingestion Workflow

The knowledge base ingestion pipeline (`scripts/ingest-documents.ts`) performs the following steps:

```mermaid
flowchart TD
    KB[Knowledge Base<br/>src/lib/knowledge-base.ts] --> Parse[Parse documents]
    Parse --> Embed[Generate embeddings<br/>Cohere embed-v4.0]
    Embed --> Batch[Batch upserts<br/>64 points/batch]
    Batch --> Qdrant[Qdrant collection<br/>otherdev_documents]
    Qdrant --> Done[Searchable via RAG]
```

**Ingest command:**
```bash
bun ingest
```

**Clear command (wipe collection):**
```bash
bun clear
```

**Test search:**
```bash
bun test-search
```

**Key features:**
- Idempotent upserts via SHA-256 point IDs (re-ingest is safe)
- Parallel batch processing (64 points per batch)
- Payload indexes on: `source`, `title`, `type`, `category`
- Context caching (6-hour TTL) to avoid redundant vector lookups

---

### Working with Forms

Use React Hook Form + Zod for type-safe forms:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Invalid email"),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);  // Fully typed!
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## Best Practices

### TypeScript

1. **Define prop interfaces:**

```tsx
interface ComponentProps {
  title: string;
  description?: string;  // Optional
  onClick: () => void;
}

export function Component({ title, description, onClick }: ComponentProps) {
  // ...
}
```

2. **Use type inference:**

```tsx
// Good - infer types from Zod schema
type FormData = z.infer<typeof formSchema>;

// Good - type-safe API responses
type BlogPosts = Awaited<ReturnType<typeof fetchBlogPosts>>;
```

3. **Avoid `any`:**

```tsx
// Bad
const data: any = await fetchData();

// Good
const data: BlogPost[] = await fetchData();
```

---

### Component Design

1. **Server Components by default:**

```tsx
// Server Component (default) - no "use client"
async function ServerComponent() {
  const data = await fetchData();  // Can fetch on server
  return <div>{data}</div>;
}
```

2. **Client Components when needed:**

```tsx
// Client Component - needs "use client"
"use client";

function ClientComponent() {
  const [state, setState] = useState();  // Needs interactivity
  return <button onClick={() => setState(...)}>Click</button>;
}
```

3. **Composition over props drilling:**

```tsx
// Good - composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Avoid - prop drilling
<Card title="Title" content="Content" />
```

---

### Styling

1. **Use Tailwind utilities:**

```tsx
// Good
<div className="flex items-center gap-4 p-6">

// Avoid - inline styles
<div style={{ display: "flex", alignItems: "center" }}>
```

2. **Responsive design:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

3. **Use design tokens:**

```tsx
// Good - semantic colors
<p className="text-muted-foreground">

// Avoid - arbitrary colors
<p className="text-gray-500">
```

---

### Performance

1. **Dynamic imports for heavy components:**

```tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./heavy-chart"), {
  loading: () => <Spinner />,
  ssr: false,  // Client-side only
});
```

2. **Optimize images:**

```tsx
import Image from "next/image";

<Image
  src="/images/project.jpg"
  alt="Project screenshot"
  width={800}
  height={600}
  priority  // Above the fold
/>
```

3. **Use React Query caching:**

```tsx
const { data } = useQuery({
  queryKey: ['posts', { limit: 10 }],
  queryFn: () => fetchBlogPosts({ limit: 10 }),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,  // 10 minutes (formerly cacheTime)
});
```

---

### Error Handling

1. **Handle API errors:**

```tsx
const mutation = useMutation({
  mutationFn: submitContact,
  onError: (error) => {
    if (error.message === "Validation error") {
      toast.error("Invalid form data");
    } else {
      toast.error("Server error. Please try again.");
    }
  },
});
```

2. **Use error boundaries:**

```tsx
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary
  fallback={<div>Something went wrong</div>}
  onError={(error) => console.error(error)}
>
  <Component />
</ErrorBoundary>
```

3. **Validate user input:**

```tsx
// Server-side validation (always)
const schema = z.object({
  email: z.string().email(),
});

// Client-side validation (optional, for UX)
const form = useForm({
  resolver: zodResolver(schema),
});
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
Error: Port 3000 is already in use
```

**Solution:**

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 bun dev
```

---

#### TypeScript Errors After Adding Dependency

```bash
Type error: Cannot find module '@new/package'
```

**Solution:**

```bash
# Restart TypeScript server
# In VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server"

# Or restart dev server
bun dev
```

---

#### API Type Errors

```bash
Type error: Property 'newsletter' does not exist on type 'ApiRoutes'
```

**Solution:**

1. Restart TypeScript server
2. Check that route is defined in `src/app/api/`
3. Verify the route file exports a handler (GET, POST, etc.)

---

#### Rate Limit Errors

```bash
429 Too Many Requests
```

**Solution:**

1. Wait 60 seconds for rate limit to reset
2. Check `X-RateLimit-Reset` header for exact reset time
3. Adjust rate limit in `src/server/lib/rate-limit.ts` for development

---

#### Vector Search Not Working

```bash
Error: No documents found
```

**Solution:**

1. Ensure knowledge base is ingested: `bun ingest`
2. Check Qdrant credentials in `.env.local`
3. Verify Qdrant collection `otherdev_documents` exists with payload indexes
4. Check similarity threshold (lower = more results, `RAG_SIMILARITY_THRESHOLD`)

---

## Testing

### Unit Testing (Future)

```bash
# Install dependencies
bun add -d vitest @testing-library/react @testing-library/jest-dom

# Run tests
bun test
```

Example test:

```tsx
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

---

### Integration Testing

Test API routes:

```tsx
import { POST } from '@/app/api/contact/route';

describe("Contact API", () => {
  it("validates email format", async () => {
    const response = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        companyName: 'Test Inc',
        email: 'invalid',
        subject: 'Test',
        message: 'Test message',
      }),
    }));

    expect(response.status).toBe(400);
  });
});
```

---

## Deployment

### Vercel (Recommended)

1. **Push to GitHub:**

```bash
git push origin main
```

2. **Import to Vercel:**

- Go to [vercel.com](https://vercel.com/new)
- Import your repository
- Set root directory to `web/`
- Add environment variables
- Deploy

3. **Configure environment:**

Add all `.env.local` variables to Vercel's environment settings.

---

### Manual Deployment

1. **Build production bundle:**

```bash
bun build
```

2. **Start production server:**

```bash
bun start
```

3. **Environment variables:**

Ensure all production environment variables are set on your hosting platform.

---

### Docker Deployment

Create `Dockerfile` in `web/` directory:

```dockerfile
FROM oven/bun:latest AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["bun", "server.js"]
```

Build and run:

```bash
docker build -t otherdev-web .
docker run -p 3000:3000 otherdev-web
```

---


## Additional Resources

- **Next.js Documentation:** [nextjs.org/docs](https://nextjs.org/docs)
- **API Routes:** [nextjs.org/docs/app/api-reference](https://nextjs.org/docs/app/api-reference)
- **React Query:** [tanstack.com/query](https://tanstack.com/query)
- **Radix UI:** [radix-ui.com](https://www.radix-ui.com)
- **Tailwind CSS:** [tailwindcss.com](https://tailwindcss.com)
- **React Hook Form:** [react-hook-form.com](https://react-hook-form.com)
- **Zod:** [zod.dev](https://zod.dev)

---

For more information, see:
- [API Reference](./API_REFERENCE.md) - API documentation
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Component Library](./COMPONENTS.md) - UI components
- Project README - Setup and configuration
