/**
 * Portfolio Performance PDF Generator
 * 
 * Generates Kwanti-style PDF reports for portfolio performance metrics.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { MultiPortfolioResult, PeriodMetrics } from './portfolio-metrics'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number }
  }
}

/**
 * Format percentage value for display
 */
function formatPct(value: number | null, decimals: number = 1): string {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format numeric value for display
 */
function formatNum(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined) return '-'
  return value.toFixed(decimals)
}

/**
 * Generate PDF for a single portfolio (Kwanti-style)
 */
export function generatePortfolioPDF(
  data: MultiPortfolioResult,
  portfolioName: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = 20
  
  const portfolioResult = data.portfolios[portfolioName]
  if (!portfolioResult) {
    doc.text('Portfolio not found', margin, yPos)
    return doc
  }
  
  const periods = portfolioResult.periods
  const periodNames = periods.map(p => p.periodName)
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Performance', margin, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`As of ${data.asOfDate}`, margin, yPos)
  
  yPos += 3
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos)
  
  // Portfolio name
  yPos += 10
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(portfolioName, margin, yPos)
  
  // Periodic Returns Section
  yPos += 12
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Periodic Returns', margin, yPos)
  
  yPos += 5
  
  // Returns table
  const returnsData = [
    [
      { content: portfolioName, styles: { fontStyle: 'bold' as const } },
      ...periods.map(p => formatPct(p.portfolioReturn, 2))
    ],
    [
      { content: '$SPX', styles: { textColor: [150, 100, 50] as [number, number, number] } },
      ...periods.map(p => formatPct(p.benchmarkReturn, 2))
    ]
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [['', ...periodNames]],
    body: returnsData as unknown as (string | object)[][],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [100, 100, 100],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 50 }
    },
    margin: { left: margin, right: margin }
  })
  
  yPos = doc.lastAutoTable.finalY + 10
  
  // Risk Metrics Section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Risk Metrics', margin, yPos)
  
  yPos += 5
  
  // Define metrics configuration
  const metricsConfig: Array<{
    label: string
    portfolioKey: keyof PeriodMetrics
    benchmarkKey: keyof PeriodMetrics
    formatter: (v: number | null) => string
  }> = [
    { label: 'Risk (standard deviation)', portfolioKey: 'portfolioStdDev', benchmarkKey: 'benchmarkStdDev', formatter: (v) => formatPct(v, 1) },
    { label: 'Alpha', portfolioKey: 'portfolioAlpha', benchmarkKey: 'benchmarkAlpha', formatter: (v) => formatPct(v, 1) },
    { label: 'Beta', portfolioKey: 'portfolioBeta', benchmarkKey: 'benchmarkBeta', formatter: (v) => formatNum(v, 2) },
    { label: 'Sharpe ratio', portfolioKey: 'portfolioSharpeRatio', benchmarkKey: 'benchmarkSharpeRatio', formatter: (v) => formatNum(v, 2) },
    { label: 'Maximum drawdown', portfolioKey: 'portfolioMaxDrawdown', benchmarkKey: 'benchmarkMaxDrawdown', formatter: (v) => formatPct(v, 1) },
    { label: 'Up capture ratio', portfolioKey: 'portfolioUpCapture', benchmarkKey: 'benchmarkUpCapture', formatter: (v) => formatNum(v, 2) },
    { label: 'Down capture ratio', portfolioKey: 'portfolioDownCapture', benchmarkKey: 'benchmarkDownCapture', formatter: (v) => formatNum(v, 2) }
  ]
  
  // Build risk metrics table data
  const riskMetricsData: (string | object)[][] = []
  
  for (const metric of metricsConfig) {
    // Metric label row
    riskMetricsData.push([
      { content: metric.label, styles: { fontStyle: 'bold' as const, fillColor: [250, 250, 250] as [number, number, number] } },
      ...periodNames.map(() => ({ content: '', styles: { fillColor: [250, 250, 250] as [number, number, number] } }))
    ])
    
    // Portfolio value row
    riskMetricsData.push([
      `  ${portfolioName}`,
      ...periods.map(p => metric.formatter(p[metric.portfolioKey] as number | null))
    ])
    
    // Benchmark value row
    riskMetricsData.push([
      { content: '  $SPX', styles: { textColor: [150, 100, 50] as [number, number, number] } },
      ...periods.map(p => metric.formatter(p[metric.benchmarkKey] as number | null))
    ])
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['', ...periodNames]],
    body: riskMetricsData as unknown as (string | object)[][],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [100, 100, 100],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 50 }
    },
    margin: { left: margin, right: margin }
  })
  
  yPos = doc.lastAutoTable.finalY + 10
  
  // 3Y Cumulative Section (if available)
  if (portfolioResult.cumulative3Y) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('3-Year Cumulative', margin, yPos)
    
    yPos += 5
    
    const cum3YData = [
      ['Return', formatPct(portfolioResult.cumulative3Y.portfolioReturn, 2)],
      ['Alpha', formatPct(portfolioResult.cumulative3Y.portfolioAlpha, 2)],
      ['Beta', formatNum(portfolioResult.cumulative3Y.portfolioBeta)],
      ['Sharpe Ratio', formatNum(portfolioResult.cumulative3Y.portfolioSharpeRatio)],
      ['Max Drawdown', formatPct(portfolioResult.cumulative3Y.portfolioMaxDrawdown, 1)]
    ]
    
    autoTable(doc, {
      startY: yPos,
      body: cum3YData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 30 }
      },
      margin: { left: margin, right: margin }
    })
    
    yPos = doc.lastAutoTable.finalY + 10
  }
  
  // Benchmark note
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(
    'The benchmark used to calculate alpha, beta, capture ratio is: S&P 500 Index TR',
    margin,
    yPos
  )
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Clockwise Capital', margin, footerY)
  doc.text(
    `Data: ${portfolioResult.dataStartDate} to ${portfolioResult.dataEndDate}`,
    pageWidth - margin,
    footerY,
    { align: 'right' }
  )
  
  return doc
}

