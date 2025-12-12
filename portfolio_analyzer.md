portfolio_analyzer.py
"""
Portfolio Analyzer Module
=========================
A modular, API-ready portfolio analysis library for calculating
performance and risk metrics using industry-standard methodology.

Designed for integration with web applications (Vercel, FastAPI, etc.)

Methodology:
- Benchmark: S&P 500 Total Return Index (^SP500TR)
- Risk-Free Rate: 3-Month T-Bill (^IRX) historical rates
- Volatility/Beta/Alpha/Capture: Monthly returns (Morningstar standard)
- Max Drawdown: Daily data

Author: Clockwise Capital
Version: 1.0.0
"""

import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import json


# =============================================================================
# DATA CLASSES - Structured output for API responses
# =============================================================================

@dataclass
class PeriodMetrics:
    """Metrics for a single time period"""
    period_name: str
    start_date: str
    end_date: str

    # Returns
    portfolio_return: float
    benchmark_return: float
    excess_return: float

    # Risk metrics - Portfolio
    portfolio_std_dev: float
    portfolio_alpha: float
    portfolio_beta: float
    portfolio_sharpe_ratio: float
    portfolio_max_drawdown: float
    portfolio_up_capture: float
    portfolio_down_capture: float

    # Risk metrics - Benchmark (to match Kwanti format)
    benchmark_std_dev: float
    benchmark_alpha: float
    benchmark_beta: float
    benchmark_sharpe_ratio: float
    benchmark_max_drawdown: float
    benchmark_up_capture: float
    benchmark_down_capture: float

    # Context
    risk_free_rate: float
    num_months: int  # Sample size warning

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ChartData:
    """Cumulative return chart data for plotting (Kwanti-style, starting from 0%)"""
    dates: List[str]
    portfolio_returns: List[float]  # Cumulative return starting from 0 (e.g., 0.0, 0.05, 1.10 = +110%)
    benchmark_returns: List[float]  # Cumulative return starting from 0
    portfolio_name: str
    benchmark_name: str
    start_date: str
    end_date: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dates": self.dates,
            "portfolio_returns": self.portfolio_returns,
            "benchmark_returns": self.benchmark_returns,
            "portfolio_name": self.portfolio_name,
            "benchmark_name": self.benchmark_name,
            "start_date": self.start_date,
            "end_date": self.end_date
        }


@dataclass
class AnalysisResult:
    """Complete analysis result for API response"""
    portfolio_name: str
    as_of_date: str
    generated_at: str
    data_start_date: str
    data_end_date: str

    periods: List[PeriodMetrics]
    cumulative_3y: Optional[PeriodMetrics]
    chart_data: Optional[ChartData]  # Cumulative price chart data

    methodology: Dict[str, str]
    warnings: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "portfolio_name": self.portfolio_name,
            "as_of_date": self.as_of_date,
            "generated_at": self.generated_at,
            "data_start_date": self.data_start_date,
            "data_end_date": self.data_end_date,
            "periods": [p.to_dict() for p in self.periods],
            "cumulative_3y": self.cumulative_3y.to_dict() if self.cumulative_3y else None,
            "chart_data": self.chart_data.to_dict() if self.chart_data else None,
            "methodology": self.methodology,
            "warnings": self.warnings
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, default=str)


@dataclass
class MultiPortfolioResult:
    """Combined analysis result for multiple portfolios"""
    as_of_date: str
    generated_at: str
    data_start_date: str
    data_end_date: str

    # Individual portfolio results (for detailed Kwanti-style view)
    portfolios: Dict[str, AnalysisResult]

    # Combined comparison data (for side-by-side view)
    comparison: Dict[str, Any]

    methodology: Dict[str, str]
    warnings: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "as_of_date": self.as_of_date,
            "generated_at": self.generated_at,
            "data_start_date": self.data_start_date,
            "data_end_date": self.data_end_date,
            "portfolios": {name: result.to_dict() for name, result in self.portfolios.items()},
            "comparison": self.comparison,
            "methodology": self.methodology,
            "warnings": self.warnings
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, default=str)

    def get_individual(self, portfolio_name: str) -> Optional[AnalysisResult]:
        """Get individual portfolio result for Kwanti-style display"""
        return self.portfolios.get(portfolio_name)


# =============================================================================
# PORTFOLIO ANALYZER CLASS
# =============================================================================

