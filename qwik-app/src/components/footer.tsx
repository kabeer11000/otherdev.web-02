import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

const socialLinks = [
  { href: "https://instagram.com/other.dev", label: "Instagram" },
  { href: "https://linkedin.com/company/theotherdev/", label: "LinkedIn" },
  { href: "https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project.", label: "WhatsApp" },
];

export const Footer = component$(() => {
  return (
    <footer class="w-full px-3 py-6 bg-white">
      <div class="flex flex-col gap-5">
        <span class="font-[var(--twk-lausanne)] text-[11px] text-stone-400 leading-[14px] tracking-[-0.24px]">
          Social
        </span>
        <div class="flex gap-[6px]">
          {socialLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              class="font-[var(--twk-lausanne)] text-[10px] text-stone-400 px-[6px] py-1 bg-stone-100 rounded-[8px] hover:bg-stone-200 transition-colors tracking-[-0.24px]"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <span class="font-[var(--twk-lausanne)] text-[11px] text-stone-400 tracking-[-0.24px]">
          © other dev
        </span>
      </div>
    </footer>
  );
});