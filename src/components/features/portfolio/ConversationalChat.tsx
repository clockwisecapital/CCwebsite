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
  type: 'summary_bullets' | 'stat_group' | 'table' | 'chart' | 'sources' | 'cta_group' | 'conversation_text';
  content: string;
}

interface SessionInfo {
  id: string;
  stage: 'qualify' | 'goals' | 'portfolio' | 'analyze' | 'explain' | 'cta' | 'end';
  completed_slots: string[];
  missing_slots: string[];
  key_facts: string[];
}

interface ConversationalChatProps {
  mode?: 'unified';
}

export function ConversationalChat({}: ConversationalChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI portfolio advisor from Clockwise Capital. I'll help you evaluate your investment portfolio and guide you through our systematic analysis process.

Would you like to get started with your portfolio analysis?`,
      timestamp: new Date(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
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
    console.log('handleFSMResponse called with userMessage:', userMessage);
    console.log('userMessage.content:', userMessage.content);
    
    // Use the new FSM chat endpoint
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage.content || '',
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
    console.log('Frontend received data:', data);
    console.log('DisplaySpec:', data.displaySpec);
    
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

    console.log('Creating assistant message:', assistantMessage);
    setMessages(prev => [...prev, assistantMessage]);
  };

  // DisplaySpec renderer component
  const renderDisplaySpec = (displaySpec: DisplaySpec) => {
    console.log('Rendering DisplaySpec:', displaySpec);
    console.log('Number of blocks:', displaySpec?.blocks?.length);
    
    if (!displaySpec || !displaySpec.blocks) {
      console.log('No displaySpec or blocks found');
      return <div>No content to display</div>;
    }
    
    return (
      <div className="space-y-4">
        {displaySpec.blocks.map((block, index) => {
          console.log(`Rendering block ${index}:`, block);
          let content;
          
          // Handle both JSON-stringified and plain string content
          if (block.type === 'summary_bullets') {
            try {
              content = JSON.parse(block.content || '[]');
            } catch {
              // If not JSON, treat as single bullet point
              content = [block.content || ''];
            }
          } else if (block.type === 'cta_group') {
            try {
              content = JSON.parse(block.content || '[]');
            } catch {
              // If not JSON, create single button from string
              const buttonText = block.content || 'Continue';
              let action = 'continue';
              
              // Map button text to appropriate actions
              if (buttonText.toLowerCase().includes('start') || buttonText.toLowerCase().includes('analysis')) {
                action = 'start_analysis';
              } else if (buttonText.toLowerCase().includes('looks good')) {
                action = 'looks_good';
              }
              
              content = [{
                label: buttonText,
                action: action
              }];
            }
          } else {
            try {
              content = JSON.parse(block.content || '[]');
            } catch {
              content = [];
            }
          }
          
          console.log(`Processed content for block ${index}:`, content);

          return (
            <div key={index}>
              {block.type === 'summary_bullets' && (
                <ul className="space-y-2">
                  {content.map((item: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {block.type === 'stat_group' && (
                <div className="grid grid-cols-2 gap-4">
                  {content.map((stat: any, i: number) => (
                    <div key={i} className="bg-slate-700 p-3 rounded-lg">
                      <div className="text-xs text-slate-400">{stat.label}</div>
                      <div className="text-lg font-semibold text-white">
                        {stat.value}{stat.unit && ` ${stat.unit}`}
                      </div>
                      {stat.asOf && <div className="text-xs text-slate-500">as of {stat.asOf}</div>}
                    </div>
                  ))}
                </div>
              )}
              
              {block.type === 'table' && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  {content.title && (
                    <div className="px-4 py-3 border-b border-slate-700">
                      <h4 className="text-sm font-medium text-white">{content.title}</h4>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700">
                        <tr>
                          {content.columns?.map((column: string, i: number) => (
                            <th key={i} className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {content.rows?.map((row: string[], i: number) => (
                          <tr key={i} className="hover:bg-slate-750">
                            {row.map((cell: string, j: number) => (
                              <td key={j} className="px-4 py-3 text-sm text-white">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {block.type === 'cta_group' && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {content.map((button: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleCTAClick(button.action, button)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              )}
              
              {block.type === 'conversation_text' && (
                <div className="text-sm leading-relaxed">
                  {content.map((text: string, i: number) => (
                    <p key={i} className="mb-2">{text}</p>
                  ))}
                </div>
              )}
              
              {block.type === 'sources' && (
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Sources:</h4>
                  <ul className="space-y-1">
                    {content.map((source: any, i: number) => (
                      <li key={i} className="text-xs text-slate-400">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
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

  const handleCTAClick = async (action: string, button?: any) => {
    console.log('CTA clicked:', action, button);
    
    // Handle special actions that don't require chat messages
    if (action === 'external_link' && button?.url) {
      // Open external link in new tab
      window.open(button.url, '_blank');
      return;
    }
    
    if (action === 'restart_conversation') {
      // Generate new session ID to ensure fresh backend session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      // Reset conversation state and go directly to goals stage
      setMessages([{
        id: '1',
        role: 'assistant',
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "Let's start fresh with your investment goals! 🎯",
                "I'll help you define your financial objectives and create a personalized strategy."
              ])
            },
            {
              type: "conversation_text",
              content: JSON.stringify([
                "To provide you with the best portfolio recommendations, I need to understand your investment goals. Please tell me about your financial objectives - what are you hoping to achieve with your investments?"
              ])
            }
          ]
        },
        timestamp: new Date(),
      }]);
      setSessionInfo({
        id: newSessionId,
        stage: 'goals',
        completed_slots: [],
        missing_slots: ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs'],
        key_facts: []
      });
      
      // Sync backend by sending an initial message to advance to goals stage
      setTimeout(async () => {
        try {
          await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'start analysis',
              sessionId: newSessionId,
              conversationHistory: []
            }),
          });
          console.log('Backend session synced to goals stage');
        } catch (error) {
          console.error('Failed to sync backend session:', error);
        }
      }, 100);
      
      return;
    }
    
    // Map action to appropriate message for chat-based actions
    let messageText = '';
    switch (action) {
      case 'start_analysis':
        messageText = 'Start Analysis';
        break;
      case 'continue':
        messageText = 'Continue';
        break;
      case 'view_summary':
      case 'looks_good':
        messageText = 'Looks good';
        break;
      case 'start':
        messageText = 'yes';
        break;
      default:
        messageText = action || 'Continue';
        break;
    }

    console.log('CTA messageText:', messageText);

    // Create user message directly without going through input
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      await handleFSMResponse(userMessage);
    } catch (error) {
      console.error('Error handling CTA click:', error);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStepProgress = (): number => {
    const stageOrder = ['qualify', 'goals', 'portfolio', 'analyze', 'explain', 'cta'];
    const currentIndex = stageOrder.indexOf(sessionInfo.stage);
    return Math.max(0, (currentIndex / (stageOrder.length - 1)) * 100);
  };

  const getDynamicSpacing = (): string => {
    const messageCount = messages.length;
    if (messageCount <= 2) {
      // Initial greeting - center the content more
      return 'justify-center min-h-[60vh]';
    } else if (messageCount <= 6) {
      // Early conversation - moderate spacing
      return 'justify-start min-h-[40vh]';
    } else {
      // Longer conversation - minimal spacing
      return 'justify-start min-h-[20vh]';
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Progress Indicator Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-sm font-medium text-white">
              AI Portfolio Analysis
            </span>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">
            {sessionInfo.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          <div className="w-20 bg-slate-700 rounded-full h-1">
            <div 
              className="bg-blue-400 h-1 rounded-full transition-all duration-500"
              style={{ width: `${getStepProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Messages Area - Full Height */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className={`max-w-4xl mx-auto space-y-6 flex flex-col ${getDynamicSpacing()}`}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {message.role === 'user' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                {/* Message Content */}
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-white border border-slate-700'
                  }`}>
                    {message.content && (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    )}
                    {message.displaySpec && (
                      <div className="text-sm leading-relaxed">
                        {renderDisplaySpec(message.displaySpec)}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs text-slate-400 mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.sessionInfo && (
                      <span className="ml-2 text-slate-500">
                        Stage: {message.sessionInfo.stage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-slate-300">Analyzing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          
          <div ref={messagesEndRef} />
        </div>
      </div>


      {/* Input Area */}
      <div className="border-t border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What do you want to know?"
                className="w-full px-4 py-3 text-sm bg-slate-800 border border-slate-600 text-white placeholder-slate-400 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
                disabled={isLoading}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            AI-powered portfolio analysis with real-time market data
          </p>
        </div>
      </div>
    </div>
  );
}
