import { component$ } from "@builder.io/qwik";

export const Hero = component$(() => {
  return (
    <section class="w-full px-4 py-16">
      <p class="font-[var(--twk-lausanne)] text-xs leading-[14px] text-stone-400 max-w-3xl">
        otherdev produces digital platforms for pioneering creatives. Based in
        Karachi City, we are a full-service web development and design studio
        specializing in the fashion and design fields.
      </p>
    </section>
  );
});
