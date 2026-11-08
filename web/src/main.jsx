import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import '@fontsource-variable/plus-jakarta-sans';
import './styles/tokens.css';
import './styles/app.css';
import { AuthProvider } from './auth/AuthContext.jsx';
import { applyTheme } from './lib/hooks.js';
import App from './App.jsx';

applyTheme();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
