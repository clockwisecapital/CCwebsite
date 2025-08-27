# AI Portfolio Analysis System - Architecture Documentation

## Overview
This document outlines the complete AI portfolio analysis system for Clockwise Capital, including all files, routes, components, and their interactions. The system provides conversational AI-powered portfolio analysis with real-time chart generation.

## System Architecture

### Core Components

#### 1. Frontend Components
- **Location**: `src/components/features/portfolio/ConversationalChat.tsx`
- **Purpose**: Main chat interface for portfolio analysis
- **Key Features**:
  - Conversational UI with message bubbles
  - Real-time portfolio data extraction and validation
  - Chart generation buttons for user-triggered visualizations
  - Integration with AI agent API
  - Dynamic spacing based on conversation length

#### 2. Chart Rendering Component
- **Location**: `src/components/ui/PortfolioChart.tsx`
- **Purpose**: Renders interactive charts using Chart.js
- **Dependencies**: `chart.js`, `react-chartjs-2`
- **Supports**: Doughnut charts (allocation), Bar charts (comparison)

#### 3. Portfolio Page
- **Location**: `src/app/portfolio/page.tsx`
- **Purpose**: Main portfolio analysis page with dark theme
- **Features**: Full-page layout, header integration, chat interface

## API Routes

### 1. Primary AI Agent Endpoint
**Route**: `/api/portfolioAgent`
**File**: `src/app/api/portfolioAgent/route.ts`
**Purpose**: Main conversational AI endpoint with tool calling capabilities

**Key Features**:
- OpenAI GPT-4.1 integration with function calling
- Tool execution for portfolio analysis, risk metrics, and chart generation
- Conversation history management
- Portfolio data extraction from natural language

**Available Tools**:
- `analyze_portfolio`: Comprehensive portfolio analysis with cycle positioning
- `calculate_risk_metrics`: Risk assessment and correlation analysis
- `generate_portfolio_chart`: Chart configuration generation
- `validate_portfolio_data`: Natural language portfolio data extraction
- `web_search_preview`: Real-time market data retrieval

### 2. Dedicated Chart Generation API
**Route**: `/api/generateChart`
**File**: `src/app/api/generateChart/route.ts`
**Purpose**: Standalone chart generation endpoint

**Features**:
- Independent chart generation without AI processing
- Supports allocation and comparison chart types
- Returns Chart.js configuration data
- Used by user-triggered chart buttons

### 3. Legacy Analysis Endpoint
**Route**: `/api/analyzePortfolio`
**File**: `src/app/api/analyzePortfolio/route.ts`
**Purpose**: Original portfolio analysis endpoint (still used by some flows)

**Features**:
- Portfolio analysis with market cycle positioning
- Risk assessment calculations
- Narrative generation
- Recommendations engine

## Data Flow Architecture

### 1. Conversation Flow
```
User Input → ConversationalChat → /api/portfolioAgent → OpenAI GPT-4.1 → Tool Calls → Response
```

### 2. Chart Generation Flow (User-Triggered)
```
User Clicks Button → generateChart() → /api/generateChart → Chart Config → PortfolioChart Component
```

### 3. Chart Generation Flow (AI-Triggered)
```
AI Tool Call → generate_portfolio_chart → Chart Config → Frontend Rendering
```

## Key Functions and Utilities

### Portfolio Data Extraction
**Location**: `src/app/api/portfolioAgent/route.ts`
**Function**: `validatePortfolioData()`
**Purpose**: Extracts portfolio allocation percentages, dollar amounts, and investment goals from natural language input using regex patterns.

**Extraction Patterns**:
- Asset percentages: `(\d+(?:\.\d+)?)\s*%?\s*(stocks?|bonds?|cash|commodities?|real\s*estate|alternatives?)`
- Dollar amounts: `\$?([\d,]+(?:\.\d{2})?)\s*(million|k|thousand)?`
- Goal amounts: `(?:need|want|goal|target|retire with)\s+(?:about\s+)?\$?([\d,]+(?:\.\d{2})?)`

### Risk Calculations
**Location**: `src/app/api/portfolioAgent/route.ts`
**Functions**: `calculateBeta()`, `calculateSharpeRatio()`, `calculateVolatility()`, etc.
**Purpose**: Portfolio risk metric calculations for analysis

### Chart Configuration Generation
**Location**: Multiple files
**Purpose**: Generates Chart.js compatible configuration objects

**Chart Types**:
- **Allocation**: Doughnut chart showing portfolio breakdown
- **Comparison**: Bar chart comparing user portfolio vs TIME ETF strategy

## Environment Variables Required

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Dependencies

### Frontend
- `react`
- `chart.js`
- `react-chartjs-2`
- `tailwindcss`

### Backend
- `openai` (GPT-4.1 API)
- `next.js` (API routes)

## System Prompt Configuration

**Location**: `src/app/api/portfolioAgent/route.ts`
**Key Guidelines**:
- Tool usage rules for web search vs direct response
- Mandatory chart generation via tools (not text descriptions)
- 8-step conversation flow
- Cycle-aware investment strategy focus

## Error Handling

### OpenAI API Errors
- Tool call response validation
- Proper tool_call_id handling
- Fallback error responses

### Chart Generation Errors
- User-triggered buttons as backup
- Graceful degradation when AI tool calling fails

## Current Issues and Limitations

1. **AI Tool Calling**: Intermittent failures in AI calling chart generation tools
2. **Fallback Solution**: User-triggered chart buttons provide reliable alternative
3. **Data Validation**: Portfolio data extraction may miss complex input formats

## Handoff Notes for Developers

### Immediate Priorities
1. Debug remaining OpenAI tool calling issues
2. Enhance portfolio data extraction regex patterns
3. Add more chart types (risk/return, lifecycle positioning)
4. Implement proper error boundaries

### Future Enhancements
1. Add PDF report generation
2. Implement portfolio comparison with multiple strategies
3. Add real-time market data integration
4. Create admin dashboard for system monitoring

### Testing Recommendations
1. Test conversation flows with various portfolio input formats
2. Validate chart generation with edge cases
3. Test error handling scenarios
4. Performance testing with concurrent users

## File Structure Summary

```
src/
├── app/
│   ├── portfolio/
│   │   └── page.tsx                    # Main portfolio page
│   └── api/
│       ├── portfolioAgent/
│       │   └── route.ts               # Primary AI agent endpoint
│       ├── generateChart/
│       │   └── route.ts               # Chart generation API
│       └── analyzePortfolio/
│           └── route.ts               # Legacy analysis endpoint
├── components/
│   ├── features/portfolio/
│   │   └── ConversationalChat.tsx     # Main chat interface
│   └── ui/
│       └── PortfolioChart.tsx         # Chart rendering component
```

This system provides a robust, conversational AI-powered portfolio analysis experience with multiple fallback mechanisms and comprehensive error handling.
