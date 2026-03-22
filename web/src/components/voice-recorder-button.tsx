"use client";

import { Mic, Square } from "lucide-react";
import { useState } from "react";
import { VoiceRecorder } from "@/lib/voice-recorder";

interface VoiceRecorderButtonProps {
  onTranscript: (transcript: string) => void;
  onError: (error: string) => void;
  onRecordingChange?: (isRecording: boolean, stream?: MediaStream) => void;
  disabled?: boolean;
}

export function VoiceRecorderButton({
  onTranscript,
  onError,
  onRecordingChange,
  disabled = false,
}: VoiceRecorderButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recorder, setRecorder] = useState<VoiceRecorder | null>(null);

  const handleStartRecording = async () => {
    try {
      setIsProcessing(true);
      const stream = await VoiceRecorder.requestMicrophone();
      const newRecorder = new VoiceRecorder(stream);
      newRecorder.start();
      setRecorder(newRecorder);
      setIsRecording(true);
      setIsProcessing(false);
      onRecordingChange?.(true, stream);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to access microphone";
      onError(message);
      setIsProcessing(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recorder) return;

    try {
      setIsProcessing(true);
      const audioBlob = await recorder.stop();

      recorder.release();
      setRecorder(null);
      setIsRecording(false);
      onRecordingChange?.(false);

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let fullTranscript = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "transcript-chunk") {
              fullTranscript += parsed.content;
              onTranscript(fullTranscript);
            } else if (parsed.type === "transcript-complete") {
              fullTranscript = parsed.content;
              onTranscript(fullTranscript);
            }
          } catch {}
        }
      }

      setIsProcessing(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transcription error";
      onError(message);
      recorder.release();
      setRecorder(null);
      setIsRecording(false);
      onRecordingChange?.(false);
      setIsProcessing(false);
    }
  };

  const buttonClass = isRecording
    ? "bg-red-500 hover:bg-red-600 text-white"
    : "text-muted-foreground hover:opacity-70";

  return (
    <button
      type="button"
      onClick={isRecording ? handleStopRecording : handleStartRecording}
      disabled={disabled || isProcessing}
      className={`flex h-6 w-6 items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] disabled:opacity-50 sm:h-7 sm:w-7 rounded-full ${buttonClass}`}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      title={
        isRecording ? "Stop recording (click to send)" : "Record voice message"
      }
    >
      {isRecording ? (
        <Square className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
      ) : (
        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </button>
  );
}
