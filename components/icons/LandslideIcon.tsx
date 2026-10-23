import React from 'react';

export const LandslideIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      {/* A simple representation of a mountain with a landslide/crack */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 21h20L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 12l-4 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5l-2 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 15.5l-2 3" />
    </svg>
);