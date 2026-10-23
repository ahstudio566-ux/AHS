import React from 'react';

export const WindIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-6.75h.75c2.132 0 3.833.606 4.978 1.527a7.665 7.665 0 011.022 1.223M19.5 12h.75c2.132 0 3.833.606 4.978 1.527a7.665 7.665 0 011.022 1.223M12.75 19.5h-.75a7.5 7.5 0 01-7.5-7.5H3.75m15.75-6.75h-.75a7.5 7.5 0 00-7.5 7.5v.75" />
  </svg>
);
