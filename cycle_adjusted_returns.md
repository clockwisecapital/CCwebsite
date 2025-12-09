Remaining Years Market Cycles Adjustments
The goal engine incorporates five major market cycle dimensions—S&P 500 Cycle, Business Cycle, Economic Cycle, Technology Cycle, and Country Cycle. Each cycle contributes a probability-weighted impact on expected returns for the five core asset classes:
Stocks


Bonds


Real Estate


Commodities


Cash


As the probability of the next phase in any cycle increases, the model automatically increases the influence of that cycle's return assumptions on the portfolio’s goal projection.

1. S&P 500 Cycle Adjustment
Baseline Expected Returns (Long-Term Historical Averages):
Stocks: 10%


Bonds: 5%


Real Estate: 10%


Commodities: 5%


Cash: 3%


These values act as the anchor of the model. All other cycles provide phase-based deviations from these baselines.

2. Business Cycle Adjustment
Input Required:
Average duration of the Short-Term Business Cycle


Predicted current Business Cycle Phase


Frameworks Combined:
 Ray Dalio (Short-Term Debt Cycle), Burns & Mitchell (NBER), Schumpeter (Innovation Cycles), Minsky (Financial Instability), Soros (Reflexivity), Kindleberger (Manias/Panics), Federal Reserve/BIS Output Gap Models, OECD Leading Indicators, AI-Macro Lens (McKinsey, ARK).
Adjustment Mechanism:
 Each Business Cycle Phase (Expansion, Peak, Slowdown, Recession, Recovery) has a historical analog return set for Stocks, Bonds, Real Estate, Commodities, and Cash.
BusinessCycleImpact=PBC(Phase)×RBC(Phase)\text{BusinessCycleImpact} = P_{BC}(\text{Phase}) \times R_{BC}(\text{Phase})BusinessCycleImpact=PBC​(Phase)×RBC​(Phase)
As the probability of the next phase increases, its return assumptions receive proportionally greater weight.

3. Economic Cycle Adjustment
Input Required:
Average duration of the Long-Term Economic Cycle


Predicted current Economic Cycle Phase


Frameworks Combined:
 Dalio (Big Debt Cycle), Kondratiev Waves, Minsky, Modelski (World Power Cycles), Ben Hunt (Narrative Cycles), AI-Macro (McKinsey, ARK, WEF), IMF Productivity/Demographics Frameworks.
Adjustment Mechanism:
Long-wave phases (e.g., Inflationary Boom, Disinflationary Growth, Stagnation, Debt Resolution) each have analog historical return profiles.
EconomicCycleImpact=PEC(Phase)×REC(Phase)\text{EconomicCycleImpact} = P_{EC}(\text{Phase}) \times R_{EC}(\text{Phase})EconomicCycleImpact=PEC​(Phase)×REC​(Phase)
Higher probability → greater influence on the expected returns.

4. Technology Cycle Adjustment
Input Required:
Average duration of the Long-Term Technology Cycle


Predicted current Technology Cycle Phase


Frameworks Combined:
 Carlota Perez, Kondratiev Technology Waves, Schumpeter, Geoffrey Moore, Ray Kurzweil, Simon Wardley.
Adjustment Mechanism:
 Stages such as Installation, Frenzy, Turning Point, Deployment, and Maturity carry different return expectations—especially for equities and commodities (inputs) and real estate (infrastructure).
TechnologyCycleImpact=PTC(Phase)×RTC(Phase)\text{TechnologyCycleImpact} = P_{TC}(\text{Phase}) \times R_{TC}(\text{Phase})TechnologyCycleImpact=PTC​(Phase)×RTC​(Phase)
5. Country Cycle Adjustment
Input Required:
Average lifecycle duration of a Country/Empire


Predicted current U.S. Country Cycle Phase


Frameworks Combined:
 Glubb (Fate of Empires), Turchin (Structural-Demographic Theory), Toynbee, Strauss & Howe (Generational Cycles), Zakaria.
Adjustment Mechanism:
 Phases (Rise, Expansion, Affluence, Bureaucracy, Decadence, Decline) historically correlate with distinct capital market outcomes.
CountryCycleImpact=PCC(Phase)×RCC(Phase)\text{CountryCycleImpact} = P_{CC}(\text{Phase}) \times R_{CC}(\text{Phase})CountryCycleImpact=PCC​(Phase)×RCC​(Phase)
6. Unified Probability-Weighted Expected Return Model
For each asset class:
ExpectedReturn=RS&P+∑Cycle∈{BC,EC,TC,CC}(PCycle(Phase)×ΔRCycle(Phase))\text{ExpectedReturn} = R_{S\&P} + \sum_{\text{Cycle}\in\{BC,EC,TC,CC\}} \left( P_{\text{Cycle}}(\text{Phase}) \times \Delta R_{\text{Cycle}}(\text{Phase}) \right)ExpectedReturn=RS&P​+Cycle∈{BC,EC,TC,CC}∑​(PCycle​(Phase)×ΔRCycle​(Phase))
Where:
RS&PR_{S\&P}RS&P​ = baseline long-term return


ΔRCycle(Phase)\Delta R_{\text{Cycle}}(\text{Phase})ΔRCycle​(Phase) = deviation from baseline for that phase


Core Instruction:
As the probability of any cycle’s next phase increases, the model proportionally increases that phase’s contribution to the portfolio’s projected returns, risk, and goal success analysis. All cycle impacts are blended as a weighted sum of their respective probabilities.

7. How the Goal Engine Uses This
At every forecast update, the goal engine:
Reads phase probabilities across five cycles


Computes the weighted expected return & volatility for each asset class


Reconstructs the portfolio’s forward return distribution


Re-simulates probability of goal achievement


Adjusts recommended risk posture accordingly


This ensures smooth, continuous, probability-driven adjustments instead of binary cycle switching.
