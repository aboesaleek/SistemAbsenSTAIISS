import React, { useState } from 'react';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 sm:p-6 text-right focus:outline-none"
        aria-expanded={isExpanded}
      >
        <h3 className="text-xl font-bold text-slate-700">{title}</h3>
        <ChevronDownIcon
          className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[22rem]' : 'max-h-0'
        }`}
      >
        <div className="p-4 sm:p-6 pt-0">
           <div className="relative h-80">{children}</div>
        </div>
      </div>
    </div>
  );
};
