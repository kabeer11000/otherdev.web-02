"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useOtherDevRuntime } from "@/lib/use-otherdev-runtime";
import { OtherDevLoomThread } from "@/components/otherdev-loom-thread";
import { Navigation } from "@/components/navigation";

export default function AIPage() {
  const runtime = useOtherDevRuntime();

  return (
    <>
      <Navigation />
      <main className="h-screen pt-14 sm:pt-[60px]">
        <AssistantRuntimeProvider runtime={runtime}>
          <OtherDevLoomThread />
        </AssistantRuntimeProvider>
      </main>
    </>
  );
}
