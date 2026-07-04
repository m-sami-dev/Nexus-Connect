import React, { useEffect, useRef, useState } from 'react';

interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

interface WebRTCMessage {
  type: string;
  [key: string]: any;
}

export const VideoCall: React.FC<{ roomName: string; targetUserId?: number }> = ({
  roomName,
  targetUserId,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<string>('idle'); // idle, calling, connected, ended
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const config = {
    iceServers: [
      { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    ],
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/video/${roomName}/`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setSocket(ws);
      setError(null);
    };

    ws.onmessage = async (event) => {
      const data: WebRTCMessage = JSON.parse(event.data);
      console.log('Received message:', data.type);

      switch (data.type) {
        case 'user_joined':
          handleUserJoined(data);
          break;
        case 'user_left':
          handleUserLeft(data);
          break;
        case 'incoming_call':
          handleIncomingCall(data);
          break;
        case 'call_response':
          handleCallResponse(data);
          break;
        case 'offer':
          await handleReceiveOffer(data);
          break;
        case 'answer':
          await handleReceiveAnswer(data);
          break;
        case 'ice_candidate':
          await handleReceiveIceCandidate(data);
          break;
        case 'call_ended':
          handleCallEnded(data);
          break;
        case 'error':
          setError(data.message);
          break;
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomName]);

  // Get local media stream
  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setError(null);
      return stream;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get media devices';
      setError(`Camera/Microphone error: ${errMsg}`);
      console.error('Media error:', err);
    }
  };

  // Create RTCPeerConnection
  const createPeerConnection = async (stream: MediaStream) => {
    const peerConnection = new RTCPeerConnection(config);
    peerConnectionRef.current = peerConnection;

    // Add local stream tracks
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      setRemoteStream(event.streams[0]);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.send(
          JSON.stringify({
            type: 'ice_candidate',
            target_user_id: targetUserId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
            },
          })
        );
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);

      if (peerConnection.connectionState === 'connected') {
        setCallStatus('connected');
      } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        setCallStatus('ended');
        endCall();
      }
    };

    return peerConnection;
  };

  // Make a call
  const startCall = async (targetId: number) => {
    if (!socket) {
      setError('WebSocket not connected');
      return;
    }

    try {
      const stream = await initializeLocalStream();
      if (!stream) return;

      const peerConnection = await createPeerConnection(stream);

      // Send call request
      socket.send(
        JSON.stringify({
          type: 'call_request',
          target_user_id: targetId,
        })
      );

      setCallStatus('calling');
      setError(null);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to start call';
      setError(errMsg);
      console.error('Start call error:', err);
    }
  };

  // Handle incoming call
  const handleIncomingCall = async (data: WebRTCMessage) => {
    const confirmed = window.confirm(`${data.from_username} is calling. Accept?`);

    if (confirmed) {
      acceptCall(data.from_user_id);
    } else {
      rejectCall(data.from_user_id);
    }
  };

  // Accept incoming call
  const acceptCall = async (callerId: number) => {
    if (!socket) return;

    try {
      const stream = await initializeLocalStream();
      if (!stream) return;

      const peerConnection = await createPeerConnection(stream);

      socket.send(
        JSON.stringify({
          type: 'call_response',
          target_user_id: callerId,
          accepted: true,
        })
      );

      setCallStatus('connected');
      setError(null);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to accept call';
      setError(errMsg);
      console.error('Accept call error:', err);
    }
  };

  // Reject incoming call
  const rejectCall = (callerId: number) => {
    socket?.send(
      JSON.stringify({
        type: 'call_response',
        target_user_id: callerId,
        accepted: false,
      })
    );
  };

  // Handle call response
  const handleCallResponse = async (data: WebRTCMessage) => {
    if (!data.accepted) {
      setCallStatus('ended');
      setError('Call rejected');
      endCall();
      return;
    }

    // Create and send offer
    if (peerConnectionRef.current) {
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        socket?.send(
          JSON.stringify({
            type: 'offer',
            target_user_id: data.from_user_id,
            sdp: offer,
          })
        );
      } catch (err) {
        console.error('Offer creation error:', err);
        setError('Failed to create offer');
      }
    }
  };

  // Handle received offer
  const handleReceiveOffer = async (data: WebRTCMessage) => {
    if (!peerConnectionRef.current) {
      const stream = await initializeLocalStream();
      if (stream) {
        await createPeerConnection(stream);
      }
    }

    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket?.send(
          JSON.stringify({
            type: 'answer',
            target_user_id: data.from_user_id,
            sdp: answer,
          })
        );
      } catch (err) {
        console.error('Offer handling error:', err);
        setError('Failed to handle offer');
      }
    }
  };

  // Handle received answer
  const handleReceiveAnswer = async (data: WebRTCMessage) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (err) {
        console.error('Answer handling error:', err);
        setError('Failed to handle answer');
      }
    }
  };

  // Handle received ICE candidate
  const handleReceiveIceCandidate = async (data: WebRTCMessage) => {
    if (peerConnectionRef.current && data.candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('ICE candidate error:', err);
      }
    }
  };

  // Handle call ended
  const handleCallEnded = (data: WebRTCMessage) => {
    setCallStatus('ended');
    endCall();
  };

  // Handle user joined
  const handleUserJoined = (data: WebRTCMessage) => {
    setUsers((prev) => [...prev, { id: data.user_id, username: data.username }]);
  };

  // Handle user left
  const handleUserLeft = (data: WebRTCMessage) => {
    setUsers((prev) => prev.filter((u) => u.id !== data.user_id));

    if (data.user_id === targetUserId) {
      endCall();
    }
  };

  // End the call
  const endCall = () => {
    if (socket && targetUserId) {
      socket.send(
        JSON.stringify({
          type: 'call_end',
          target_user_id: targetUserId,
        })
      );
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setRemoteStream(null);
    setCallStatus('idle');
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [localStream]);

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold">Video Call - {roomName}</h1>
        <div className="text-sm text-gray-400 mt-1">Status: {callStatus.toUpperCase()}</div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 text-red-100 p-4 border-b border-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Local Video */}
        <div className="flex-1 bg-gray-950 rounded-lg overflow-hidden border border-gray-700 relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 text-sm bg-black bg-opacity-70 p-2 rounded">
            You (Local)
          </div>
        </div>

        {/* Remote Video */}
        {remoteStream && (
          <div className="flex-1 bg-gray-950 rounded-lg overflow-hidden border border-gray-700 relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 text-sm bg-black bg-opacity-70 p-2 rounded">
              Remote User
            </div>
          </div>
        )}
      </div>

      {/* Users List */}
      {users.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-700 p-4">
          <div className="text-sm font-semibold mb-2">Users in Room:</div>
          <div className="flex gap-2 flex-wrap">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => startCall(user.id)}
                disabled={callStatus !== 'idle'}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
              >
                {user.username}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 flex gap-4 justify-center">
        {callStatus === 'idle' && (
          <button
            onClick={() => initializeLocalStream()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold"
          >
            Enable Camera
          </button>
        )}

        {callStatus !== 'idle' && (
          <button
            onClick={endCall}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
          >
            End Call
          </button>
        )}

        {localStream && (
          <button
            onClick={() => {
              localStream.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
              });
            }}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-semibold"
          >
            Toggle Mic
          </button>
        )}
      </div>
    </div>
  );
};