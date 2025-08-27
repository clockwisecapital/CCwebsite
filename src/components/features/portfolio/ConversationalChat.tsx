'use client';

import { useState, useRef, useEffect } from 'react';
import { PortfolioChart } from '@/components/ui/PortfolioChart';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  step?: ConversationStep;
  chartData?: any;
  toolResults?: any[];
}

type ConversationStep = 
  | 'greeting'
  | 'portfolio_questions'
  | 'goals'
  | 'analysis'
  | 'cycle_risks'
  | 'problem_detection'
  | 'solution_cta'
  | 'image_option'
  | 'complete';

interface PortfolioData {
  stocks?: number;
  bonds?: number;
  cash?: number;
  commodities?: number;
  realEstate?: number;
  alternatives?: number;
  topHoldings?: string[];
  sectorExposure?: string[];
  currentValue?: number;
  goalType?: 'Annual Income' | 'Lump Sum';
  goalAmount?: number;
}

interface ConversationalChatProps {
  // Removed mode props - now using unified agentic approach
}

export function ConversationalChat({}: ConversationalChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI portfolio advisor from Clockwise Capital. I'll help you evaluate your investment portfolio through the lens of accelerating market cycles and identify risks and opportunities.

I'll guide you through a few questions about your portfolio and investment goals, then provide you with a comprehensive analysis including:
• Your position in current economic cycles
• Risk assessment and concentration analysis  
• Comparison with our TIME ETF strategy
• Actionable recommendations

Would you like to get started? Just tell me a bit about your current portfolio.`,
      timestamp: new Date(),
      step: 'greeting',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConversationStep>('greeting');
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({});
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateChart = async (chartType: 'allocation' | 'comparison') => {
    try {
      const response = await fetch('/api/generateChart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chartType,
          portfolioData,
          analysisData: analysisResult
        }),
      });

      if (!response.ok) {
        throw new Error('Chart generation failed');
      }

      const data = await response.json();
      
      // Add chart as a new message
      const chartMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here's your ${chartType === 'allocation' ? 'portfolio allocation' : 'portfolio comparison'} chart:`,
        timestamp: new Date(),
        chartData: data.chartConfig
      };

      setMessages(prev => [...prev, chartMessage]);
    } catch (error) {
      console.error('Chart generation error:', error);
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
      await handleConversationalResponse(userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationalResponse = async (userMessage: Message) => {
    const response = await fetch('/api/portfolioAgent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: userMessage.content,
        portfolioContext: portfolioData,
        conversationHistory: messages.slice(-6), // Last 6 messages for context
      }),
    });

    if (!response.ok) {
      throw new Error('Chat request failed');
    }

    const data = await response.json();
    
    // Extract portfolio data from the conversation
    const extractedData = extractPortfolioData(userMessage.content, data.response);
    if (extractedData) {
      setPortfolioData(prev => ({ ...prev, ...extractedData }));
    }

    // Determine next step based on conversation progress
    const nextStep = determineNextStep(data.response, portfolioData);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.response,
      timestamp: new Date(),
      step: nextStep,
      toolResults: data.toolResults,
      chartData: data.toolResults?.find((result: any) => result.tool === 'generate_portfolio_chart')?.data
    };

    setMessages(prev => [...prev, assistantMessage]);
    setCurrentStep(nextStep);
  };

  const performAnalysis = async (userMessage: Message) => {
    const response = await fetch('/api/analyzePortfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        portfolioData,
        conversationHistory: messages.slice(-6),
      }),
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const result = await response.json();
    setAnalysisResult(result);

    const analysisMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.analysisNarrative,
      timestamp: new Date(),
      step: 'cycle_risks',
    };

    setMessages(prev => [...prev, analysisMessage]);
    setCurrentStep('cycle_risks');

    // Continue with cycle risks and recommendations
    setTimeout(() => {
      const recommendationsMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Based on my analysis, here are my key recommendations:

${result.recommendations.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n')}

Would you like me to generate a visual lifecycle chart showing your portfolio's position in the current market cycles? Or would you prefer to schedule a free consultation with one of our advisors to discuss these recommendations in detail?`,
        timestamp: new Date(),
        step: 'solution_cta',
      };
      
      setMessages(prev => [...prev, recommendationsMessage]);
      setCurrentStep('solution_cta');
    }, 2000);
  };

  const generateImage = async (type: 'lifecycle' | 'portfolio_comparison') => {
    try {
      const response = await fetch('/api/generateImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          analysisData: {
            debtCyclePhase: analysisResult?.marketCycleAnalysis?.debtCyclePhase,
            sp500LifecycleStage: analysisResult?.marketCycleAnalysis?.sp500LifecycleStage,
            portfolioAllocation: {
              stocks: portfolioData.stocks || 0,
              bonds: portfolioData.bonds || 0,
              cash: portfolioData.cash || 0,
              commodities: portfolioData.commodities || 0,
              realEstate: portfolioData.realEstate || 0,
              alternatives: portfolioData.alternatives || 0,
            },
            timeEtfComparison: analysisResult?.timeEtfComparison,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const imageMessage: Message = {
          id: (Date.now() + 3).toString(),
          role: 'assistant',
          content: `Here's your ${type === 'lifecycle' ? 'market lifecycle' : 'portfolio comparison'} visualization:

![${type} Chart](${data.imageUrl})

This chart shows your portfolio's current positioning. Would you like to schedule a consultation to discuss how to optimize your strategy based on these insights?`,
          timestamp: new Date(),
          step: 'image_option',
        };
        
        setMessages(prev => [...prev, imageMessage]);
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    }
  };

  const extractPortfolioData = (userInput: string, aiResponse: string): Partial<PortfolioData> | null => {
    const extracted: Partial<PortfolioData> = {};
    
    // Extract percentages from user input
    const percentageRegex = /(\d+(?:\.\d+)?)\s*%?\s*(stocks?|bonds?|cash|commodities?|real\s*estate|alternatives?)/gi;
    let match;
    
    while ((match = percentageRegex.exec(userInput)) !== null) {
      const value = parseFloat(match[1]);
      const asset = match[2].toLowerCase().replace(/\s+/g, '');
      
      if (asset.includes('stock')) extracted.stocks = value;
      else if (asset.includes('bond')) extracted.bonds = value;
      else if (asset.includes('cash')) extracted.cash = value;
      else if (asset.includes('commodit')) extracted.commodities = value;
      else if (asset.includes('real') || asset.includes('estate')) extracted.realEstate = value;
      else if (asset.includes('alternative')) extracted.alternatives = value;
    }

    // Extract dollar amounts
    const dollarRegex = /\$?([\d,]+(?:\.\d{2})?)\s*(million|k|thousand)?/gi;
    const dollarMatch = dollarRegex.exec(userInput);
    if (dollarMatch) {
      let value = parseFloat(dollarMatch[1].replace(/,/g, ''));
      const unit = dollarMatch[2]?.toLowerCase();
      
      if (unit === 'million') value *= 1000000;
      else if (unit === 'k' || unit === 'thousand') value *= 1000;
      
      extracted.currentValue = value;
    }

    // Extract goal information
    if (userInput.toLowerCase().includes('income')) {
      extracted.goalType = 'Annual Income';
    } else if (userInput.toLowerCase().includes('lump sum') || userInput.toLowerCase().includes('target')) {
      extracted.goalType = 'Lump Sum';
    }

    return Object.keys(extracted).length > 0 ? extracted : null;
  };

  const determineNextStep = (aiResponse: string, currentData: PortfolioData): ConversationStep => {
    if (isPortfolioDataComplete()) {
      return 'analysis';
    } else if (currentData.stocks !== undefined || currentData.bonds !== undefined) {
      return 'portfolio_questions';
    } else if (currentData.goalType || currentData.goalAmount) {
      return 'goals';
    } else {
      return 'portfolio_questions';
    }
  };

  const isPortfolioDataComplete = (): boolean => {
    const hasAllocation = portfolioData.stocks !== undefined && 
                         portfolioData.bonds !== undefined &&
                         portfolioData.cash !== undefined;
    const hasGoals = portfolioData.goalType !== undefined && portfolioData.currentValue !== undefined;
    return hasAllocation && hasGoals;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStepProgress = (): number => {
    const steps = ['greeting', 'portfolio_questions', 'goals', 'analysis', 'cycle_risks', 'solution_cta'];
    const currentIndex = steps.indexOf(currentStep);
    return Math.max(0, (currentIndex / (steps.length - 1)) * 100);
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
            {currentStep.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  </div>
                  <div className={`text-xs text-slate-400 mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-100'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.chartData && (
                  <div className="mt-4">
                    <PortfolioChart chartConfig={message.chartData} />
                  </div>
                )}
                
                {/* Chart Generation Buttons - only show after assistant messages when portfolio data exists */}
                {message.role === 'assistant' && portfolioData.stocks !== undefined && !message.chartData && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => generateChart('allocation')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                    >
                      📊 Show Allocation
                    </button>
                    <button
                      onClick={() => generateChart('comparison')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                    >
                      📈 Compare vs TIME ETF
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {currentStep === 'solution_cta' && analysisResult && (
        <div className="border-t border-slate-700 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => generateImage('lifecycle')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Generate Lifecycle Chart
              </button>
              <button
                onClick={() => generateImage('portfolio_comparison')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Portfolio Comparison Chart
              </button>
              <button
                onClick={() => window.open('/contact', '_blank')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>
      )}

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
