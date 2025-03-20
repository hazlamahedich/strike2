import React, { useState } from 'react';

interface LeadScoreDisplayProps {
  score: number;
  aiPowered: boolean;
  reasonCodes?: string[];
}

export default function LeadScoreDisplay({ 
  score, 
  aiPowered, 
  reasonCodes = [] 
}: LeadScoreDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getScoreColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-green-400';
    if (score >= 40) return 'bg-yellow-400';
    if (score >= 20) return 'bg-orange-400';
    return 'bg-red-500';
  };

  return (
    <div className="relative">
      <div 
        className="relative h-6 w-6 rounded-full flex items-center justify-center bg-gray-200 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div 
          className={`absolute inset-0 rounded-full ${getScoreColor()}`} 
          style={{ clipPath: `inset(0 ${100 - score}% 0 0)` }} 
        />
        <span className="relative text-xs font-semibold text-white">
          {Math.round(score / 10)}
        </span>
        {!aiPowered && (
          <div 
            className="absolute -top-1 -right-1 h-3 w-3 bg-gray-500 rounded-full border border-white" 
            title="Rule-based score" 
          />
        )}
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white shadow-lg rounded p-3 z-10">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Lead Score: {score}</span>
            {aiPowered ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                AI Powered
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                Rule Based
              </span>
            )}
          </div>
          {reasonCodes.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Reasoning:</p>
              <ul className="text-xs space-y-1">
                {reasonCodes.map((reason, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
        </div>
      )}
    </div>
  );
} 