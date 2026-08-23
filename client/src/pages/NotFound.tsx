import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Picture } from '@/components/media/Picture';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { Wordmark } from '@/components/layout/Wordmark';
import { img } from '@/data/brand';

/** A single full-bleed image, the wordmark, and three links. No cleverness. */
export default function NotFound() {
  return (
    <PageShell title="Page not found" description="That page does not exist.">
      <div className="relative flex flex-col items-center justify-center" style={{ minHeight: '100svh' }}>
        <Picture
          src={img('1517248135467-4c7edcad34c4')}
          alt=""
          priority
          className="absolute inset-0 h-full w-full"
          sizes="100vw"
        />
        <div className="u-scrim-full" />

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <Reveal y={0}>
            <Wordmark size="lg" />
          </Reveal>

          <div className="mt-10">
            <LineMask text="That page does not exist" as="h1" className="u-display" animateOnMount />
          </div>

          <Reveal delay={0.3}>
            <nav className="mt-12 flex flex-wrap justify-center gap-3" aria-label="Recovery">
              <Link to="/" className="btn btn--outline">
                <span>Home</span>
              </Link>
              <Link to="/menu" className="btn btn--outline">
                <span>The menu</span>
              </Link>
              <Link to="/reserve" className="btn btn--filled">
                <span>Reserve</span>
              </Link>
            </nav>
          </Reveal>
        </div>
      </div>
    </PageShell>
  );
}
