// This file can be used to add references for global types like `vite/client`.

// Add global `vite/client` types. For more info, see: https://vitejs.dev/guide/features#client-types
/// <reference types="vite/client" />

// Type declarations for ?jsx image imports
declare module "*.webp?jsx" {
  import type { ComponentType } from "@builder.io/qwik";
  const Img: ComponentType<{
    alt?: string;
    width?: number;
    height?: number;
    class?: string;
    loading?: "lazy" | "eager";
    priority?: boolean;
  }>;
  export default Img;
}

declare module "*.png?jsx" {
  import type { ComponentType } from "@builder.io/qwik";
  const Img: ComponentType<{
    alt?: string;
    width?: number;
    height?: number;
    class?: string;
    loading?: "lazy" | "eager";
    priority?: boolean;
  }>;
  export default Img;
}
