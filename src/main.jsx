import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './overrides.css';
import './hero-image.css';
import './hero-layout.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>,
);
