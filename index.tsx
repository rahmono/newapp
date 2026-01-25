import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';
import PublicDebtorApp from './PublicDebtorApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple Path-based Routing Check
const path = window.location.pathname;
const isPathAdmin = path.startsWith('/admin');
const isPathDebtor = path.startsWith('/debtor/');

root.render(
  <React.StrictMode>
    {isPathAdmin ? (
        <AdminApp />
    ) : isPathDebtor ? (
        <PublicDebtorApp />
    ) : (
        <App />
    )}
  </React.StrictMode>
);