/**
 * Generate comparison PDF with all portfolios
 */
export function generateComparisonPDF(data: MultiPortfolioResult): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = 20
  
  const { comparison } = data
  const portfolioNames = comparison.portfolioNames
  const periodNames = comparison.periodNames
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Portfolio Comparison', margin, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`As of ${data.asOfDate}`, margin, yPos)
  
  yPos += 3
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos)
  
  // For each period
  for (const periodName of periodNames) {
    yPos += 12
    
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(periodName, margin, yPos)
    
    yPos += 5
    
    // Build table data
    const tableData: string[][] = []
    const metricsDisplay: Array<[string, string, boolean]> = [
      ['return', 'Return', true],
      ['stdDev', 'Std Dev', true],
      ['alpha', 'Alpha', true],
      ['beta', 'Beta', false],
      ['sharpe', 'Sharpe', false],
      ['maxDrawdown', 'Max Drawdown', true],
      ['upCapture', 'Up Capture', false],
      ['downCapture', 'Down Capture', false]
    ]
    
    for (const [key, label, isPct] of metricsDisplay) {
      const metric = comparison.metrics[key]
      if (!metric) continue
      
      const row = [label]
      for (const portName of portfolioNames) {
        const value = metric.byPeriod[periodName]?.[portName]
        row.push(isPct ? formatPct(value, 1) : formatNum(value))
      }
      // Add benchmark
      const benchValue = metric.benchmark[periodName]
      row.push(isPct ? formatPct(benchValue, 1) : formatNum(benchValue))
      
      tableData.push(row)
    }
    
    // Shorten portfolio names for table headers
    const shortNames = portfolioNames.map(n => n.replace('Clockwise ', ''))
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', ...shortNames, 'S&P 500 TR']],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 35 }
      },
      margin: { left: margin, right: margin }
    })
    
    yPos = doc.lastAutoTable.finalY + 5
  }
  
  // Footer on last page
  const footerY = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Clockwise Capital', margin, footerY)
  doc.text(
    `Data: ${data.dataStartDate} to ${data.dataEndDate}`,
    pageWidth - margin,
    footerY,
    { align: 'right' }
  )
  
  return doc
}

/**
 * Download PDF with given filename
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename)
}

/**
 * Generate and download individual portfolio PDF
 */
export function downloadPortfolioPDF(
  data: MultiPortfolioResult,
  portfolioName: string
): void {
  const doc = generatePortfolioPDF(data, portfolioName)
  const safeName = portfolioName.replace(/[^a-zA-Z0-9]/g, '_')
  const dateStr = data.asOfDate.replace(/-/g, '')
  downloadPDF(doc, `${safeName}_Performance_${dateStr}.pdf`)
}

/**
 * Generate and download comparison PDF
 */
export function downloadComparisonPDF(data: MultiPortfolioResult): void {
  const doc = generateComparisonPDF(data)
  const dateStr = data.asOfDate.replace(/-/g, '')
  downloadPDF(doc, `Clockwise_Portfolio_Comparison_${dateStr}.pdf`)
}

