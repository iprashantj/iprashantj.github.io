import { useLayoutEffect } from 'react';
import Stage from './components/Stage';
import { Cursor, HUD, Preloader } from './components/Chrome';
import Hero from './scenes/Hero';
import About from './scenes/About';
import Work from './scenes/Work';
import Journey from './scenes/Journey';
import Skills from './scenes/Skills';
import Awards from './scenes/Awards';
import Contact from './scenes/Contact';
import { boot } from './engine/director';

export default function App() {
  useLayoutEffect(() => { boot(); }, []);
  return (
    <>
      <Stage />
      <main>
        <Hero />
        <About />
        <Work />
        <Journey />
        <Skills />
        <Awards />
        <Contact />
      </main>
      <HUD />
      <Cursor />
      <Preloader />
    </>
  );
}
