import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

const navLinks = [
  { href: "/work", label: "work" },
  { href: "/about", label: "about" },
  { href: "/loom", label: "ai" },
  { href: "/ads", label: "ads" },
  { href: "/contact", label: "whatsapp" },
];

export const Navigation = component$(() => {
  const location = useLocation();

  return (
    <nav class="flex items-center gap-3 px-3 py-4">
      <Link
        href="/"
        class="bg-stone-200/70 px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight text-stone-900 hover:bg-stone-200 transition-colors"
      >
        other dev
      </Link>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          class={[
            "bg-stone-200/70 px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors",
            location.url.pathname.startsWith(link.href)
              ? "text-stone-900"
              : "text-stone-400 hover:bg-stone-200",
          ]}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
});