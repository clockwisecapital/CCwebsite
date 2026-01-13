'use client';

import React from 'react';

interface TimelineMarker {
  year: string;
  label: string;
  isCurrent?: boolean;
  isAnalog?: boolean;
}

interface HistoricalTimelineProps {
  startYear: string;
  endYear: string;
  currentYear?: string;
  analogPeriod?: {
    start: string;
    end: string;
    label?: string;
  };
  markers?: TimelineMarker[];
}

export default function HistoricalTimeline({ 
  startYear, 
  endYear, 
  currentYear,
  analogPeriod,
  markers = []
}: HistoricalTimelineProps) {
  // Calculate positions (0-100%)
  const today = new Date().getFullYear();
  const start = parseInt(startYear);
  const end = endYear === 'Present' ? today : parseInt(endYear.replace('?', ''));
  const current = currentYear ? parseInt(currentYear) : today;
  const totalYears = end - start;

  const getPosition = (year: string) => {
    const y = parseInt(year);
    // Clamp position between 0 and 100
    return Math.max(0, Math.min(100, ((y - start) / totalYears) * 100));
  };

  const currentPos = Math.max(0, Math.min(100, ((current - start) / totalYears) * 100));

  return (
    <div className="w-full py-6">
      {/* Timeline Bar */}
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        {/* Full period gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700" />
        
        {/* Analog period highlight */}
        {analogPeriod && (
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-75"
            style={{
              left: `${getPosition(analogPeriod.start)}%`,
              width: `${getPosition(analogPeriod.end) - getPosition(analogPeriod.start)}%`
            }}
          />
        )}

        {/* Current position marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-400 shadow-lg shadow-teal-400/50"
          style={{ left: `${currentPos}%` }}
        />
      </div>

      {/* Year Labels */}
      <div className="relative mt-3 flex justify-between items-start text-xs">
        {/* Start Year */}
        <div className="text-left">
          <p className="font-bold text-gray-300">{startYear}</p>
          <p className="text-gray-500">Period Start</p>
        </div>

        {/* Current Year */}
        <div 
          className="absolute -translate-x-1/2"
          style={{ left: `${currentPos}%` }}
        >
          <div className="text-center">
            <div className="inline-block px-2 py-1 bg-teal-500/20 border border-teal-500/50 rounded-md mb-1">
              <p className="font-bold text-teal-400">{current}</p>
            </div>
            <p className="text-teal-400 font-semibold whitespace-nowrap">Today</p>
          </div>
        </div>

        {/* End Year */}
        <div className="text-right">
          <p className="font-bold text-gray-300">{endYear}</p>
          <p className="text-gray-500">Period End</p>
        </div>
      </div>

      {/* Analog Period Label */}
      {analogPeriod && (
        <div 
          className="relative mt-4"
          style={{ 
            marginLeft: `${getPosition(analogPeriod.start)}%`,
            width: `${getPosition(analogPeriod.end) - getPosition(analogPeriod.start)}%`
          }}
        >
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <p className="text-xs font-semibold text-purple-300">
                {analogPeriod.label || `Analog: ${analogPeriod.start}-${analogPeriod.end}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Markers */}
      {markers.length > 0 && (
        <div className="relative mt-2">
          {markers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{ left: `${getPosition(marker.year)}%` }}
            >
              <div className="relative -translate-x-1/2">
                <div className={`w-2 h-2 rounded-full ${
                  marker.isCurrent ? 'bg-teal-400' : 
                  marker.isAnalog ? 'bg-purple-400' : 
                  'bg-gray-400'
                }`} />
                <p className="text-xs text-gray-400 whitespace-nowrap mt-1 -translate-x-1/2">
                  {marker.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-xs">
        {analogPeriod && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
            <span className="text-gray-400">Historical Analog Period</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-teal-400 rounded" />
          <span className="text-gray-400">Current Date</span>
        </div>
      </div>
    </div>
  );
}
