import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";

const clientsDesktop = [
  ["Narkins Builders", "Groovy Pakistan", "Olly Shinder"],
  ["Bin Yousuf Group", "Parcheh81", "Tiny Footprint Coffee"],
  ["Lexa", "Finlit", "Ek Qadam Aur"],
  ["Wish Apparels", "Kiswa Noir", "BLVD"],
  ["CLTRD Legacy"],
];

const clientsMobile = [
  ["Narkins Builders", "Parcheh81"],
  ["Bin Yousuf Group", "Tiny Footprint Coffee"],
  ["Lexa", "Ek Qadam Aur"],
  ["Olly Shinder", "Groovy Pakistan"],
  ["Wish Apparels", "Finlit"],
  ["Kiswa Noir", "BLVD"],
  ["CLTRD Legacy"],
];

export default component$(() => {
  const heroRef = useSignal<HTMLDivElement>();

  useVisibleTask$(() => {
    if (heroRef.value) {
      heroRef.value.classList.add("hero-container");
    }
  });

  useVisibleTask$(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll(".reveal-on-scroll, .client-item");
    revealElements.forEach((el) => observer.observe(el));

    cleanup(() => observer.disconnect());
  });

  return (
    <main class="min-h-screen bg-neutral-50">
      <Navigation />

      <div class="container mx-auto px-3 pt-[72px] pb-12 max-w-[1440px]">
        {/* Hero Image - Responsive grid layout matching Next.js */}
        <div ref={heroRef} class="grid grid-cols-12 gap-[12px]">
          <div class="col-span-12 sm:col-span-10">
            <div class="relative w-full aspect-[9/4] rounded-[5px] overflow-hidden">
              <img
                src="/images/about-page/about-team-combined-desktop.webp"
                alt="The members of otherdev"
                class="hidden sm:block w-full h-full object-cover object-center bg-stone-200"
              />
              <img
                src="/images/about-page/about-team-combined.webp"
                alt="The members of otherdev"
                class="sm:hidden w-full h-full object-cover object-center bg-stone-200"
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div class="mt-[30px] grid grid-cols-8 sm:grid-cols-12 gap-[6px] sm:gap-[12px] reveal-on-scroll">
          <div class="col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6 xl:col-span-5">
            <p class="text-[#686868] text-[11px] font-normal leading-[14px] tracking-[-0.24px]">
              About
            </p>
            <p class="mt-[9px] text-black text-[12px] font-normal leading-[14px] tracking-[-0.24px] whitespace-pre-line">
              Other Dev produces digital platforms for pioneering creatives. Based in Karachi City,
              we are a full-service web development and design studio specializing in the fashion
              and design fields, with a focus on bringing ideas to life through thoughtful design.
              Our team consists of Kabeer Jaffri and Ossaid Qadri, who met while studying at Habib
              Public School.
            </p>
          </div>
        </div>

        {/* Clients Section */}
        <div class="mt-[30px] grid grid-cols-12 gap-[12px] reveal-on-scroll">
          <div class="col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
            <p class="text-[#686868] text-[11px] font-normal leading-[14px] tracking-[-0.24px]">
              Clients
            </p>
            <div class="mt-[9px] grid grid-cols-2 sm:grid-cols-3 gap-[12px] gap-y-[6px]">
              {/* Desktop clients - hidden on mobile */}
              {clientsDesktop.map((row, rowIndex) =>
                row.map((client, colIndex) => (
                  <p
                    key={`desktop-${rowIndex}-${colIndex}`}
                    class="hidden sm:block text-black text-[11px] font-normal leading-[14px] tracking-[-0.24px] client-item"
                  >
                    {client}
                  </p>
                ))
              )}
              {/* Mobile clients - hidden on desktop */}
              {clientsMobile.map((row, rowIndex) =>
                row.map((client, colIndex) => (
                  <p
                    key={`mobile-${rowIndex}-${colIndex}`}
                    class="sm:hidden text-black text-[11px] font-normal leading-[14px] tracking-[-0.24px] client-item"
                  >
                    {client}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <ChatWidget />
    </main>
  );
});

export const head: DocumentHead = {
  title: "About | Other Dev",
  meta: [
    {
      name: "description",
      content:
        "Learn about Other Dev, a full-service web development and design studio based in Karachi. Discover our team, mission, and the clients we've worked with.",
    },
  ],
};