import React from 'react';

export const DormitoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M2 8l10-5 10 5v11a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
    <path d="M12 11v9" />
    <path d="M18 11v9" />
    <path d="M6 11v9" />
    <path d="M10 3.3l.8.5" />
  </svg>
);
