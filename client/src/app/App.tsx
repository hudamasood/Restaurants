import { Suspense, lazy, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
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

// Admin is its own lazy chunk, so a public visitor never downloads it.
const AdminService = lazy(() => import('@/pages/admin/Service'));
const AdminMenu = lazy(() => import('@/pages/admin/MenuAdmin'));

function RouteFallback() {
  return <div style={{ minHeight: '100svh' }} aria-hidden="true" />;
}

/** Owns its own state so App can return early for admin without
 *  conditionally calling hooks. */
function PublicLoader() {
  const [loaded, setLoaded] = useState(false);
  return loaded ? null : <Loader onDone={() => setLoaded(true)} />;
}

export function App() {
  const { pathname } = useLocation();

  // Admin gets none of the public chrome. It is a tool used mid-service, so
  // the loader, the nav, the footer and the oxblood page wipe are all wrong
  // there — a manager seating a table should not wait on a 900ms transition.
  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/admin" element={<AdminService />} />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/*" element={<AdminService />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <>
      <JsonLd />
      <SkipLink />
      <PublicLoader />
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
