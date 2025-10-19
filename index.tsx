import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { NotificationProvider } from './contexts/NotificationContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BackgroundProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </BackgroundProvider>
  </React.StrictMode>
);
