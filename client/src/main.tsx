import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/tokens.css';
import './styles/globals.css';
import { Providers } from './app/providers';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Providers>
          <App />
        </Providers>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
