'use client';

import { useState, useRef, useEffect } from 'react';

export default function HeyGenTestPage() {
  const [avatarId, setAvatarId] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [contextId, setContextId] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [livekitUrl, setLivekitUrl] = useState('');
  const [livekitToken, setLivekitToken] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarInstanceRef = useRef<any>(null);

  const createSession = async () => {
    try {
      setStatus('creating-session');
      setError('');

      const response = await fetch('/api/heygen/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarId,
          voiceId,
          contextId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      console.log('Session created successfully:', data);
      console.log('Session token:', data.sessionToken);
      
      setSessionToken(data.sessionToken);
      setSessionId(data.sessionId);
      setStatus('session-created');
      
      return data.sessionToken;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setStatus('error');
      throw err;
    }
  };

  const startSession = async (token: string) => {
    try {
      setStatus('starting-session');
      setError('');

      console.log('Starting session with token:', token);
      console.log('Token type:', typeof token);
      console.log('Token length:', token?.length);

      const response = await fetch('/api/heygen/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start session');
      }

      const data = await response.json();
      setLivekitUrl(data.livekitUrl);
      setLivekitToken(data.livekitToken);
      setStatus('session-started');
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setStatus('error');
      throw err;
    }
  };

  const connectToAvatar = async () => {
    try {
      setStatus('connecting');
      setError('');

      // Create session
      const token = await createSession();
      
      // Start session
      const sessionData = await startSession(token);
      
      // Use the LiveAvatar Web SDK
      const { LiveAvatarSession } = await import('@heygen/liveavatar-web-sdk');
      
      // Create session with the token from create-session
      const avatar = new LiveAvatarSession(token);

      avatarInstanceRef.current = avatar;
      
      // Set up event listeners (using 'as any' to bypass strict typing)
      (avatar as any).on('connected', () => {
        console.log('Avatar connected!');
        setIsConnected(true);
        setStatus('connected');
        
        // Attach video element when connected
        if (videoRef.current) {
          avatar.attach(videoRef.current);
          console.log('Video element attached');
        }
      });

      (avatar as any).on('disconnected', (reason: any) => {
        console.log('Avatar disconnected:', reason);
        setIsConnected(false);
        setStatus('disconnected');
      });

      (avatar as any).on('error', (error: any) => {
        console.error('Avatar error:', error);
        setError(error?.message || 'Avatar connection error');
        setStatus('error');
      });

      (avatar as any).on('message', (msg: any) => {
        console.log('Avatar message:', msg);
      });
      
      // Start the session
      await avatar.start();
      console.log('Avatar session started');
      
    } catch (err) {
      console.error('Error connecting to avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to avatar');
      setStatus('error');
    }
  };

  const disconnectFromAvatar = async () => {
    if (avatarInstanceRef.current) {
      try {
        await avatarInstanceRef.current.stop();
        avatarInstanceRef.current = null;
        setIsConnected(false);
        setStatus('disconnected');
      } catch (err) {
        console.error('Error disconnecting:', err);
      }
    }
  };

  const sendMessage = (message: string) => {
    if (avatarInstanceRef.current && isConnected) {
      try {
        avatarInstanceRef.current.message(message);
        console.log('Message sent:', message);
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectFromAvatar();
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'creating-session':
      case 'starting-session':
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            HeyGen LiveAvatar Test Page
          </h1>
          <p className="text-blue-300">
            Test the HeyGen LiveAvatar integration before implementing it in the main project
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Avatar ID * (UUID)
                </label>
                <input
                  type="text"
                  value={avatarId}
                  onChange={(e) => setAvatarId(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 12345678-1234-1234-1234-123456789abc"
                  disabled={isConnected}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Voice ID *
                </label>
                <input
                  type="text"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter voice ID"
                  disabled={isConnected}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Context ID * (UUID)
                </label>
                <input
                  type="text"
                  value={contextId}
                  onChange={(e) => setContextId(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 87654321-4321-4321-4321-cba987654321"
                  disabled={isConnected}
                />
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
                <div>
                  <p className="text-sm font-medium text-white">Status</p>
                  <p className="text-xs text-gray-300">{status}</p>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Session Info */}
              {sessionId && (
                <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                  <p className="text-xs text-blue-200">
                    <span className="font-medium">Session ID:</span> {sessionId}
                  </p>
                </div>
              )}

              {/* Connect Button */}
              <button
                onClick={isConnected ? disconnectFromAvatar : connectToAvatar}
                disabled={!avatarId || !voiceId || !contextId || (status !== 'idle' && status !== 'disconnected' && status !== 'connected' && status !== 'error')}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  isConnected
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Connect to Avatar'}
              </button>

              {/* Test LiveKit URL */}
              {livekitUrl && livekitToken && (
                <div className="mt-4">
                  <a
                    href={`https://meet.livekit.io/custom?liveKitUrl=${encodeURIComponent(livekitUrl)}&token=${encodeURIComponent(livekitToken)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 px-4 text-center bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Open in LiveKit Test Page
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Video Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Live Avatar</h2>
            
            <div className="aspect-video bg-black/50 rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* Quick Test Messages */}
            {isConnected && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-200 mb-2">Quick Test Messages:</p>
                <button
                  onClick={() => sendMessage('Hello! How are you today?')}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                >
                  Say Hello
                </button>
                <button
                  onClick={() => sendMessage('Tell me about yourself.')}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                >
                  Tell me about yourself
                </button>
                <button
                  onClick={() => sendMessage('What can you help me with?')}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                >
                  What can you help with?
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Instructions</h3>
          <div className="space-y-3 text-blue-200">
            <p className="font-semibold text-white">How to Get Your IDs from HeyGen:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li><span className="font-medium">Avatar ID:</span> Go to HeyGen LiveAvatar dashboard → Copy your avatar's UUID</li>
              <li><span className="font-medium">Voice ID:</span> Find the voice identifier in your avatar settings</li>
              <li><span className="font-medium">Context ID:</span> Create a Knowledge Base in HeyGen → Copy its UUID (not the content!)</li>
            </ol>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-sm text-yellow-200 mb-2">
              <span className="font-medium">⚠️ Important:</span> All IDs must be in UUID format:
            </p>
            <code className="text-xs text-yellow-100 bg-black/30 px-2 py-1 rounded block">
              xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            </code>
          </div>
          
          <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <p className="text-sm text-blue-200">
              <span className="font-medium">💡 Tip:</span> For the Context/Knowledge Base, first create it in your HeyGen dashboard with the company information, then copy the UUID it generates (not the text content).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

