import React from 'react';

export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

export const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

export const DiscogsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white" {...props}>
    <title>Discogs</title>
    <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0 4.8a7.2 7.2 0 1 1 0 14.4 7.2 7.2 0 0 1 0-14.4zm0 2.4a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zM12 9a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z" />
  </svg>
);

export const LastfmIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#d51007" {...props}>
    <title>Last.fm</title>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3c-1.22 0-2.31.29-3.26.83l7.43 7.43c.54-.95.83-2.04.83-3.26C17 4.65 14.85 3 12 3zm-8.17 3.74L11.27 14.2l-7.44-7.44C3.42 5.81 3 4.72 3 3.5c0 .08 0 .16.01.24zm12.42 12.43L9.8 11.73l7.44 7.44c.41-.95.66-2.03.66-3.17 0-.08 0-.16-.01-.24zM3 20.5c1.22 0 2.31-.29 3.26-.83L13.7 12.2l-7.43-7.43c-2.32 2.32-2.32 6.09 0 8.41.69.69 1.51 1.17 2.43 1.46L3 20.26V20.5z" />
  </svg>
);

export const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
);

export const VinylIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
);