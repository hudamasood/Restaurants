import { Suspense, lazy, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/PageShell';
import { PageTransition } from '@/components/motion/PageTransition';
import { Loader } from '@/components/motion/Loader';
import { JsonLd } from '@/lib/jsonld';

import Home from '@/pages/Home';

// Route-level code splitting. Everything but the homepage is lazy.
const Menu = lazy(() => import('@/pages/Menu'));
const DishChapter = lazy(() => import('@/pages/DishChapter'));
const StillRoom = lazy(() => import('@/pages/StillRoom'));
const Story = lazy(() => import('@/pages/Story'));
const Kitchen = lazy(() => import('@/pages/Kitchen'));
const ExperiencePage = lazy(() => import('@/pages/Experience'));
const Gallery = lazy(() => import('@/pages/Gallery'));
const Reserve = lazy(() => import('@/pages/Reserve'));
const ReserveConfirm = lazy(() => import('@/pages/ReserveConfirm'));
const Contact = lazy(() => import('@/pages/Contact'));
const Allergens = lazy(() => import('@/pages/Allergens'));
const Legal = lazy(() => import('@/pages/Legal'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function RouteFallback() {
  return <div style={{ minHeight: '100svh' }} aria-hidden="true" />;
}

export function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <JsonLd />
      <SkipLink />
      {!loaded && <Loader onDone={() => setLoaded(true)} />}
      <Nav />

      <PageTransition>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/menu/:slug" element={<DishChapter />} />
            <Route path="/still-room" element={<StillRoom />} />
            <Route path="/story" element={<Story />} />
            <Route path="/story/kitchen" element={<Kitchen />} />
            <Route path="/experience" element={<ExperiencePage />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/reserve" element={<Reserve />} />
            <Route path="/reserve/:reference" element={<ReserveConfirm />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/allergens" element={<Allergens />} />
            <Route path="/legal/:page" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
      </PageTransition>
    </>
  );
}
