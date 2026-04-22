import { component$ } from "@builder.io/qwik";
import { AttachmentChip } from "~/components/attachment-chip";
import ImgLoomAvatar64 from "~/media/loom-avatar-64.webp?jsx";

interface UserMessageProps {
  content: string;
  attachments?: File[];
}

export const UserMessage = component$<UserMessageProps>((props) => {
  return (
    <div class="flex justify-end items-end gap-2">
      <div class="max-w-[95%] gap-2 sm:max-w-[85%] sm:gap-3 md:max-w-[80%] flex flex-col">
        <div class="flex flex-col gap-2">
          {props.attachments && props.attachments.length > 0 && (
            <div class="flex flex-wrap gap-2 justify-end">
              {props.attachments.map((file, i) => (
                <AttachmentChip key={`${file.name}-${i}`} file={file} />
              ))}
            </div>
          )}
          {props.content.trim() && (
            <div class="rounded-2xl bg-stone-900 px-3 py-2 text-sm text-white sm:px-4 sm:py-3 sm:text-base rounded-tr-none">
              <p class="font-[var(--twk-lausanne)] whitespace-pre-wrap">{props.content}</p>
            </div>
          )}
        </div>
      </div>
      <ImgLoomAvatar64
        alt="User"
        width={32}
        height={32}
        class="h-7 w-7 flex-shrink-0 rounded-full sm:h-8 sm:w-8 object-contain"
      />
    </div>
  );
});
