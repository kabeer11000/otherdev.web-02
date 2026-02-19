"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface DownloadButtonProps {
  href: string;
}

export function DownloadButton({ href }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  return (
    <Link
      href={href}
      download
      onClick={handleClick}
      className="inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[32px] px-[16px] items-center mb-[64px] gap-2"
    >
      {isDownloading ? (
        <Spinner className="w-[14px] h-[14px] text-[#686868]" />
      ) : (
        <Download className="w-[14px] h-[14px] text-[#686868]" />
      )}
      <span className="text-[13px] leading-[16px] tracking-[-0.24px] font-normal text-[#686868]">
        {isDownloading ? "Downloading..." : "Download Full Issue"}
      </span>
    </Link>
  );
}
