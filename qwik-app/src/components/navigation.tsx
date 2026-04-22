import { component$, useSignal } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

const navLinks = [
  { href: "/work", label: "work" },
  { href: "/about", label: "about" },
  { href: "/loom", label: "ai" },
  { href: "/work/ads-portfolio", label: "ads" },
  { href: "https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project.", label: "whatsapp" },
];

export const Navigation = component$(() => {
  const location = useLocation();
  const isOpen = useSignal(false);

  return (
    <nav class="fixed top-[15px] left-0 right-0 z-[60] px-3 pointer-events-none">
      {/* Mobile Navigation */}
      <div class="flex items-center justify-between w-full pointer-events-auto relative z-50 sm:hidden">
        {!isOpen.value && (
          <Link
            href="/"
            class="bg-stone-200/70 px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight text-stone-900 hover:bg-stone-200 transition-colors"
          >
            other dev
          </Link>
        )}
        <div class="flex items-center gap-1.5 ml-auto">
          <button
            onClick$={() => (isOpen.value = !isOpen.value)}
            class="bg-stone-200/70 px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight text-stone-900 hover:bg-stone-200 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen.value ? "✕" : "☰"}
          </button>
        </div>
        {isOpen.value && (
          <div class="absolute top-full left-0 right-0 mt-2 flex flex-col gap-1.5 bg-white p-3 rounded-lg shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                class={[
                  "px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors",
                  location.url.pathname.startsWith(link.href)
                    ? "bg-stone-200 text-stone-900"
                    : "text-stone-400 hover:bg-stone-200",
                ]}
                onClick$={() => (isOpen.value = false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div class="hidden sm:flex items-center gap-1.5 pointer-events-auto">
        <Link
          href="/"
          class={[
            "px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors",
            location.url.pathname === "/"
              ? "bg-stone-200 text-stone-900"
              : "bg-stone-200/70 text-stone-400 hover:bg-stone-200",
          ]}
        >
          other dev
        </Link>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            class={[
              "px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors",
              location.url.pathname.startsWith(link.href)
                ? "bg-stone-200 text-stone-900"
                : "bg-stone-200/70 text-stone-400 hover:bg-stone-200",
            ]}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
});