# Component Library

> Comprehensive documentation for Other Dev UI component library

## Table of Contents

- [Overview](#overview)
- [Design System](#design-system)
- [UI Primitives](#ui-primitives)
  - [Button](#button)
  - [Card](#card)
  - [Dialog](#dialog)
  - [Input](#input)
  - [Form](#form)
- [Application Components](#application-components)
  - [Navigation](#navigation)
  - [Footer](#footer)
  - [Project Card](#project-card)
  - [Contact Dialog](#contact-dialog)
  - [Chat Widget](#chat-widget)
- [Styling Guidelines](#styling-guidelines)
- [Accessibility](#accessibility)

---

## Overview

The Other Dev component library follows the **shadcn/ui** pattern, wrapping Radix UI primitives with Tailwind CSS styling. All components are fully accessible, keyboard navigable, and theme-aware.

### Key Features

- **Radix UI Foundation:** Unstyled, accessible primitives
- **Tailwind CSS Styling:** Utility-first, customizable design
- **Class Variance Authority (CVA):** Type-safe variant management
- **Dark Mode Support:** Automatic theme switching via next-themes
- **TypeScript:** Full type safety with prop validation
- **Accessibility:** ARIA compliant, keyboard navigation

### Directory Structure

```
src/components/
├── ui/                         # Radix UI wrapper components (56 components)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── form.tsx
│   └── ...
├── navigation.tsx              # Main navigation
├── footer.tsx                  # Footer component
├── project-card.tsx            # Project display card
├── contact-dialog.tsx          # Contact form modal
├── chat-widget.tsx             # RAG-powered chat interface
└── providers.tsx               # React Query + tRPC providers
```

---

## Design System

### Color Palette

Defined in CSS variables for theme switching:

```css
/* Light theme */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
}

/* Dark theme */
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### Typography

```typescript
// Tailwind config (tailwind.config.ts)
fontFamily: {
  sans: ["var(--font-geist-sans)"],
  mono: ["var(--font-geist-mono)"],
}
```

**Font Sizes:**
- `text-xs` - 0.75rem (12px)
- `text-sm` - 0.875rem (14px)
- `text-base` - 1rem (16px)
- `text-lg` - 1.125rem (18px)
- `text-xl` - 1.25rem (20px)
- `text-2xl` - 1.5rem (24px)

### Spacing

Uses Tailwind's default spacing scale (0.25rem increments):
- `gap-2` - 0.5rem (8px)
- `gap-4` - 1rem (16px)
- `gap-6` - 1.5rem (24px)
- `p-4` - 1rem padding
- `m-4` - 1rem margin

### Border Radius

- `rounded-xs` - 2px
- `rounded-sm` - 4px
- `rounded-md` - 6px (default)
- `rounded-lg` - 8px
- `rounded-xl` - 12px
- `rounded-full` - 9999px

---

## UI Primitives

### Button

**Location:** `src/components/ui/button.tsx`

Versatile button component with multiple variants and sizes.

#### Variants

```typescript
type ButtonVariant =
  | "default"      // Primary button
  | "destructive"  // Danger/delete actions
  | "outline"      // Secondary button with border
  | "secondary"    // Muted secondary button
  | "ghost"        // Minimal, transparent button
  | "link";        // Text link style
```

#### Sizes

```typescript
type ButtonSize =
  | "default"      // h-9 (36px)
  | "sm"           // h-8 (32px)
  | "lg"           // h-10 (40px)
  | "icon"         // size-9 (square)
  | "icon-sm"      // size-8 (square)
  | "icon-lg";     // size-10 (square)
```

#### Usage Examples

```tsx
import { Button } from "@/components/ui/button";

// Default primary button
<Button>Click me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Outline secondary button
<Button variant="outline">Cancel</Button>

// Ghost button (minimal)
<Button variant="ghost">Close</Button>

// Large button
<Button size="lg">Submit Form</Button>

// Icon button
<Button size="icon">
  <SearchIcon />
</Button>

// As child (renders as custom component)
<Button asChild>
  <Link href="/about">About</Link>
</Button>

// With loading state
<Button disabled={isLoading}>
  {isLoading && <Spinner />}
  Submit
</Button>
```

#### Props

```typescript
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;  // Render as child component
}
```

#### Styling

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: { /* ... */ },
      size: { /* ... */ },
    },
  }
);
```

---

### Card

**Location:** `src/components/ui/card.tsx`

Flexible card container with header, content, and footer sections.

#### Anatomy

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
    <CardAction>
      <Button>Action</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    Main card content goes here
  </CardContent>
  <CardFooter>
    Footer content or actions
  </CardFooter>
</Card>
```

#### Components

- **Card:** Root container with border and shadow
- **CardHeader:** Header section with grid layout
- **CardTitle:** Bold title text
- **CardDescription:** Muted description text
- **CardAction:** Action button area (top-right)
- **CardContent:** Main content area
- **CardFooter:** Footer section for actions

#### Usage Examples

```tsx
// Simple card
<Card>
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
    <CardDescription>Project description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Project details here...</p>
  </CardContent>
</Card>

// Card with action
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
    <CardAction>
      <Button size="sm">Edit</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p>Settings content</p>
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>

// Grid of cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.map(project => (
    <Card key={project.id}>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{project.description}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

#### Styling

```css
Card: rounded-xl, border, shadow-sm, bg-card
CardHeader: px-6, gap-2 (grid layout)
CardTitle: font-semibold, leading-none
CardDescription: text-sm, text-muted-foreground
CardContent: px-6
CardFooter: px-6, flex items-center
```

---

### Dialog

**Location:** `src/components/ui/dialog.tsx`

Modal dialog component with overlay and animated transitions.

#### Anatomy

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description or instructions
      </DialogDescription>
    </DialogHeader>

    <div>Main content</div>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Components

- **Dialog:** Root dialog provider
- **DialogTrigger:** Button that opens dialog
- **DialogContent:** Modal content container
- **DialogOverlay:** Semi-transparent backdrop
- **DialogHeader:** Header section
- **DialogTitle:** Dialog title (required for a11y)
- **DialogDescription:** Descriptive text
- **DialogFooter:** Footer actions
- **DialogClose:** Close dialog button

#### Usage Examples

```tsx
// Controlled dialog
function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Without close button
<DialogContent showCloseButton={false}>
  {/* Content */}
</DialogContent>

// Large dialog
<DialogContent className="max-w-3xl">
  {/* Wide content */}
</DialogContent>
```

#### Props

```typescript
interface DialogContentProps {
  showCloseButton?: boolean;  // Show X button (default: true)
  className?: string;
  children: React.ReactNode;
}
```

#### Animations

```css
Dialog entrance:
- fade-in-0
- zoom-in-95
- duration-200

Dialog exit:
- fade-out-0
- zoom-out-95
```

---

### Input

**Location:** `src/components/ui/input.tsx`

Text input field with consistent styling.

#### Usage Examples

```tsx
import { Input } from "@/components/ui/input";

// Basic input
<Input type="text" placeholder="Enter text..." />

// Email input
<Input type="email" placeholder="email@example.com" />

// With label
<div>
  <Label htmlFor="name">Name</Label>
  <Input id="name" type="text" />
</div>

// Disabled
<Input disabled value="Read-only value" />

// With error state
<Input
  type="email"
  aria-invalid={hasError}
  className={hasError ? "border-destructive" : ""}
/>
```

#### Props

```typescript
interface InputProps extends React.ComponentProps<"input"> {
  // All standard HTML input attributes
}
```

#### Styling

```css
h-9                           /* Height */
rounded-md                    /* Border radius */
border border-input          /* Border */
bg-transparent               /* Background */
px-3 py-1                    /* Padding */
text-base                    /* Font size */
shadow-xs                    /* Subtle shadow */
transition-colors            /* Smooth transitions */
focus-visible:ring-ring      /* Focus ring */
disabled:opacity-50          /* Disabled state */
```

---

### Form

**Location:** `src/components/ui/form.tsx`

Form component integrated with React Hook Form and Zod validation.

#### Components

- **Form:** Root form provider
- **FormField:** Field controller
- **FormItem:** Field container
- **FormLabel:** Field label
- **FormControl:** Input wrapper
- **FormDescription:** Help text
- **FormMessage:** Error message

#### Usage Example

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                Enter your full name
              </FormDescription>
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
                <Input type="email" placeholder="john@example.com" {...field} />
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

## Application Components

### Navigation

**Location:** `src/components/navigation.tsx`

Main site navigation with responsive menu and theme toggle.

#### Features

- Responsive design (mobile hamburger menu)
- Active link highlighting
- Theme switcher (light/dark mode)
- Smooth scroll to sections

#### Usage

```tsx
import { Navigation } from "@/components/navigation";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
```

---

### Footer

**Location:** `src/components/footer.tsx`

Site footer with links and social icons.

#### Features

- Social media links
- Quick navigation links
- Copyright information
- Responsive layout

#### Usage

```tsx
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <>
      <main>{/* Content */}</main>
      <Footer />
    </>
  );
}
```

---

### Project Card

**Location:** `src/components/project-card.tsx`

Display card for portfolio projects.

#### Props

```typescript
interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    slug: string;
    image: string;
    description: string;
    url?: string;
  };
}
```

#### Usage

```tsx
import { ProjectCard } from "@/components/project-card";

function ProjectGrid({ projects }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

---

### Contact Dialog

**Location:** `src/components/contact-dialog.tsx`

Two-step contact form modal with tRPC integration.

#### Features

- Two-step form flow (info → message)
- Real-time validation with Zod
- tRPC mutation for submission
- Loading states and error handling
- Toast notifications

#### Usage

```tsx
import { ContactDialog } from "@/components/contact-dialog";

function Page() {
  return (
    <div>
      <ContactDialog />
    </div>
  );
}
```

#### Form Fields

**Step 1:**
- Name (min 2 characters)
- Company Name (required)
- Email (valid format)

**Step 2:**
- Subject (required)
- Message (min 10 characters)

---

### Chat Widget

**Location:** `src/components/chat-widget.tsx`

RAG-powered AI chat interface with streaming responses.

#### Features

- Floating chat button
- Full-screen responsive modal
- Message history
- Streaming responses (SSE)
- Markdown rendering
- Code syntax highlighting (Shiki)
- Auto-scroll behavior
- Rate limit handling

#### Usage

```tsx
import { ChatWidget } from "@/components/chat-widget";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
```

#### Message Format

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
```

---

## Styling Guidelines

### Utility Classes

Use Tailwind utilities for consistency:

```tsx
// Spacing
<div className="space-y-4">      // Vertical spacing between children
<div className="gap-6">           // Gap in flex/grid layouts

// Layout
<div className="flex items-center justify-between">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Typography
<h1 className="text-2xl font-bold">
<p className="text-sm text-muted-foreground">

// Responsive
<div className="hidden md:block">  // Hidden on mobile, visible on tablet+
```

### Component Composition

Build complex UIs by composing primitives:

```tsx
function ComplexCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Content</p>
      </CardContent>
    </Card>
  );
}
```

### Custom Variants

Extend components with CVA:

```typescript
import { cva } from "class-variance-authority";

const customButton = cva(buttonVariants(), {
  variants: {
    custom: {
      premium: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
  },
});
```

---

## Accessibility

### Keyboard Navigation

All components support keyboard navigation:

- **Tab:** Navigate through interactive elements
- **Enter/Space:** Activate buttons and links
- **Escape:** Close dialogs and dropdowns
- **Arrow keys:** Navigate menus and lists

### ARIA Attributes

Components include proper ARIA labels:

```tsx
// Dialog
<DialogTitle>...</DialogTitle>           // aria-labelledby
<DialogDescription>...</DialogDescription> // aria-describedby

// Button
<Button aria-label="Close dialog">
  <XIcon />
</Button>

// Input
<Input
  aria-invalid={hasError}
  aria-describedby="error-message"
/>
```

### Focus Management

- Visible focus rings on all interactive elements
- Focus trap in modals
- Restore focus after closing dialogs

### Screen Reader Support

- Semantic HTML elements
- ARIA live regions for dynamic content
- Skip navigation links
- Alternative text for images

---

## Best Practices

1. **Use semantic HTML** - `<button>`, `<nav>`, `<main>`, etc.
2. **Compose primitives** - Build complex UIs from simple components
3. **Leverage Tailwind** - Use utility classes for consistent styling
4. **Add prop types** - Define clear TypeScript interfaces
5. **Handle loading states** - Show spinners during async operations
6. **Provide feedback** - Use toasts for success/error messages
7. **Mobile-first** - Design for mobile, enhance for desktop
8. **Test accessibility** - Use keyboard navigation and screen readers

---

For more information, see:
- [API Reference](./API_REFERENCE.md) - API documentation
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Developer Guide](./DEVELOPER_GUIDE.md) - Setup and workflow
