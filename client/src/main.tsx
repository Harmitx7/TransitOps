import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

async function bootstrap() {
  const isVercel = window.location.hostname.includes('vercel.app');
  if (import.meta.env.VITE_DEMO_MODE === 'true' || isVercel) {
    await import('./lib/mockApi');
  }

  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
