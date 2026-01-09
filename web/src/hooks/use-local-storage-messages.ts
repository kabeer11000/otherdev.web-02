"use client";

import { useState, useEffect, useCallback } from "react";

interface UseLocalStorageMessagesProps<T> {
  key: string;
  initialValue?: T[];
  deserialize?: (data: string) => T[];
  serialize?: (data: T[]) => string;
  expirationMinutes?: number;
}

interface StoredData<T> {
  messages: T[];
  timestamp: number;
}

const DEFAULT_EXPIRATION_MINUTES = 5;

export function useLocalStorageMessages<T>({
  key,
  initialValue = [],
  deserialize,
  serialize,
  expirationMinutes = DEFAULT_EXPIRATION_MINUTES,
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

      const storedData: StoredData<T> = JSON.parse(item);
      const now = Date.now();
      const expirationMs = expirationMinutes * 60 * 1000;

      if (now - storedData.timestamp > expirationMs) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      if (deserialize) {
        return deserialize(JSON.stringify(storedData.messages));
      }

      return storedData.messages;
    } catch (error) {
      console.error(
        `Error loading messages from localStorage (${key}):`,
        error,
      );
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
      const storedData: StoredData<T> = {
        messages,
        timestamp: Date.now(),
      };

      const serializedMessages = serialize
        ? serialize(messages)
        : JSON.stringify(messages);
      const parsedMessages = JSON.parse(serializedMessages);

      const dataToStore: StoredData<unknown> = {
        messages: parsedMessages,
        timestamp: storedData.timestamp,
      };

      window.localStorage.setItem(key, JSON.stringify(dataToStore));
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
        console.error(
          `Error clearing messages from localStorage (${key}):`,
          error,
        );
      }
    }
  }, [key, initialValue]);

  return { messages, setMessages, clearHistory, isLoaded };
}
