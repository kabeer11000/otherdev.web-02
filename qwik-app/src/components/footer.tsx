import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

const socialLinks = [
  { href: "https://twitter.com", label: "Twitter" },
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://linkedin.com", label: "LinkedIn" },
  { href: "https://dribbble.com", label: "Dribbble" },
];

export const Footer = component$(() => {
  return (
    <footer class="w-full px-4 py-6 bg-white">
      <div class="flex items-start justify-between">
        <div class="flex flex-col gap-4">
          <span class="font-[var(--twk-lausanne)] text-[11px] text-stone-400">
            Social
          </span>
          <div class="flex gap-2">
            {socialLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                class="font-[var(--twk-lausanne)] text-[10px] text-stone-400 px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <span class="font-[var(--twk-lausanne)] text-[11px] text-stone-400">
          © other dev
        </span>
      </div>
    </footer>
  );
});
