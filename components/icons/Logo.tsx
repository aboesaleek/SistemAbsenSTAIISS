import React from 'react';

export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Lapisan dekoratif luar */}
    <path 
      d="M12 2.5L14.75 5.25L18.75 5.25L21.5 8L21.5 16L18.75 18.75L14.75 18.75L12 21.5L9.25 18.75L5.25 18.75L2.5 16L2.5 8L5.25 5.25L9.25 5.25L12 2.5Z" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="opacity-30"
    />
    
    {/* Bentuk heksagon dalam */}
    <path 
      d="M12 5L17.2 8V16L12 19L6.8 16V8L12 5Z" 
      fill="currentColor" 
      className="opacity-10"
    />

    {/* Tanda centang tengah */}
    <path
      d="M16 9.5L11 14.5L8 11.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);