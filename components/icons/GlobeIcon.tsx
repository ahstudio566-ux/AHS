import React from 'react';

export const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 01-.5-17.98m.5 17.98a9 9 0 000-17.98m0 17.98h.008v.002H12v-.002z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75a9 9 0 001.328 4.435M21.75 12.75a9 9 0 01-1.328 4.435" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75L21.75 12.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.625 6a15.02 15.02 0 0112.75 0" />
    </svg>
);
