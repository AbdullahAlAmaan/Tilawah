import { useState, useEffect, useRef, useCallback } from 'react';
import hark from 'hark';

export type ConversationState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

interface UseConversationProps {
    onAudioSubmit: (audioBlob: Blob) => Promise<{ audioUrl: string; feedback: string }>;
}

export function useConversation({ onAudioSubmit }: UseConversationProps) {
    const [state, setState] = useState<ConversationState>('IDLE');
    const [feedback, setFeedback] = useState<string>('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const speechEventsRef = useRef<any>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio & VAD
    const startSession = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Setup VAD
            const speechEvents = hark(stream, { interval: 100, threshold: -50 });
            speechEventsRef.current = speechEvents;

            speechEvents.on('speaking', () => {
                console.log('Speaking...');
            });

            speechEvents.on('stopped_speaking', () => {
                console.log('Stopped speaking. Processing...');
                stopRecording();
            });

            startRecording();
            setState('LISTENING');

        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    };

    const startRecording = () => {
        if (!streamRef.current) return;

        audioChunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            if (state === 'SPEAKING') return; // Ignore if we are already speaking

            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

            // Only process if audio is long enough (avoid short noise glitches)
            if (audioBlob.size < 3000) {
                console.log("Audio too specific/short, ignoring...");
                // Resume listening if it was just a glitch
                if (state !== 'IDLE') startRecording();
                return;
            }

            setState('THINKING');

            try {
                const result = await onAudioSubmit(audioBlob);
                setFeedback(result.feedback);
                setAudioUrl(result.audioUrl);
                playResponse(result.audioUrl);
            } catch (error) {
                console.error("Submission failed:", error);
                setState('LISTENING'); // Fallback to listening
                startRecording();
            }
        };

        recorder.start();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const playResponse = (url: string) => {
        setState('SPEAKING');

        // Suspend VAD during playback so it doesn't hear itself
        if (speechEventsRef.current) speechEventsRef.current.suspend();

        if (audioPlayerRef.current) {
            audioPlayerRef.current.src = url;
            audioPlayerRef.current.play();
            audioPlayerRef.current.onended = () => {
                // Resume Listening
                setState('LISTENING');
                if (speechEventsRef.current) speechEventsRef.current.resume();
                startRecording();
            };
        }
    };

    // Cleanup
    useEffect(() => {
        audioPlayerRef.current = new Audio();
        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, []);

    return {
        state,
        feedback,
        audioUrl,
        startSession
    };
}
