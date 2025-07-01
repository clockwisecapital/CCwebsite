export interface Phase {
  id: number;
  title: string;
  years: string;
  synopsis: string;
  chart: { name: string; value: number }[];
}

export const phases: Phase[] = [
  {
    id: 1,
    title: "Easy Money Era",
    years: "1945-1980",
    synopsis:
      "Post-war boom. Steady bull markets, real-estate surge, buy-and-hold thrives.",
    chart: [
      { name: "1945", value: 15 },
      { name: "1960", value: 35 },
      { name: "1980", value: 55 },
    ],
  },
  {
    id: 2,
    title: "Bubble Phase",
    years: "1980-2000",
    synopsis:
      "Cheap credit, leveraged speculation, tech & housing manias drive euphoric gains.",
    chart: [
      { name: "1980", value: 55 },
      { name: "1990", value: 85 },
      { name: "2000", value: 115 },
    ],
  },
  {
    id: 3,
    title: "Peak & Crash",
    years: "2000-2008",
    synopsis:
      "Debt burdens bite, bubbles burst, culminating in the 2008 financial crisis.",
    chart: [
      { name: "2000", value: 115 },
      { name: "2004", value: 90 },
      { name: "2008", value: 60 },
    ],
  },
  {
    id: 4,
    title: "Great Deleveraging",
    years: "2008-Present",
    synopsis:
      "Zero rates & money-printing fuel asset inflation, meme stocks, extreme volatility.",
    chart: [
      { name: "2008", value: 60 },
      { name: "2016", value: 80 },
      { name: "2025", value: 70 },
    ],
  },
  {
    id: 5,
    title: "Reset (Forecast)",
    years: "2030-2040?",
    synopsis:
      "Potential debt restructurings & new monetary regime create high risk/reward.",
    chart: [
      { name: "2030", value: 70 },
      { name: "2035", value: 95 },
      { name: "2040", value: 130 },
    ],
  },
];
