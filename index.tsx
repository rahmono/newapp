
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';
import PublicDebtorApp from './PublicDebtorApp';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import DeleteAccount from './components/DeleteAccount';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Routing Checks
const path = window.location.pathname;
const hostname = window.location.hostname;

// Replace 'daftarapp.tj' with your actual secondary domain
const isSecondaryDomain = hostname.includes('daftarapp.tj');

// UPDATED: Admin path is now /0410 AND restricted to non-secondary domains
// Ин код кафолат медиҳад, ки админ-панел дар daftarapp.tj ҳеҷ гоҳ кушода намешавад
const isPathAdmin = path.startsWith('/0410') && !isSecondaryDomain;

const isPathDebtor = path.startsWith('/debtor/');
const isPathPrivacy = path.startsWith('/privacy');
const isPathDeleteAccount = path.startsWith('/delete-account');

root.render(
  <React.StrictMode>
    {isPathAdmin ? (
        <AdminApp />
    ) : isPathDebtor ? (
        // Public Debtor Profile (Works on ANY domain if path matches)
        <PublicDebtorApp />
    ) : isPathPrivacy ? (
        // Privacy Policy Page (Works on ANY domain)
        <PrivacyPolicy />
    ) : isPathDeleteAccount ? (
        // Delete Account Request Page (Works on ANY domain)
        <DeleteAccount />
    ) : isSecondaryDomain ? (
        // Landing Page (Only for root of secondary domain)
        <LandingPage />
    ) : (
        // Main App (Default for steppay.fun)
        <App />
    )}
  </React.StrictMode>
);
