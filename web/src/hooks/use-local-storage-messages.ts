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

const DEFAULT_EXPIRATION_MINUTES = 60;

export function useLocalStorageMessages<T>({
  key,
  initialValue = [],
  deserialize,
  serialize,
  expirationMinutes = DEFAULT_EXPIRATION_MINUTES,
}: UseLocalStorageMessagesProps<T>) {
  const [messages, setMessages] = useState<T[]>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage after hydration to avoid SSR/client mismatch
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const storedData: StoredData<T> = JSON.parse(item);
        const now = Date.now();
        const expirationMs = expirationMinutes * 60 * 1000;

        if (now - storedData.timestamp > expirationMs) {
          window.localStorage.removeItem(key);
        } else {
          const loaded = deserialize
            ? deserialize(JSON.stringify(storedData.messages))
            : storedData.messages;
          setMessages(loaded);
        }
      }
    } catch (error) {
      console.error(`Error loading messages from localStorage (${key}):`, error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      // serialize produces a JSON string of the storable shape (e.g. with ISO date strings).
      // Parse it back so the StoredData wrapper holds the same shape deserialization expects.
      const serialized = serialize ? serialize(messages) : JSON.stringify(messages);
      const dataToStore: StoredData<unknown> = {
        messages: JSON.parse(serialized),
        timestamp: Date.now(),
      };
      window.localStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.error(`Error saving messages to localStorage (${key}):`, error);
    }
  }, [key, messages, isLoaded, serialize]);

  const clearHistory = useCallback(() => {
    setMessages(initialValue);
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing messages from localStorage (${key}):`, error);
    }
  }, [key, initialValue]);

  return { messages, setMessages, clearHistory, isLoaded };
}
