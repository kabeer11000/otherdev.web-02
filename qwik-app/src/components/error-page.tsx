import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

const ErrorPage = component$(() => {
  return (
    <div class="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div class="flex flex-col items-center justify-center px-4 py-8 text-center">
        <h2 class="mb-6 text-5xl font-semibold font-[var(--queens-compressed)] text-stone-900">
          Whoops!
        </h2>
        <h3 class="mb-1.5 text-3xl font-semibold font-[var(--queens-compressed)] text-stone-900">
          Something went wrong
        </h3>
        <p class="text-stone-500 mb-6 max-w-sm font-[var(--twk-lausanne)]">
          The page you&apos;re looking for isn&apos;t found, we suggest you back to home.
        </p>
        <Link
          href="/"
          class="rounded-lg bg-stone-900 px-6 py-3 text-base font-medium text-white hover:bg-stone-800 transition-colors"
        >
          Back to home page
        </Link>
      </div>

      {/* Right Section: Illustration */}
      <div class="relative flex h-[400px] max-h-screen w-full p-2 lg:h-full">
        <div class="h-full w-full rounded-2xl bg-black" />
        <img
          src="https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/error/image-1.png"
          alt="404 illustration"
          class="absolute top-1/2 left-1/2 h-[clamp(200px,40vw,406px)] -translate-x-1/2 -translate-y-1/2 lg:h-[clamp(260px,25vw,406px)]"
          width={406}
          height={406}
        />
      </div>
    </div>
  );
});

export default ErrorPage;