class PortfolioAnalyzer:
    """
    Main analyzer class for portfolio performance and risk metrics.

    Usage:
        analyzer = PortfolioAnalyzer()
        result = analyzer.analyze(csv_data, as_of_date="2025-12-05")
        print(result.to_json())
    """

    def __init__(self, cache_market_data: bool = True):
        """
        Initialize the analyzer.

        Args:
            cache_market_data: If True, cache fetched market data for reuse
        """
        self.cache_market_data = cache_market_data
        self._market_data_cache: Optional[pd.DataFrame] = None
        self._cache_date_range: Optional[Tuple[str, str]] = None

    # -------------------------------------------------------------------------
    # PUBLIC API METHODS
    # -------------------------------------------------------------------------

    def analyze(
        self,
        portfolio_data: pd.DataFrame,
        portfolio_name: str = "Portfolio",
        as_of_date: Optional[str] = None,
        periods: Optional[Dict[str, Tuple[str, str]]] = None
    ) -> AnalysisResult:
        """
        Run complete portfolio analysis.

        Args:
            portfolio_data: DataFrame with columns ['Date', 'Value'] or raw CSV format
            portfolio_name: Name for the portfolio in output
            as_of_date: Analysis date (default: latest date in data)
            periods: Custom periods dict like {'2023': ('2022-12-30', '2023-12-29')}
                    If None, auto-generates based on available data

        Returns:
            AnalysisResult object with all metrics
        """
        # Clean and prepare data
        df = self._prepare_portfolio_data(portfolio_data)

        # Set as_of_date
        if as_of_date is None:
            as_of_date = df['Date'].max().strftime('%Y-%m-%d')

        # Fetch market data
        market_df = self._fetch_market_data(
            df['Date'].min().strftime('%Y-%m-%d'),
            as_of_date
        )

        # Merge portfolio with market data
        merged_df = self._merge_data(df, market_df)

        # Auto-generate periods if not provided
        if periods is None:
            periods = self._auto_generate_periods(merged_df, as_of_date)

        # Calculate metrics for each period
        period_results = []
        warnings = []

        for period_name, (start, end) in periods.items():
            try:
                metrics = self._calculate_period_metrics(
                    merged_df, period_name, start, end
                )
                period_results.append(metrics)

                # Add sample size warning
                if metrics.num_months < 12:
                    warnings.append(
                        f"{period_name}: Only {metrics.num_months} months of data. "
                        "Results may be unreliable."
                    )
                elif metrics.num_months < 36:
                    warnings.append(
                        f"{period_name}: {metrics.num_months} months is below the "
                        "recommended 36 months for statistical reliability."
                    )
            except Exception as e:
                warnings.append(f"{period_name}: Could not calculate - {str(e)}")

        # Calculate 3-year cumulative if we have enough data
        cumulative_3y = None
        three_year_start = (pd.to_datetime(as_of_date) - pd.DateOffset(years=3)).strftime('%Y-%m-%d')
        if merged_df['Date'].min() <= pd.to_datetime(three_year_start):
            try:
                cumulative_3y = self._calculate_period_metrics(
                    merged_df, "3Y Cumulative", three_year_start, as_of_date
                )
            except Exception as e:
                warnings.append(f"3Y Cumulative: Could not calculate - {str(e)}")

        # Generate chart data (default: 3 years or from data start)
        chart_data = None
        try:
            chart_data = self._generate_chart_data(merged_df, portfolio_name)
        except Exception as e:
            warnings.append(f"Chart data: Could not generate - {str(e)}")

        # Build result
        return AnalysisResult(
            portfolio_name=portfolio_name,
            as_of_date=as_of_date,
            generated_at=datetime.now().isoformat(),
            data_start_date=merged_df['Date'].min().strftime('%Y-%m-%d'),
            data_end_date=merged_df['Date'].max().strftime('%Y-%m-%d'),
            periods=period_results,
            cumulative_3y=cumulative_3y,
            chart_data=chart_data,
            methodology=self._get_methodology(),
            warnings=warnings
        )

    def analyze_from_csv(
        self,
        csv_path: str,
        **kwargs
    ) -> AnalysisResult:
        """
        Analyze from a CSV file path.

        Args:
            csv_path: Path to CSV file
            **kwargs: Additional arguments passed to analyze()

        Returns:
            AnalysisResult object
        """
        df = pd.read_csv(csv_path)
        return self.analyze(df, **kwargs)

    def analyze_from_csv_string(
        self,
        csv_string: str,
        **kwargs
    ) -> AnalysisResult:
        """
        Analyze from CSV string data (useful for API uploads).

        Args:
            csv_string: CSV data as string
            **kwargs: Additional arguments passed to analyze()

        Returns:
            AnalysisResult object
        """
        from io import StringIO
        df = pd.read_csv(StringIO(csv_string))
        return self.analyze(df, **kwargs)

    def analyze_multi_portfolio(
        self,
        csv_path: str,
        portfolio_columns: Optional[List[str]] = None,
        as_of_date: Optional[str] = None
    ) -> MultiPortfolioResult:
        """
        Analyze multiple portfolios from a single CSV file.

        Expected CSV format:
            Date, Portfolio1, Portfolio2, Portfolio3, ...
            12/09/20, 100000, 100000, 100000, ...
            12/10/20, 101244, 100800, 100400, ...

        Args:
            csv_path: Path to CSV file with multiple portfolio columns
            portfolio_columns: List of column names to analyze (if None, uses all non-Date columns)
            as_of_date: Analysis date (default: latest date in data)

        Returns:
            MultiPortfolioResult with both individual and comparison views
        """
        # Read CSV
        df = pd.read_csv(csv_path)

        # Parse date column (first column)
        date_col = df.columns[0]
        df[date_col] = pd.to_datetime(df[date_col], format='mixed', dayfirst=False)
        df = df.rename(columns={date_col: 'Date'})

        # Determine portfolio columns
        if portfolio_columns is None:
            # Auto-detect: all columns except Date that look like portfolio values
            portfolio_columns = []
            for col in df.columns[1:]:
                # Skip columns that look like return/cumul columns
                col_lower = col.lower()
                if not any(x in col_lower for x in ['return', 'cumul', 'pct', '%']):
                    portfolio_columns.append(col)

        # Set as_of_date
        if as_of_date is None:
            as_of_date = df['Date'].max().strftime('%Y-%m-%d')

        # Fetch market data once (for all portfolios)
        market_df = self._fetch_market_data(
            df['Date'].min().strftime('%Y-%m-%d'),
            as_of_date
        )

        # Analyze each portfolio
        portfolio_results = {}
        all_warnings = []

        for col in portfolio_columns:
            # Extract single portfolio data
            port_df = df[['Date', col]].copy()
            port_df.columns = ['Date', 'Value']

            # Clean value column
            port_df['Value'] = (
                port_df['Value']
                .astype(str)
                .str.replace(',', '')
                .str.replace('$', '')
                .replace('-', np.nan)
                .astype(float)
            )

            # Run analysis
            result = self.analyze(
                port_df,
                portfolio_name=col,
                as_of_date=as_of_date
            )
            portfolio_results[col] = result

            # Collect warnings with portfolio prefix
            for w in result.warnings:
                all_warnings.append(f"[{col}] {w}")

        # Build comparison data for side-by-side view
        comparison = self._build_comparison(portfolio_results, as_of_date)

        # Get date range from first portfolio
        first_result = list(portfolio_results.values())[0]

        return MultiPortfolioResult(
            as_of_date=as_of_date,
            generated_at=datetime.now().isoformat(),
            data_start_date=first_result.data_start_date,
            data_end_date=first_result.data_end_date,
            portfolios=portfolio_results,
            comparison=comparison,
            methodology=self._get_methodology(),
            warnings=all_warnings
        )

    def _build_comparison(
        self,
        portfolio_results: Dict[str, AnalysisResult],
        as_of_date: str
    ) -> Dict[str, Any]:
        """Build side-by-side comparison data for all portfolios"""

        portfolio_names = list(portfolio_results.keys())
        first_result = list(portfolio_results.values())[0]
        period_names = [p.period_name for p in first_result.periods]

        comparison = {
            "portfolio_names": portfolio_names,
            "period_names": period_names,
            "metrics": {}
        }

        # Define metrics to compare
        metrics_config = [
            ("return", "portfolio_return", "Returns"),
            ("std_dev", "portfolio_std_dev", "Risk (Std Dev)"),
            ("alpha", "portfolio_alpha", "Alpha"),
            ("beta", "portfolio_beta", "Beta"),
            ("sharpe", "portfolio_sharpe_ratio", "Sharpe Ratio"),
            ("max_drawdown", "portfolio_max_drawdown", "Max Drawdown"),
            ("up_capture", "portfolio_up_capture", "Up Capture"),
            ("down_capture", "portfolio_down_capture", "Down Capture"),
        ]

        for metric_key, attr_name, display_name in metrics_config:
            comparison["metrics"][metric_key] = {
                "display_name": display_name,
                "by_period": {}
            }

            for period_name in period_names:
                comparison["metrics"][metric_key]["by_period"][period_name] = {}

                for port_name, result in portfolio_results.items():
                    # Find the period
                    period = next((p for p in result.periods if p.period_name == period_name), None)
                    if period:
                        value = getattr(period, attr_name, None)
                        comparison["metrics"][metric_key]["by_period"][period_name][port_name] = value

            # Add benchmark values (same across all)
            benchmark_attr = attr_name.replace("portfolio_", "benchmark_")
            comparison["metrics"][metric_key]["benchmark"] = {}
            for period_name in period_names:
                period = next((p for p in first_result.periods if p.period_name == period_name), None)
                if period:
                    comparison["metrics"][metric_key]["benchmark"][period_name] = getattr(period, benchmark_attr, None)

        # Add 3Y cumulative comparison
        if first_result.cumulative_3y:
            comparison["cumulative_3y"] = {}
            for port_name, result in portfolio_results.items():
                if result.cumulative_3y:
                    comparison["cumulative_3y"][port_name] = {
                        "return": result.cumulative_3y.portfolio_return,
                        "std_dev": result.cumulative_3y.portfolio_std_dev,
                        "alpha": result.cumulative_3y.portfolio_alpha,
                        "beta": result.cumulative_3y.portfolio_beta,
                        "sharpe": result.cumulative_3y.portfolio_sharpe_ratio,
                        "max_drawdown": result.cumulative_3y.portfolio_max_drawdown,
                    }

        # Add combined chart data (all portfolios + benchmark on same chart)
        # Uses cumulative returns starting from 0 (Kwanti style)
        if first_result.chart_data:
            comparison["chart"] = {
                "dates": first_result.chart_data.dates,
                "benchmark_name": first_result.chart_data.benchmark_name,
                "benchmark_returns": first_result.chart_data.benchmark_returns,
                "portfolios": {}
            }
            for port_name, result in portfolio_results.items():
                if result.chart_data:
                    comparison["chart"]["portfolios"][port_name] = result.chart_data.portfolio_returns

        return comparison

    # -------------------------------------------------------------------------
    # DATA PREPARATION
    # -------------------------------------------------------------------------

    def _prepare_portfolio_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize portfolio data"""
        df = df.copy()

        # Handle different column naming conventions
        # Expected: Date, Value (portfolio value)
        # Also handles: Date, Portfolio_Value, return, cumul, Benchmark_Value, ...

        if len(df.columns) >= 4:
            # Assume Kwanti-style format: Date, Portfolio_Value, return, cumul, ...
            df.columns = ['Date', 'Portfolio_Value', 'Portfolio_Return', 'Portfolio_Cumul'] + \
                        list(df.columns[4:])
            value_col = 'Portfolio_Value'
        elif 'Value' in df.columns:
            value_col = 'Value'
        elif 'Portfolio_Value' in df.columns:
            value_col = 'Portfolio_Value'
        else:
            # Assume second column is value
            df.columns = ['Date', 'Value'] + list(df.columns[2:])
            value_col = 'Value'

        # Parse dates
        df['Date'] = pd.to_datetime(df['Date'], format='mixed', dayfirst=False)

        # Clean value column
        df[value_col] = (
            df[value_col]
            .astype(str)
            .str.replace(',', '')
            .str.replace('$', '')
            .replace('-', np.nan)
            .astype(float)
        )

        # Standardize column name
        df = df.rename(columns={value_col: 'Portfolio_Value'})

        # Sort and remove duplicates
        df = df.sort_values('Date').drop_duplicates(subset=['Date']).reset_index(drop=True)

        # Calculate daily returns if not present
        if 'Portfolio_Return' not in df.columns:
            df['Portfolio_Return'] = df['Portfolio_Value'].pct_change(fill_method=None)

        return df[['Date', 'Portfolio_Value', 'Portfolio_Return']]

    def _fetch_market_data(self, start_date: str, end_date: str) -> pd.DataFrame:
        """Fetch S&P 500 TR and T-Bill data from Yahoo Finance"""

        # Check cache
        if (self.cache_market_data and
            self._market_data_cache is not None and
            self._cache_date_range is not None):
            cache_start, cache_end = self._cache_date_range
            if cache_start <= start_date and cache_end >= end_date:
                return self._market_data_cache

        # Extend date range slightly to ensure we have boundary data
        start_dt = pd.to_datetime(start_date) - timedelta(days=7)
        end_dt = pd.to_datetime(end_date) + timedelta(days=7)

        # Fetch S&P 500 Total Return
        try:
            sp500tr = yf.download(
                '^SP500TR',
                start=start_dt.strftime('%Y-%m-%d'),
                end=end_dt.strftime('%Y-%m-%d'),
                progress=False
            )
            if sp500tr.empty:
                raise ValueError("No S&P 500 data returned from Yahoo Finance")

            # Handle MultiIndex columns from newer yfinance
            if isinstance(sp500tr.columns, pd.MultiIndex):
                sp500tr = sp500tr.droplevel(1, axis=1)

            sp500tr = sp500tr.reset_index()
            # Handle column names robustly (yfinance API changes)
            if 'Close' in sp500tr.columns:
                sp500tr = sp500tr.rename(columns={'Close': 'SPX_Close'})
            elif len(sp500tr.columns) >= 2:
                # Fallback: assume second column is Close
                sp500tr.columns = ['Date'] + ['SPX_Close'] + [f'SPX_{i}' for i in range(len(sp500tr.columns)-2)]
        except Exception as e:
            raise RuntimeError(f"Failed to fetch S&P 500 data: {e}")

        # Fetch T-Bill rates
        try:
            tbill = yf.download(
                '^IRX',
                start=start_dt.strftime('%Y-%m-%d'),
                end=end_dt.strftime('%Y-%m-%d'),
                progress=False
            )
            if tbill.empty:
                raise ValueError("No T-Bill data returned from Yahoo Finance")

            # Handle MultiIndex columns from newer yfinance
            if isinstance(tbill.columns, pd.MultiIndex):
                tbill = tbill.droplevel(1, axis=1)

            tbill = tbill.reset_index()
            # Handle column names robustly
            if 'Close' in tbill.columns:
                tbill = tbill.rename(columns={'Close': 'TB_Rate'})
            elif len(tbill.columns) >= 2:
                tbill.columns = ['Date'] + ['TB_Rate'] + [f'TB_{i}' for i in range(len(tbill.columns)-2)]
        except Exception as e:
            raise RuntimeError(f"Failed to fetch T-Bill data: {e}")

        # Merge
        market = sp500tr[['Date', 'SPX_Close']].merge(
            tbill[['Date', 'TB_Rate']],
            on='Date',
            how='left'
        )
        market['Date'] = pd.to_datetime(market['Date'])
        market['TB_Rate'] = market['TB_Rate'].ffill().bfill()

        # Cache
        if self.cache_market_data:
            self._market_data_cache = market
            self._cache_date_range = (start_date, end_date)

        return market

    def _merge_data(self, portfolio_df: pd.DataFrame, market_df: pd.DataFrame) -> pd.DataFrame:
        """Merge portfolio and market data"""
        # Normalize SPX to start at same value as portfolio
        spx_start = market_df['SPX_Close'].iloc[0]
        port_start = portfolio_df['Portfolio_Value'].iloc[0]
        market_df = market_df.copy()
        market_df['SPX_Value'] = market_df['SPX_Close'] / spx_start * port_start
        market_df['SPX_Return'] = market_df['SPX_Close'].pct_change(fill_method=None)

        # Merge
        merged = portfolio_df.merge(
            market_df[['Date', 'SPX_Value', 'SPX_Return', 'TB_Rate']],
            on='Date',
            how='left'
        )

        # Fill missing values (forward-fill for market data gaps like holidays)
        merged['SPX_Return'] = merged['SPX_Return'].ffill().fillna(0)
        merged['TB_Rate'] = merged['TB_Rate'].ffill().bfill()

        return merged

    def _auto_generate_periods(
        self,
        df: pd.DataFrame,
        as_of_date: str
    ) -> Dict[str, Tuple[str, str]]:
        """Auto-generate analysis periods based on available data"""
        as_of = pd.to_datetime(as_of_date)
        data_start = df['Date'].min()

        periods = {}

        # YTD
        ytd_start = datetime(as_of.year, 1, 1)
        if data_start <= ytd_start:
            # Find last trading day of previous year
            prev_year_end = df[df['Date'] < ytd_start]['Date'].max()
            if pd.notna(prev_year_end):
                periods['YTD'] = (prev_year_end.strftime('%Y-%m-%d'), as_of_date)

        # Previous full years
        for year in range(as_of.year - 1, as_of.year - 5, -1):
            year_start = datetime(year, 1, 1)
            year_end = datetime(year, 12, 31)

            if data_start <= year_start:
                # Find actual trading day boundaries
                prev_year_end = df[df['Date'] < year_start]['Date'].max()
                curr_year_end = df[df['Date'] <= year_end]['Date'].max()

                if pd.notna(prev_year_end) and pd.notna(curr_year_end):
                    periods[str(year)] = (
                        prev_year_end.strftime('%Y-%m-%d'),
                        curr_year_end.strftime('%Y-%m-%d')
                    )

        return periods

    # -------------------------------------------------------------------------
    # METRIC CALCULATIONS
    # -------------------------------------------------------------------------

    def _get_period_data(
        self,
        df: pd.DataFrame,
        start_date: str,
        end_date: str
    ) -> pd.DataFrame:
        """Filter data for a specific period"""
        start = pd.to_datetime(start_date)
        end = pd.to_datetime(end_date)
        return df[(df['Date'] >= start) & (df['Date'] <= end)].copy()

    def _get_monthly_data(
        self,
        df: pd.DataFrame,
        start_date: str,
        end_date: str
    ) -> pd.DataFrame:
        """Resample to monthly data"""
        period_df = self._get_period_data(df, start_date, end_date)

        period_df['YearMonth'] = period_df['Date'].dt.to_period('M')
        monthly = period_df.groupby('YearMonth').agg({
            'Portfolio_Value': 'last',
            'SPX_Value': 'last',
            'TB_Rate': 'mean'
        }).reset_index()

        monthly['Port_Return'] = monthly['Portfolio_Value'].pct_change(fill_method=None)
        monthly['SPX_Return'] = monthly['SPX_Value'].pct_change(fill_method=None)
        monthly['RF_Monthly'] = monthly['TB_Rate'] / 100 / 12
        monthly['Port_Excess'] = monthly['Port_Return'] - monthly['RF_Monthly']
        monthly['SPX_Excess'] = monthly['SPX_Return'] - monthly['RF_Monthly']

        return monthly

    def _calculate_period_metrics(
        self,
        df: pd.DataFrame,
        period_name: str,
        start_date: str,
        end_date: str
    ) -> PeriodMetrics:
        """Calculate all metrics for a single period - matching Kwanti format"""

        period_df = self._get_period_data(df, start_date, end_date)
        monthly = self._get_monthly_data(df, start_date, end_date)

        # Returns
        port_return = (period_df['Portfolio_Value'].iloc[-1] /
                      period_df['Portfolio_Value'].iloc[0]) - 1
        spx_return = (period_df['SPX_Value'].iloc[-1] /
                     period_df['SPX_Value'].iloc[0]) - 1

        # Risk-free rate (average for period)
        rf_annual = monthly['TB_Rate'].mean() / 100

        # Standard deviation (annualized from monthly)
        port_std = monthly['Port_Return'].dropna().std() * np.sqrt(12)
        spx_std = monthly['SPX_Return'].dropna().std() * np.sqrt(12)

        # Beta - Portfolio vs Benchmark
        returns = monthly[['Port_Excess', 'SPX_Excess']].dropna()
        if len(returns) >= 3:
            cov = returns['Port_Excess'].cov(returns['SPX_Excess'])
            var = returns['SPX_Excess'].var()
            port_beta = cov / var if var != 0 else np.nan
        else:
            port_beta = np.nan

        # Benchmark beta vs itself (Kwanti shows ~0.99-1.00)
        # This represents how the benchmark tracks itself (should be ~1.0)
        spx_beta = 1.0

        # Alpha (annualized) - Portfolio
        if len(returns) >= 3 and not np.isnan(port_beta):
            avg_port_excess = returns['Port_Excess'].mean()
            avg_spx_excess = returns['SPX_Excess'].mean()
            port_alpha = (avg_port_excess - port_beta * avg_spx_excess) * 12
        else:
            port_alpha = np.nan

        # Benchmark alpha vs itself is 0 by definition
        # Alpha = Excess Return - (Beta * Benchmark Excess Return)
        # For benchmark: Alpha = Benchmark Excess - (1.0 * Benchmark Excess) = 0
        spx_alpha = 0.0

        # Sharpe ratios
        port_sharpe = (port_return - rf_annual) / port_std if port_std > 0 else np.nan
        spx_sharpe = (spx_return - rf_annual) / spx_std if spx_std > 0 else np.nan

        # Max drawdown (daily)
        port_peak = period_df['Portfolio_Value'].expanding().max()
        port_dd = (period_df['Portfolio_Value'] / port_peak - 1).min()

        spx_peak = period_df['SPX_Value'].expanding().max()
        spx_dd = (period_df['SPX_Value'] / spx_peak - 1).min()

        # Capture ratios - Portfolio
        returns = monthly[['Port_Return', 'SPX_Return']].dropna()

        up_months = returns[returns['SPX_Return'] > 0]
        if len(up_months) > 0:
            port_up_ret = (1 + up_months['Port_Return']).prod() - 1
            spx_up_ret = (1 + up_months['SPX_Return']).prod() - 1
            port_up_capture = port_up_ret / spx_up_ret if spx_up_ret != 0 else np.nan
            # Benchmark captures 100% of itself by definition
            spx_up_capture = 1.0
        else:
            port_up_capture = np.nan
            spx_up_capture = np.nan

        down_months = returns[returns['SPX_Return'] < 0]
        if len(down_months) > 0:
            port_down_ret = (1 + down_months['Port_Return']).prod() - 1
            spx_down_ret = (1 + down_months['SPX_Return']).prod() - 1
            port_down_capture = port_down_ret / spx_down_ret if spx_down_ret != 0 else np.nan
            # Benchmark captures 100% of itself by definition
            spx_down_capture = 1.0
        else:
            port_down_capture = np.nan
            spx_down_capture = np.nan

        return PeriodMetrics(
            period_name=period_name,
            start_date=start_date,
            end_date=end_date,
            portfolio_return=round(port_return, 4),
            benchmark_return=round(spx_return, 4),
            excess_return=round(port_return - spx_return, 4),
            # Portfolio metrics
            portfolio_std_dev=round(port_std, 4) if not np.isnan(port_std) else None,
            portfolio_alpha=round(port_alpha, 4) if not np.isnan(port_alpha) else None,
            portfolio_beta=round(port_beta, 2) if not np.isnan(port_beta) else None,
            portfolio_sharpe_ratio=round(port_sharpe, 2) if not np.isnan(port_sharpe) else None,
            portfolio_max_drawdown=round(port_dd, 4) if not np.isnan(port_dd) else None,
            portfolio_up_capture=round(port_up_capture, 2) if not np.isnan(port_up_capture) else None,
            portfolio_down_capture=round(port_down_capture, 2) if not np.isnan(port_down_capture) else None,
            # Benchmark metrics
            benchmark_std_dev=round(spx_std, 4) if not np.isnan(spx_std) else None,
            benchmark_alpha=round(spx_alpha, 4) if not np.isnan(spx_alpha) else None,
            benchmark_beta=round(spx_beta, 2),
            benchmark_sharpe_ratio=round(spx_sharpe, 2) if not np.isnan(spx_sharpe) else None,
            benchmark_max_drawdown=round(spx_dd, 4) if not np.isnan(spx_dd) else None,
            benchmark_up_capture=round(spx_up_capture, 2) if not np.isnan(spx_up_capture) else None,
            benchmark_down_capture=round(spx_down_capture, 2) if not np.isnan(spx_down_capture) else None,
            # Context
            risk_free_rate=round(rf_annual, 4),
            num_months=len(monthly) - 1  # -1 because first month has no return
        )

    def _get_methodology(self) -> Dict[str, str]:
        """Return methodology documentation"""
        return {
            "benchmark": "S&P 500 Total Return Index (^SP500TR) - includes dividends",
            "risk_free_rate": "3-Month Treasury Bill (^IRX) - historical rates",
            "return_frequency": "Monthly returns for Std Dev, Beta, Alpha, Capture; Daily for Max Drawdown",
            "std_dev_annualization": "Monthly Std Dev x sqrt(12)",
            "alpha_annualization": "Monthly Alpha x 12",
            "beta_formula": "Cov(Portfolio Excess, Benchmark Excess) / Var(Benchmark Excess)",
            "sharpe_formula": "(Return - Risk Free Rate) / Std Dev",
            "capture_formula": "Compound return in up/down months divided by benchmark",
            "data_source": "Yahoo Finance (yfinance)"
        }

    def _generate_chart_data(
        self,
        merged_df: pd.DataFrame,
        portfolio_name: str,
        chart_start_date: Optional[str] = None
    ) -> ChartData:
        """
        Generate cumulative price chart data normalized to 100 at start.

        Args:
            merged_df: Merged portfolio and benchmark data
            portfolio_name: Name of the portfolio
            chart_start_date: Start date for chart (default: 3 years back or data start)

        Returns:
            ChartData object with normalized values
        """
        df = merged_df.copy()

        # Determine chart start date (default: 3 years back from end, or data start)
        if chart_start_date:
            start = pd.to_datetime(chart_start_date)
        else:
            # Default to 3 years back or data start, whichever is later
            three_years_back = df['Date'].max() - pd.DateOffset(years=3)
            data_start = df['Date'].min()
            start = max(three_years_back, data_start)

        # Filter to chart period
        df = df[df['Date'] >= start].copy()

        if df.empty:
            return None

        # Calculate cumulative returns from 0 (Kwanti style)
        # e.g., 0.0 at start, 1.10 means +110% return
        port_start = df['Portfolio_Value'].iloc[0]
        spx_start = df['SPX_Value'].iloc[0]

        df['Port_CumulReturn'] = (df['Portfolio_Value'] / port_start) - 1
        df['SPX_CumulReturn'] = (df['SPX_Value'] / spx_start) - 1

        # Convert to lists for JSON serialization
        dates = df['Date'].dt.strftime('%Y-%m-%d').tolist()
        portfolio_returns = df['Port_CumulReturn'].round(4).tolist()
        benchmark_returns = df['SPX_CumulReturn'].round(4).tolist()

        return ChartData(
            dates=dates,
            portfolio_returns=portfolio_returns,
            benchmark_returns=benchmark_returns,
            portfolio_name=portfolio_name,
            benchmark_name="S&P 500 TR",
            start_date=dates[0],
            end_date=dates[-1]
        )

    def get_chart_data(
        self,
        portfolio_data: pd.DataFrame,
        portfolio_name: str = "Portfolio",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> ChartData:
        """
        Get chart data without running full analysis.
        Useful for generating charts independently.

        Args:
            portfolio_data: DataFrame with portfolio values
            portfolio_name: Name for the portfolio
            start_date: Chart start date (YYYY-MM-DD)
            end_date: Chart end date (YYYY-MM-DD)

        Returns:
            ChartData object
        """
        df = self._prepare_portfolio_data(portfolio_data)

        if end_date is None:
            end_date = df['Date'].max().strftime('%Y-%m-%d')

        market_df = self._fetch_market_data(
            df['Date'].min().strftime('%Y-%m-%d'),
            end_date
        )

        merged_df = self._merge_data(df, market_df)

        return self._generate_chart_data(merged_df, portfolio_name, start_date)


# =============================================================================
# CONVENIENCE FUNCTIONS FOR API
# =============================================================================

def analyze_portfolio(
    csv_data: str,
    portfolio_name: str = "Portfolio",
    as_of_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main entry point for API calls.

    Args:
        csv_data: CSV string data
        portfolio_name: Name for the portfolio
        as_of_date: Analysis date (YYYY-MM-DD format)

    Returns:
        Dictionary with analysis results (JSON-serializable)
    """
    analyzer = PortfolioAnalyzer()
    result = analyzer.analyze_from_csv_string(
        csv_data,
        portfolio_name=portfolio_name,
        as_of_date=as_of_date
    )
    return result.to_dict()


