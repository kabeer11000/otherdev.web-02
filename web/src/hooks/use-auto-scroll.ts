"use client";

import { useEffect, useRef, useState } from "react";

export function useAutoScroll(dependencies: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const userScrolledRef = useRef(false);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setShouldAutoScroll(true);
      userScrolledRef.current = false;
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (!isAtBottom && !userScrolledRef.current) {
      userScrolledRef.current = true;
    }

    setShouldAutoScroll(isAtBottom);
  };

  const handleTouchStart = () => {
    userScrolledRef.current = true;
  };

  useEffect(() => {
    if (shouldAutoScroll && !userScrolledRef.current) {
      scrollToBottom();
    }
  }, dependencies);

  return {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  };
}
