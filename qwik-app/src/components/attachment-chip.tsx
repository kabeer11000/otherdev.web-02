import { component$, useSignal, useVisibleTask$, type PropFunction } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

interface AttachmentChipProps {
  file: File;
  onRemove$?: PropFunction<() => void>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="shrink-0 opacity-70"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export const AttachmentChip = component$<AttachmentChipProps>((props) => {
  const previewUrl = useSignal<string | null>(null);
  // Extract serializable data from file props
  const fileName = props.file.name;
  const fileSize = props.file.size;
  const fileType = props.file.type;
  const isImage = fileType.startsWith("image/");

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => fileType);
    if (!isImage) return;

    // Create blob from file for URL creation
    const blob = props.file;
    const url = URL.createObjectURL(blob);
    previewUrl.value = url;

    cleanup(() => {
      if (url) URL.revokeObjectURL(url);
    });
  });

  return (
    <div class="relative flex group items-center gap-1.5 border rounded-t-xl pb-4 mb-[-10px] bg-accent px-2 py-1.5 text-xs text-accent-foreground">
      {isImage && previewUrl.value ? (
        <div class="relative h-12 w-12 rounded-lg overflow-hidden bg-background shrink-0">
          <img
            src={previewUrl.value}
            alt={fileName}
            class="h-full w-full object-contain"
          />
        </div>
      ) : (
        <span class="h-6 w-6 shrink-0"><FileIcon /></span>
      )}
      <div class="flex flex-col min-w-0 flex-1">
        <span class="truncate max-w-[180px]">{fileName}</span>
        <span class="text-muted-foreground text-[10px]">
          {formatFileSize(fileSize)}
        </span>
      </div>
      {props.onRemove$ && (
        <button
          type="button"
          onClick$={props.onRemove$}
          class={cn(
            "ml-0.5 flex h-8 w-8 ml-auto items-center justify-center rounded-full hover:bg-foreground/10 cursor-pointer shrink-0"
          )}
          aria-label="Remove attachment"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
});
