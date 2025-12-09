import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { 
  refreshTimePortfolioCache, 
  refreshVolatilityCache 
} from "@/inngest/functions";

// Create an API that serves all Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    refreshTimePortfolioCache,
    refreshVolatilityCache,
  ],
});

