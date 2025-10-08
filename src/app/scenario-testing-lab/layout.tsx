import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scenario Testing Lab | Clockwise Capital',
  description: 'Stress-test your portfolio against real-world economic scenarios. AI-powered cycle intelligence to help you understand market cycles and optimize your investments.',
  keywords: 'portfolio analysis, scenario testing, market cycles, TIME ETF, investment analysis, economic cycles',
  openGraph: {
    title: 'Scenario Testing Lab | Clockwise Capital',
    description: 'Stress-test your portfolio against real-world economic scenarios with AI-powered cycle intelligence.',
    type: 'website',
  },
};

export default function ScenarioTestingLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
