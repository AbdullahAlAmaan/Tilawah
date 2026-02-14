"use client";

interface MicControlProps {
  status: "idle" | "recording" | "processing" | "error";
  elapsedMs: number;
  onStart: () => void;
  onStop: () => void;
}

export default function MicControl({ status, onStart, onStop }: MicControlProps) {
  const isRecording = status === "recording";
  const isProcessing = status === "processing";

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse ring when recording */}
      {isRecording && (
        <div className="absolute w-32 h-32 rounded-full bg-danger/20 animate-pulse-ring" />
      )}

      <button
        onClick={isRecording ? onStop : onStart}
        disabled={isProcessing}
        className={`
          relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all
          ${isProcessing ? "bg-muted/30 cursor-not-allowed" : ""}
          ${isRecording ? "bg-danger hover:bg-danger/80 shadow-lg shadow-danger/30" : ""}
          ${!isRecording && !isProcessing ? "bg-accent hover:bg-accent/80 shadow-lg shadow-accent/30 cursor-pointer" : ""}
        `}
      >
        {isRecording ? (
          /* Stop icon */
          <div className="w-8 h-8 bg-white rounded-sm" />
        ) : isProcessing ? (
          /* Spinner */
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          /* Mic icon */
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>

      {/* Waveform bars when recording */}
      {isRecording && (
        <div className="absolute bottom-0 translate-y-12 flex gap-1 items-end h-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 bg-danger/60 rounded-full animate-waveform"
              style={{
                animationDelay: `${i * 0.15}s`,
                height: "12px",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
