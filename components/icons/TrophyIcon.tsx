import React from 'react';

export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 001.056 4.636c.23.44.132.956-.224 1.223l-2.072 1.554a.6.6 0 01-.84-.73l.255-1.02a11.998 11.998 0 01-1.423-4.636h11.482zM16.5 18.75a9.75 9.75 0 00-1.056-4.636c-.23-.44-.132-.956.224-1.223l2.072-1.554a.6.6 0 01.84.73l-.255 1.02a11.998 11.998 0 011.423 4.636H16.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.25a3.75 3.75 0 00-3.75 3.75v3.75h7.5V15a3.75 3.75 0 00-3.75-3.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75v1.5m0 15V18.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 5.25v1.5m4.5-1.5v1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75v1.5m13.5-1.5v1.5" />
    </svg>
);