def analyze_portfolio_file(
    file_path: str,
    portfolio_name: str = "Portfolio",
    as_of_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze from file path.

    Args:
        file_path: Path to CSV file
        portfolio_name: Name for the portfolio
        as_of_date: Analysis date (YYYY-MM-DD format)

    Returns:
        Dictionary with analysis results
    """
    analyzer = PortfolioAnalyzer()
    result = analyzer.analyze_from_csv(
        file_path,
        portfolio_name=portfolio_name,
        as_of_date=as_of_date
    )
    return result.to_dict()


# =============================================================================
# CLI / DEMO
# =============================================================================

def print_individual_report(result: AnalysisResult, portfolio_display_name: str = None):
    """Print Kwanti-style individual portfolio report"""

    # Helper to format values
    def fmt_pct(val, decimals=1):
        return f"{val*100:.{decimals}f}%" if val is not None else "-"

    def fmt_num(val, decimals=2):
        return f"{val:.{decimals}f}" if val is not None else "-"

    display_name = portfolio_display_name or result.portfolio_name

    # Print header
    print(f"\n{display_name}")
    print(f"Generated: {result.generated_at}")
    print(f"Data: {result.data_start_date} to {result.data_end_date}")

    # Get period names for column headers
    periods = result.periods
    period_names = [p.period_name for p in periods]
    col_width = 12

    # ==================== PERIODIC RETURNS ====================
    print("\n" + "=" * 70)
    print("PERIODIC RETURNS")
    print("=" * 70)

    # Header row
    header = f"{'':30}" + "".join([f"{p:>{col_width}}" for p in period_names])
    print(header)
    print("-" * 70)

    # Portfolio row
    row = f"{display_name[:30]:30}"
    for p in periods:
        row += f"{fmt_pct(p.portfolio_return, 2):>{col_width}}"
    print(row)

    # Benchmark row
    row = f"{'S&P 500 TR':30}"
    for p in periods:
        row += f"{fmt_pct(p.benchmark_return, 2):>{col_width}}"
    print(row)

    # ==================== RISK METRICS (Kwanti Style) ====================
    print("\n" + "=" * 70)
    print("RISK METRICS")
    print("=" * 70)

    # Header
    print(f"{'':30}" + "".join([f"{p:>{col_width}}" for p in period_names]))
    print("-" * 70)

    # Risk (Standard Deviation)
    print("\nRisk (standard deviation)")
    row = f"{'  ' + display_name[:28]:30}"
    for p in periods:
        row += f"{fmt_pct(p.portfolio_std_dev):>{col_width}}"
    print(row)
    row = f"{'  S&P 500 TR':30}"
    for p in periods:
        row += f"{fmt_pct(p.benchmark_std_dev):>{col_width}}"
    print(row)

    # Alpha
    print("\nAlpha")
    row = f"{'  ' + display_name[:28]:30}"
    for p in periods:
        row += f"{fmt_pct(p.portfolio_alpha):>{col_width}}"
    print(row)
    row = f"{'  S&P 500 TR':30}"
    for p in periods:
        row += f"{fmt_pct(p.benchmark_alpha):>{col_width}}"
    print(row)

    # Beta
    print("\nBeta")
    row = f"{'  ' + display_name[:28]:30}"
    for p in periods:
        row += f"{fmt_num(p.portfolio_beta):>{col_width}}"
    print(row)
    row = f"{'  S&P 500 TR':30}"
    for p in periods:
        row += f"{fmt_num(p.benchmark_beta):>{col_width}}"
    print(row)

    # Sharpe Ratio
    print("\nSharpe ratio")
    row = f"{'  ' + display_name[:28]:30}"
    for p in periods:
        row += f"{fmt_num(p.portfolio_sharpe_ratio):>{col_width}}"
    print(row)
    row = f"{'  S&P 500 TR':30}"
    for p in periods:
        row += f"{fmt_num(p.benchmark_sharpe_ratio):>{col_width}}"
    print(row)

    # Maximum Drawdown
    print("\nMaximum drawdown")
    row = f"{'  ' + display_name[:28]:30}"
    for p in periods:
        row += f"{fmt_pct(p.portfolio_max_drawdown):>{col_width}}"
    print(row)
    row = f"{'  S&P 500 TR':30}"
    for p in periods:
        row += f"{fmt_pct(p.benchmark_max_drawdown):>{col_width}}"
    print(row)

    # Up Capture Ratio
    print("\nUp capture ratio")
    row = f"{'  ' + display_name[:28]:30}"
    for p in periods:
        row += f"{fmt_num(p.portfolio_up_capture):>{col_width}}"
    print(row)
    row = f"{'  S&P 500 TR':30}"
    for p in periods:
        row += f"{fmt_num(p.benchmark_up_capture):>{col_width}}"
    print(row)

    # Down Capture Ratio
    print("\nDown capture ratio")
    row = f"{'  ' + display_name[:28]:30}"
    for p in periods:
        row += f"{fmt_num(p.portfolio_down_capture):>{col_width}}"
    print(row)
    row = f"{'  S&P 500 TR':30}"
    for p in periods:
        row += f"{fmt_num(p.benchmark_down_capture):>{col_width}}"
    print(row)

    # ==================== 3Y CUMULATIVE ====================
    if result.cumulative_3y:
        print("\n" + "=" * 70)
        print("3-YEAR CUMULATIVE")
        print("=" * 70)
        p = result.cumulative_3y
        print(f"{'Portfolio Return:':<30} {fmt_pct(p.portfolio_return, 2)}")
        print(f"{'Benchmark Return:':<30} {fmt_pct(p.benchmark_return, 2)}")
        print(f"{'Excess Return:':<30} {fmt_pct(p.excess_return, 2)}")
        print(f"{'Alpha:':<30} {fmt_pct(p.portfolio_alpha)}")
        print(f"{'Beta:':<30} {fmt_num(p.portfolio_beta)}")
        print(f"{'Sharpe Ratio:':<30} {fmt_num(p.portfolio_sharpe_ratio)}")
        print(f"{'Max Drawdown:':<30} {fmt_pct(p.portfolio_max_drawdown)}")

    # ==================== RISK-FREE RATES ====================
    print("\n" + "=" * 70)
    print("RISK-FREE RATES (3-Month T-Bill)")
    print("=" * 70)
    row = f"{'':30}"
    for p in periods:
        row += f"{fmt_pct(p.risk_free_rate, 2):>{col_width}}"
    print(row)

    # ==================== WARNINGS ====================
    if result.warnings:
        print("\n" + "=" * 70)
        print("WARNINGS")
        print("=" * 70)
        for w in result.warnings:
            print(f"  - {w}")


def print_comparison_report(multi_result: MultiPortfolioResult):
    """Print side-by-side comparison of all portfolios"""

    def fmt_pct(val, decimals=1):
        return f"{val*100:.{decimals}f}%" if val is not None else "-"

    def fmt_num(val, decimals=2):
        return f"{val:.{decimals}f}" if val is not None else "-"

    comparison = multi_result.comparison
    portfolio_names = comparison["portfolio_names"]
    period_names = comparison["period_names"]

    # Calculate column width based on portfolio names
    col_width = max(14, max(len(name) for name in portfolio_names) + 2)

    print("\n" + "=" * 90)
    print("MULTI-PORTFOLIO COMPARISON")
    print("=" * 90)
    print(f"As of: {multi_result.as_of_date}")
    print(f"Generated: {multi_result.generated_at}")

    # For each period, show all portfolios side-by-side
    for period_name in period_names:
        print("\n" + "-" * 90)
        print(f"  {period_name}")
        print("-" * 90)

        # Header with portfolio names
        header = f"{'Metric':20}" + "".join([f"{name:>{col_width}}" for name in portfolio_names]) + f"{'S&P 500 TR':>{col_width}}"
        print(header)
        print("-" * 90)

        # Each metric
        metrics_display = [
            ("return", "Return", fmt_pct, 2),
            ("std_dev", "Std Dev", fmt_pct, 1),
            ("alpha", "Alpha", fmt_pct, 1),
            ("beta", "Beta", fmt_num, 2),
            ("sharpe", "Sharpe", fmt_num, 2),
            ("max_drawdown", "Max Drawdown", fmt_pct, 1),
            ("up_capture", "Up Capture", fmt_num, 2),
            ("down_capture", "Down Capture", fmt_num, 2),
        ]

        for metric_key, display_name, fmt_func, decimals in metrics_display:
            row = f"{display_name:20}"

            metric_data = comparison["metrics"][metric_key]["by_period"].get(period_name, {})
            benchmark_val = comparison["metrics"][metric_key]["benchmark"].get(period_name)

            for port_name in portfolio_names:
                val = metric_data.get(port_name)
                row += f"{fmt_func(val, decimals):>{col_width}}"

            row += f"{fmt_func(benchmark_val, decimals):>{col_width}}"
            print(row)

    # 3Y Cumulative comparison
    if "cumulative_3y" in comparison:
        print("\n" + "-" * 90)
        print("  3-YEAR CUMULATIVE")
        print("-" * 90)

        header = f"{'Metric':20}" + "".join([f"{name:>{col_width}}" for name in portfolio_names])
        print(header)
        print("-" * 90)

        cum_metrics = [
            ("return", "Return", fmt_pct, 2),
            ("std_dev", "Std Dev", fmt_pct, 1),
            ("alpha", "Alpha", fmt_pct, 1),
            ("beta", "Beta", fmt_num, 2),
            ("sharpe", "Sharpe", fmt_num, 2),
            ("max_drawdown", "Max Drawdown", fmt_pct, 1),
        ]

        for metric_key, display_name, fmt_func, decimals in cum_metrics:
            row = f"{display_name:20}"
            for port_name in portfolio_names:
                val = comparison["cumulative_3y"].get(port_name, {}).get(metric_key)
                row += f"{fmt_func(val, decimals):>{col_width}}"
            print(row)


if __name__ == "__main__":
    import sys

    # Default file path for testing
    DEFAULT_CSV = r"G:\My Drive\Clockwise\stats\Clockwise Portfolios.csv"

    # Parse arguments (filter out flags)
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    csv_path = args[0] if len(args) > 0 else DEFAULT_CSV
    as_of_date = args[1] if len(args) > 1 else "2025-12-05"
    multi_mode = "--multi" in sys.argv

    print(f"Analyzing: {csv_path}")
    print(f"As of: {as_of_date}")
    print(f"Mode: {'Multi-Portfolio' if multi_mode else 'Single Portfolio'}")
    print("=" * 70)

    # Run analysis
    analyzer = PortfolioAnalyzer()

    if multi_mode:
        # Multi-portfolio analysis
        result = analyzer.analyze_multi_portfolio(
            csv_path,
            as_of_date=as_of_date
        )

        # Print comparison view first
        print_comparison_report(result)

        # Then print individual reports for each portfolio
        print("\n\n" + "#" * 90)
        print("# INDIVIDUAL PORTFOLIO REPORTS (Kwanti Style)")
        print("#" * 90)

        for port_name, port_result in result.portfolios.items():
            print("\n" + "#" * 90)
            print_individual_report(port_result, port_name)

        # Print JSON at end
        print("\n" + "=" * 90)
        print("JSON OUTPUT (for API)")
        print("=" * 90)
        print(result.to_json())

    else:
        # Single portfolio analysis (original behavior)
        result = analyzer.analyze_from_csv(
            csv_path,
            portfolio_name="Clockwise Max Growth ('25)",
            as_of_date=as_of_date
        )

        # Print individual report
        print_individual_report(result, "Clockwise Max Growth")

        # Print JSON
        print("\n" + "=" * 70)
        print("JSON OUTPUT (for API)")
        print("=" * 70)
        print(result.to_json())