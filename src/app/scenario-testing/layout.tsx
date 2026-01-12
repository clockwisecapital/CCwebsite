import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scenario Testing | Clockwise Capital',
  description: 'Test your portfolio against real-world economic scenarios. Compare your allocation against top-performing portfolios and see how you stack up.',
  keywords: 'portfolio testing, scenario analysis, market scenarios, investment testing, economic cycles',
  openGraph: {
    title: 'Scenario Testing | Clockwise Capital',
    description: 'Test your portfolio against real-world economic scenarios and compare with top performers.',
    type: 'website',
  },
};

export default function ScenarioTestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


