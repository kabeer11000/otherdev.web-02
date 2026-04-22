import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

interface VoiceWaveformProps {
  isRecording: boolean;
}

export const VoiceWaveform = component$<VoiceWaveformProps>((props) => {
  const bars = useSignal<number[]>(Array(20).fill(0.1));
  const analyserRef = useSignal<AnalyserNode | null>(null);
  const animationRef = useSignal<number | null>(null);

  useVisibleTask$(({ track, cleanup }) => {
    track(() => props.isRecording);

    if (!props.isRecording) {
      bars.value = Array(20).fill(0.1);
      if (animationRef.value !== null) {
        cancelAnimationFrame(animationRef.value);
        animationRef.value = null;
      }
      return;
    }

    // Create audio context and analyser when recording starts
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.value = analyser;

      // Get the microphone stream
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        audioContext.createMediaStreamSource(stream).connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateBars = () => {
          analyser.getByteFrequencyData(dataArray);
          const normalized = Array.from(dataArray.slice(0, 20)).map(
            (v) => Math.max(v / 128, 0.1)
          );
          bars.value = normalized;
          animationRef.value = requestAnimationFrame(updateBars);
        };

        animationRef.value = requestAnimationFrame(updateBars);
      });
    } catch {
      // Audio context creation failed
    }

    cleanup(() => {
      if (animationRef.value !== null) {
        cancelAnimationFrame(animationRef.value);
      }
    });
  });

  return (
    <div class="flex items-center justify-center gap-0.5 h-10 px-2 w-full">
      {bars.value.map((height, i) => (
        <div
          key={i}
          class="w-1 bg-red-500 rounded-full transition-all duration-75 ease-linear"
          style={{
            height: `${Math.max(height * 32, 4)}px`,
          }}
        />
      ))}
    </div>
  );
});
