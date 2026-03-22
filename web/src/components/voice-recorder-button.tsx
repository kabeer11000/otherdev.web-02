"use client";

import { Mic, Square } from "lucide-react";
import { useRef, useState } from "react";

interface VoiceRecorderButtonProps {
  onTranscript: (transcript: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function VoiceRecorderButton({
  onTranscript,
  onError,
  disabled = false,
}: VoiceRecorderButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  const handleStartRecording = () => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition ??
      (
        window as Window &
          typeof globalThis & {
            webkitSpeechRecognition: typeof SpeechRecognition;
          }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      onError("Speech recognition is not supported in this browser");
      return;
    }

    finalTranscriptRef.current = "";

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript;
        } else {
          interim += transcript;
        }
      }

      onTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        onError(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const buttonClass = isRecording
    ? "bg-red-500 hover:bg-red-600 text-white"
    : "text-muted-foreground hover:opacity-70";

  return (
    <button
      type="button"
      onClick={isRecording ? handleStopRecording : handleStartRecording}
      disabled={disabled}
      className={`flex h-6 w-6 items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] disabled:opacity-50 sm:h-7 sm:w-7 rounded-full ${buttonClass}`}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      title={isRecording ? "Stop recording" : "Record voice message"}
    >
      {isRecording ? (
        <Square className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
      ) : (
        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </button>
  );
}
