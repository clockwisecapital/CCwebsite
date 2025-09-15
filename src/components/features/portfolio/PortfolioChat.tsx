'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  timestamp: Date;
  displaySpec?: DisplaySpec;
  sessionInfo?: SessionInfo;
}

interface DisplaySpec {
  blocks: DisplayBlock[];
  meta?: {
    timestamp?: string;
    sources_count?: number;
    cost_estimate?: number;
    version?: string;
  };
}

interface DisplayBlock {
  type: 'summary_bullets' | 'stat_group' | 'table' | 'chart' | 'sources' | 'cta_group';
  content: string;
}

interface SessionInfo {
  id: string;
  stage: 'qualify' | 'goals' | 'portfolio' | 'analyze' | 'explain' | 'cta' | 'end';
  completed_slots: string[];
  missing_slots: string[];
  key_facts: string[];
}

interface PortfolioChatProps {
  mode?: 'unified';
}

export function PortfolioChat({}: PortfolioChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    id: '',
    stage: 'qualify',
    completed_slots: [],
    missing_slots: [],
    key_facts: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize FSM conversation when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeFSMConversation();
    }
  }, [isOpen]);

  const initializeFSMConversation = async () => {
    setIsLoading(true);
    try {
      // Send initial request to FSM to get qualify stage
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'start', // Trigger the qualify stage
          sessionId: sessionId,
          conversationHistory: []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize FSM conversation');
      }

      const data = await response.json();
      
      // Update session info
      if (data.session) {
        setSessionInfo(data.session);
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        displaySpec: data.displaySpec,
        sessionInfo: data.session,
        timestamp: new Date(),
      };

      setMessages([assistantMessage]);
    } catch (error) {
      console.error('Error initializing FSM conversation:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        displaySpec: {
          blocks: [
            {
              type: 'summary_bullets',
              content: JSON.stringify(['Welcome to Clockwise Capital! I apologize, but I encountered an error initializing our conversation. Please try refreshing or contact support if the issue persists.'])
            }
          ]
        },
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      await handleFSMResponse(userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        displaySpec: {
          blocks: [
            {
              type: 'summary_bullets',
              content: JSON.stringify(['I apologize, but I encountered an error. Please try again or contact support if the issue persists.'])
            }
          ]
        },
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFSMResponse = async (userMessage: Message) => {
    // Use the new FSM chat endpoint
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage.content,
        sessionId: sessionId,
        conversationHistory: messages
          .filter(m => m.content) // Only include messages with content
          .slice(-6) // Last 6 messages for context
          .map(m => ({
            role: m.role,
            content: m.content || ''
          }))
      }),
    });

    if (!response.ok) {
      throw new Error('Chat request failed');
    }

    const data = await response.json();
    
    // Update session info
    if (data.session) {
      setSessionInfo(data.session);
    }
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      displaySpec: data.displaySpec,
      sessionInfo: data.session,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  // DisplaySpec renderer component
  const renderDisplaySpec = (displaySpec: DisplaySpec) => {
    return (
      <div className="space-y-3">
        {displaySpec.blocks.map((block, index) => {
          let content;
          try {
            content = JSON.parse(block.content || '[]');
          } catch {
            content = [];
          }

          return (
            <div key={index}>
              {block.type === 'summary_bullets' && (
                <ul className="space-y-1">
                  {content.map((item: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1 text-xs">•</span>
                      <span className="text-xs">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {block.type === 'stat_group' && (
                <div className="grid grid-cols-2 gap-2">
                  {content.map((stat: { label: string; value: string | number; unit?: string; asOf?: string }, i: number) => (
                    <div key={i} className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">{stat.label}</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {stat.value}{stat.unit && ` ${stat.unit}`}
                      </div>
                      {stat.asOf && <div className="text-xs text-gray-400">as of {stat.asOf}</div>}
                    </div>
                  ))}
                </div>
              )}
              
              {block.type === 'cta_group' && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {content.map((button: { label: string; action: string; payload?: unknown }, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleCTAClick(button.action, button.payload)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              )}
              
              {block.type === 'sources' && (
                <div className="bg-gray-50 p-2 rounded">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Sources:</h4>
                  <ul className="space-y-1">
                    {content.map((source: { title: string; url: string; publisher?: string; asOf?: string }, i: number) => (
                      <li key={i} className="text-xs text-gray-500">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                          {source.publisher}: {source.title}
                        </a>
                        {source.asOf && ` (${source.asOf})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleCTAClick = (action: string, payload?: unknown) => {
    switch (action) {
      case 'start_analysis':
      case 'view_summary':
      case 'looks_good':
        // Continue conversation
        sendMessage();
        break;
      case 'restart':
        // Reset session and reinitialize FSM
        setMessages([]);
        setSessionInfo({
          id: '',
          stage: 'qualify',
          completed_slots: [],
          missing_slots: [],
          key_facts: []
        });
        // Reinitialize the FSM conversation
        initializeFSMConversation();
        break;
      case 'schedule_consultation':
        window.open('/contact', '_blank');
        break;
      default:
        console.log('CTA clicked:', action, payload);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="w-96 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-medium">Portfolio AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-blue-500 px-2 py-1 rounded">
            Stage: {sessionInfo.stage}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content && (
                <p className="text-sm">{message.content}</p>
              )}
              {message.displaySpec && (
                <div className="text-sm">
                  {renderDisplaySpec(message.displaySpec)}
                </div>
              )}
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.sessionInfo && (
                  <span className="ml-2">
                    Stage: {message.sessionInfo.stage}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your portfolio..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
