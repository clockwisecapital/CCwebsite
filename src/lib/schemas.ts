// JSON Schemas for structured outputs and validation

// Simplified DisplaySpec schema that works with OpenAI structured outputs
export const DisplaySpecSchema = {
  type: "object",
  required: ["blocks"],
  additionalProperties: false,
  properties: {
    blocks: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "content"],
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["summary_bullets", "stat_group", "table", "chart", "sources", "cta_group"]
          },
          content: {
            type: "string"
          }
        }
      }
    }
  }
} as const;

export const GoalsSchema = {
  type: "object",
  required: ["goal_type", "goal_amount", "horizon_years", "risk_tolerance", "liquidity_needs"],
  additionalProperties: false,
  properties: {
    goal_type: {
      type: ["string", "null"],
      enum: ["income", "lump_sum", "balanced", "preservation", "growth", null]
    },
    goal_amount: { 
      type: ["number", "null"],
      minimum: 0
    },
    horizon_years: { 
      type: ["number", "null"],
      minimum: 0, 
      maximum: 50 
    },
    risk_tolerance: {
      type: ["string", "null"],
      enum: ["low", "medium", "high", null]
    },
    liquidity_needs: {
      type: ["string", "null"],
      enum: ["low", "medium", "high", null]
    }
  }
} as const;

export const PortfolioSchema = {
  type: "object",
  required: ["allocations", "currency"],
  additionalProperties: false,
  properties: {
    allocations: {
      type: "object",
      required: ["stocks", "bonds", "cash", "commodities", "real_estate", "alternatives"],
      additionalProperties: false,
      properties: {
        stocks: { type: "number", minimum: 0, maximum: 100 },
        bonds: { type: "number", minimum: 0, maximum: 100 },
        cash: { type: "number", minimum: 0, maximum: 100 },
        commodities: { type: "number", minimum: 0, maximum: 100 },
        real_estate: { type: "number", minimum: 0, maximum: 100 },
        alternatives: { type: "number", minimum: 0, maximum: 100 }
      }
    },
    currency: { type: "string", enum: ["USD", "EUR", "GBP", "CAD", "AUD"] },
    top_positions: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        required: ["symbol", "weight"],
        additionalProperties: false,
        properties: {
          symbol: { type: "string" },
          weight: { type: "number", minimum: 0, maximum: 100 }
        }
      }
    },
    sectors: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "percentage"],
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          percentage: { type: "number", minimum: 0, maximum: 100 }
        }
      }
    }
  }
} as const;

export const ChartDataSchema = {
  type: "object",
  required: ["labels", "series"],
  additionalProperties: false,
  properties: {
    labels: {
      type: "array",
      items: { type: "string" }
    },
    series: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "data"],
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          data: {
            type: "array",
            items: { type: "number" }
          }
        }
      }
    },
    meta: {
      type: "object",
      additionalProperties: false,
      properties: {
        version: { type: "string" }
      }
    }
  }
} as const;
