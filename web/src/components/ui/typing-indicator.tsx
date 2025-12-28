import { motion } from "framer-motion";
import Image from "next/image";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <Image
        src="/otherdev-chat-logo.svg"
        alt="OtherDev AI"
        width={16}
        height={16}
        className="mt-1 h-4 w-4 animate-pulse"
      />
      <div className="rounded-lg bg-muted p-3 text-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-muted-foreground/50"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
