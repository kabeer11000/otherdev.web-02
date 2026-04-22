import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

const navLinks = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/loom", label: "Loom" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export const Navigation = component$(() => {
  const location = useLocation();

  return (
    <nav class="flex items-center justify-between w-full h-7 px-4 py-6">
      <div class="flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            class={[
              "font-[var(--twk-lausanne)] text-xs tracking-tight transition-opacity",
              location.url.pathname === link.href
                ? "text-stone-900 opacity-100"
                : "text-stone-400 opacity-70 hover:opacity-100",
            ]}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <Link
        href="/"
        class="font-[var(--twk-lausanne)] text-xs tracking-tight text-stone-900 opacity-70 hover:opacity-100 transition-opacity"
      >
        other dev
      </Link>
    </nav>
  );
});
