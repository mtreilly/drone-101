import '@fontsource/patrick-hand/400.css';
import '@fontsource/caveat/700.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import 'katex/dist/katex.min.css';
import './core/tokens.css';
import './core/base.css';
import './core/home.css';
import './story/story.css';
import './ui/ui.css';
import { startApp } from './core/app';
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject();

startApp(document.getElementById('app')!).catch((err) => {
  console.error(err);
  document.getElementById('app')!.textContent = String(err);
});
