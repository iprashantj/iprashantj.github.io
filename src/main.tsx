import { createRoot } from 'react-dom/client';
import '@fontsource/anton/400.css';
import '@fontsource-variable/inter-tight';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles.css';
import App from './App';

// No StrictMode: the scroll engine and GSAP tweens are imperative singletons.
createRoot(document.getElementById('root')!).render(<App />);
