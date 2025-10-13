import React from 'react';

export const MosqueIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M3.3 21H21" />
    <path d="M4 21V10.7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V21" />
    <path d="M12 2v2.5" />
    <path d="M10.5 4.5 12 6l1.5-1.5" />
    <path d="M6 21v-5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
  </svg>
);
