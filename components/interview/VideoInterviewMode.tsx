'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/button';

export default function VideoInterviewMode({ topic }: { topic: string }) {
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start listening when component mounts and not speaking
  useEffect(() => {
    if (isSupported && !isSpeaking && !isListening) {
      startListening();
    }
  }, [isSupported, isSpeaking, isListening, startListening]);

  // When user stops speaking (isListening changes from true to false), process transcript
  useEffect(() => {
    if (!isListening && transcript.trim() !== '') {
      // Stop listening to avoid overlap
      stopListening();
      processUserSpeech(transcript.trim());
      resetTranscript();
    }
  }, [isListening, transcript, stopListening, resetTranscript]);

  // Play video when videoUrl changes
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      setIsSpeaking(true);
      videoRef.current.play();
    }
  }, [videoUrl]);

  // When video ends, start listening again
  const handleVideoEnded = () => {
    setIsSpeaking(false);
    setVideoUrl(null);
    startListening();
  };

  // Process user speech by sending to chat API and then send AI response to Tavus TTS API
  const processUserSpeech = async (userText: string) => {
    setError(null);
    try {
      // Send user transcript to chat API
      const chatResponse = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          history: [
            { id: 'user-temp', content: userText, sender: 'user', timestamp: new Date() }
          ],
          currentQuestionIndex: 0 // For simplicity, can be improved to track question index
        })
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      const chatData = await chatResponse.json();
      const aiText = chatData.aiResponse;

      setAiResponse(aiText);

      // Send AI response text to Tavus TTS API
      const ttsResponse = await fetch('/api/tavus/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText })
      });

      if (!ttsResponse.ok) {
        throw new Error('Failed to generate speech from Tavus');
      }

      const ttsData = await ttsResponse.json();
      if (!ttsData.videoUrl) {
        throw new Error('No video URL returned from Tavus');
      }

      setVideoUrl(ttsData.videoUrl);

    } catch (err: any) {
      setError(err.message || 'Unknown error');
      // Restart listening on error
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-900 rounded-lg text-white">
      <div className="mb-4 w-96 h-96 bg-black rounded-lg overflow-hidden shadow-lg">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls={false}
            autoPlay
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold select-none text-purple-500">
            Charlie
          </div>
        )}
      </div>

      <div className="mb-4">
        {isSpeaking ? (
          <p className="text-green-400">Replica is speaking...</p>
        ) : isListening ? (
          <p className="text-blue-400">Listening to you...</p>
        ) : (
          <p className="text-yellow-400">Waiting for your response...</p>
        )}
      </div>

      <div className="mb-4 max-w-xl text-center">
        <p className="italic">{aiResponse}</p>
      </div>

      {error && (
        <div className="mb-4 text-red-500">
          <p>Error: {error}</p>
        </div>
      )}

      <div>
        <Button onClick={() => {
          if (isListening) {
            stopListening();
          } else {
            startListening();
          }
        }}>
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </Button>
      </div>
    </div>
  );
}
