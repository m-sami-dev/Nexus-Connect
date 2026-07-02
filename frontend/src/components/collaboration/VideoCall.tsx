import React, { useEffect, useRef } from 'react';

export const VideoCall = ({ roomName }: { roomName: string }) => {
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Backend ke WebSocket endpoint se connect karein
    socket.current = new WebSocket(`ws://127.0.0.1:8000/ws/video/${roomName}/`);

    socket.current.onopen = () => console.log("Connected to Video Room!");
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message received:", data);
      // Yahan WebRTC signaling ka logic aayega (Offer/Answer/Candidate)
    };

    return () => socket.current?.close();
  }, [roomName]);

  return (
    <div>
      <h3>Video Room: {roomName}</h3>
      {/* Yahan <video> tags aayenge */}
    </div>
  );
};