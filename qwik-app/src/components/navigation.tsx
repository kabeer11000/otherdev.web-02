import { component$, useSignal, useVisibleTask$, $, type PropFunction } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

interface NavigationProps {
  variant?: "default" | "ai";
  isLoomPage?: boolean;
  onClear$?: PropFunction<() => void>;
  hasActiveArtifact?: boolean;
}

export const Navigation = component$<NavigationProps>((props) => {
  const { variant = "default", isLoomPage = false, hasActiveArtifact = false } = props;
  const location = useLocation();
  const isOpen = useSignal(false);
  const isAIVariant = variant === "ai";
  const mobileMenuRef = useSignal<HTMLDivElement>();

  // Restore mobile menu state from sessionStorage on mount
  useVisibleTask$(() => {
    const saved = sessionStorage.getItem("mobileMenuOpen");
    if (saved === "true") {
      isOpen.value = true;
    }
  });

  // Persist mobile menu state to sessionStorage
  useVisibleTask$(({ track }) => {
    track(() => isOpen.value);
    sessionStorage.setItem("mobileMenuOpen", isOpen.value.toString());
  });

  // Animate mobile nav items with stagger when menu opens
  useVisibleTask$(({ track }) => {
    const open = track(() => isOpen.value);

    if (open && mobileMenuRef.value) {
      const items = mobileMenuRef.value.querySelectorAll(".nav-item-animated") as NodeListOf<HTMLElement>;
      if (items.length > 0) {
        items.forEach((item, i) => {
          item.animate(
            [
              { opacity: 0, transform: "translateX(-10px)" },
              { opacity: 1, transform: "translateX(0)" },
            ],
            {
              duration: 300,
              delay: i * 100,
              fill: "forwards",
              easing: "ease-out",
            }
          );
        });
      }
    }
  });

  const handleToggle = $(() => {
    isOpen.value = !isOpen.value;
  });

  const handleClearClick = $(() => {
    if (props.onClear$) {
      props.onClear$();
    }
  });

  const navLinks = [
    { href: "/work", label: "work" },
    { href: "/about", label: "about" },
    { href: "/loom", label: "ai" },
    { href: "/work/ads-portfolio", label: "ads" },
  ];

  const whatsappLink = "https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project.";

  return (
    <nav class="fixed top-[15px] left-0 right-0 z-[60] px-3 pointer-events-none">
      {/* Mobile Navigation (or AI variant) */}
      <div
        class={[
          "flex items-center justify-between w-full pointer-events-auto relative z-50",
          isAIVariant ? "" : "sm:hidden",
        ]}
      >
        {!isOpen.value && (
          <div class="transition-opacity duration-200">
            {isLoomPage ? (
              <Link
                href="/"
                class="flex items-center bg-transparent gap-1.5 rounded-full"
              >
                <img
                  src="/otherdev-chat-logo-32.webp"
                  alt="Other Dev"
                  width={16}
                  height={16}
                  class="object-contain"
                />
              </Link>
            ) : (
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
            )}
          </div>
        )}

        <div class="flex items-center gap-1.5 ml-auto">
          {/* Clear Chat Button for Loom page */}
          {isLoomPage && props.onClear$ && !hasActiveArtifact && (
            <button
              onClick$={handleClearClick}
              class={[
                "mr-2 bg-red-50/70 text-red-600 hover:text-red-700 hover:bg-red-100/70 flex items-center px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors",
                isOpen.value && "hidden",
              ]}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              clear
            </button>
          )}
        </div>

        {/* Hamburger/X Button */}
        <button
          onClick$={handleToggle}
          class="px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors mr-2 bg-stone-200/70 text-stone-900 hover:bg-stone-200"
          aria-label="Toggle menu"
        >
          {isOpen.value ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="transition-transform duration-200 icon-x"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="transition-transform duration-200 icon-menu"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>

        {isOpen.value && (
          <div ref={mobileMenuRef} class="flex items-center gap-1.5 flex-1 nav-slide-in">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick$={() => (isOpen.value = false)}
                class={[
                  "nav-item-animated",
                  `nav-item-${index + 1}`,
                  "px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors",
                  location.url.pathname.startsWith(link.href)
                    ? "bg-stone-200 text-stone-900"
                    : "bg-stone-200/70 text-stone-400 hover:bg-stone-200",
                ]}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick$={() => (isOpen.value = false)}
              class={[
                "nav-item-animated",
                "nav-item-5",
                "px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors bg-stone-200/70 text-stone-400 hover:bg-stone-200",
              ]}
            >
              whatsapp
            </Link>
          </div>
        )}
      </div>

      {/* Tablet/Desktop Navigation */}
      {!isAIVariant && (
        <div class="hidden sm:flex items-center gap-1.5 pointer-events-auto">
          {isLoomPage ? (
            <Link href="/" class="group flex items-center bg-transparent">
              <span class="overflow-hidden transition-all duration-200 ease-out group-hover:w-auto group-hover:opacity-100 w-0 opacity-0 mr-0 group-hover:mr-1.5">
                <button class="px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight cursor-pointer whitespace-nowrap bg-stone-200/70 text-stone-400 hover:bg-stone-200">
                  other dev
                </button>
              </span>
              <img
                src="/otherdev-chat-logo-32.webp"
                alt="Other Dev"
                width={16}
                height={16}
                class="object-contain"
              />
            </Link>
          ) : (
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
          )}

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

          <Link
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            class="px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors bg-stone-200/70 text-stone-400 hover:bg-stone-200"
          >
            whatsapp
          </Link>

          {/* Clear Chat Button for Loom page on desktop */}
          {isLoomPage && props.onClear$ && !hasActiveArtifact && (
            <button
              onClick$={handleClearClick}
              class={[
                "ml-auto mr-2 bg-red-50/70 text-red-600 hover:text-red-700 hover:bg-red-100/70 flex items-center px-2 py-1 rounded-lg font-[var(--twk-lausanne)] text-xs tracking-tight transition-colors",
                isOpen.value && "hidden",
              ]}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              clear
            </button>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen.value && (
        <div
          class={[
            "fixed inset-0 z-30 backdrop-blur-lg pointer-events-none",
            isAIVariant ? "" : "sm:hidden",
          ]}
        />
      )}
    </nav>
  );
});