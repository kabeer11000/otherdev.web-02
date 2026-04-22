import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

const socialLinks = [
  { href: "https://instagram.com/other.dev", label: "Instagram" },
  {
    href: "https://linkedin.com/company/theotherdev/",
    label: "LinkedIn",
    external: true,
  },
  {
    href: "https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project.",
    label: "WhatsApp",
    external: true,
  },
];

export const Footer = component$(() => {
  return (
    <footer class="w-full px-3 py-6 bg-white">
      <section class="mt-[30px]">
        <h2 class="text-[#686868] text-[11px] font-[var(--twk-lausanne)] font-normal leading-[14px] tracking-[-0.24px] mb-[13px]">
          Social
        </h2>
        <div class="flex items-center gap-[6px] mb-[56px]">
          {socialLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              class="h-[21px] px-1.5 bg-stone-200 rounded-md flex items-center justify-center text-[#686868] text-[10px] font-[var(--twk-lausanne)] font-normal leading-[14px] tracking-[-0.24px] hover:bg-stone-300 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p class="text-[#686868] text-[11px] font-[var(--twk-lausanne)] font-normal leading-[14px] tracking-[-0.24px]">
          &copy; other dev
        </p>
      </section>
    </footer>
  );
});