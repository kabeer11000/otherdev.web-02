/* eslint-disable qwik/valid-lexical-scope */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  component$,
  useSignal,
  type Signal,
  type PropFunction,
  $,
} from "@builder.io/qwik";
import { cn } from "~/lib/utils";
import { AttachmentChip } from "~/components/attachment-chip";

interface PromptInputProps {
  value: Signal<string>;
  onSubmit$: PropFunction<(text: string, files: File[]) => void>;
  isRecording: Signal<boolean>;
  isLoading: Signal<boolean>;
  attachments: Signal<File[]>;
  onAttach$: PropFunction<(files: File[]) => void>;
  onRemoveAttachment$: PropFunction<(index: number) => void>;
  onVoiceToggle$?: PropFunction<() => void>;
}

export const PromptInput = component$<PromptInputProps>((props) => {
  const textareaRef = useSignal<HTMLTextAreaElement | undefined>(undefined);
  const fileInputRef = useSignal<HTMLInputElement | undefined>(undefined);

  const isSendDisabled = props.isRecording.value || props.isLoading.value ||
    (props.value.value.trim().length === 0 && props.attachments.value.length === 0);

  const handleKeyDown = $((e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      props.onSubmit$(props.value.value, props.attachments.value);
    }
  });

  const handleFileChange = $((e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      props.onAttach$(files);
      input.value = "";
    }
  });

  return (
    <div class="relative rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* Attachment chips */}
      {props.attachments.value.length > 0 && (
        <div class="flex flex-wrap gap-2 p-3 pb-0">
          {props.attachments.value.map((file, index) => (
            <AttachmentChip
              key={`${file.name}-${index}`}
              file={file}
              onRemove$={() => props.onRemoveAttachment$(index)}
            />
          ))}
        </div>
      )}

      {/* Input row */}
      <div class="flex items-center gap-2 p-3">
        {/* Voice button */}
        {props.onVoiceToggle$ && (
          <button
            type="button"
            onClick$={props.onVoiceToggle$}
            disabled={props.isLoading.value}
            class={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] disabled:opacity-50 cursor-pointer",
              props.isRecording.value
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "text-muted-foreground hover:opacity-70 hover:bg-stone-100"
            )}
            aria-label={props.isRecording.value ? "Stop recording" : "Start recording"}
          >
            {props.isRecording.value ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        )}

        {/* Attachment button */}
        <button
          type="button"
          onClick$={() => fileInputRef.value?.click()}
          disabled={props.isLoading.value}
          class="flex h-7 w-7 items-center justify-center text-muted-foreground hover:opacity-70 hover:bg-stone-100 rounded-full transition-all disabled:opacity-50 cursor-pointer"
          aria-label="Attach file"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.js,.ts,.json,.py"
          onChange$={handleFileChange}
          class="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          placeholder="Type your message..."
          class={cn(
            "flex-1 bg-transparent border-none outline-none font-[var(--twk-lausanne)] text-sm text-stone-900 placeholder:text-stone-400 resize-none min-h-[24px] max-h-[120px] py-1"
          )}
          value={props.value.value}
          onInput$={(_, el) => {
            props.value.value = el.value;
            // Auto-grow
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
          onKeyDown$={handleKeyDown}
          rows={1}
          disabled={props.isLoading.value || props.isRecording.value}
        />

        {/* Send button */}
        <button
          type="button"
          onClick$={() => props.onSubmit$(props.value.value, props.attachments.value)}
          disabled={isSendDisabled}
          class={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98]",
            isSendDisabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-stone-900 hover:bg-stone-800 text-white cursor-pointer"
          )}
          aria-label="Send message"
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
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
});
