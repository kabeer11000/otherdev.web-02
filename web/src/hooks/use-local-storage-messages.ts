"use client";

import { useState, useEffect, useCallback } from "react";

interface UseLocalStorageMessagesProps<T> {
  key: string;
  initialValue?: T[];
  deserialize?: (data: string) => T[];
  serialize?: (data: T[]) => string;
}

export function useLocalStorageMessages<T>({
  key,
  initialValue = [],
  deserialize,
  serialize,
}: UseLocalStorageMessagesProps<T>) {
  const [messages, setMessages] = useState<T[]>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }

      if (deserialize) {
        return deserialize(item);
      }

      return JSON.parse(item) as T[];
    } catch (error) {
      console.error(`Error loading messages from localStorage (${key}):`, error);
      return initialValue;
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") {
      return;
    }

    try {
      const serialized = serialize ? serialize(messages) : JSON.stringify(messages);
      window.localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving messages to localStorage (${key}):`, error);
    }
  }, [key, messages, isLoaded, serialize]);

  const clearHistory = useCallback(() => {
    setMessages(initialValue);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error clearing messages from localStorage (${key}):`, error);
      }
    }
  }, [key, initialValue]);

  return { messages, setMessages, clearHistory, isLoaded };
}
