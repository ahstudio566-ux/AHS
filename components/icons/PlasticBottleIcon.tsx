import React from 'react';

export const PlasticBottleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        {/* Bottle Body */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7z" />
        {/* Bottle Neck */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        {/* Bottle Cap */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8" />
        {/* Simple lines inside to suggest content */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 16h4" />
    </svg>
);
