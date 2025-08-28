import OpenAI from "openai";

export const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export const SEARCH_BUDGET = { soft: 3, hard: 5 }; // per session
export const TIMEOUTS = { searchMs: 6500, analysisMs: 12000 };

// Domain allowlist for web search
export const ALLOWED_DOMAINS = [
  "fred.stlouisfed.org",
  "treasury.gov", 
  "ishares.com",
  "spglobal.com",
  "clockwisecapital.com",
  "sec.gov",
  "morningstar.com",
  "yahoo.com",
  "bloomberg.com"
];
