import React from 'react';

export const DropletsIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a4.5 4.5 0 004.5-4.5V10.5A4.5 4.5 0 0018 6H6.75a4.5 4.5 0 00-4.5 4.5V15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591" />
  </svg>
);
