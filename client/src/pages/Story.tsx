import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Picture } from '@/components/media/Picture';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { StoryBlock } from '@/components/sections/home/StoryBlock';
import { BRAND, img } from '@/data/brand';
import { PAGE_META } from '@/data/pageMeta';

export default function Story() {
  return (
    <PageShell {...PAGE_META['/story']}>
      <header
        className="relative flex items-end"
        style={{ minHeight: '80svh', paddingTop: 'var(--nav-h)' }}
      >
        <Picture
          src={img('1517248135467-4c7edcad34c4')}
          alt=""
          priority
          className="absolute inset-0 h-full w-full"
          sizes="100vw"
        />
        <div className="u-scrim" />
        <div className="u-shell relative z-10 w-full pb-16">
          <Reveal y={0}>
            <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
              The story
            </p>
          </Reveal>
          <LineMask text="Built around one fire" as="h1" className="u-display mb-7" animateOnMount />
          <Reveal delay={0.4}>
            <p style={{ color: 'var(--color-bone-dim)', maxWidth: '50ch', fontSize: 'var(--t-lede)' }}>
              {BRAND.description}
            </p>
          </Reveal>
        </div>
      </header>

      <StoryBlock />

      <section className="border-t py-20 text-center" style={{ borderColor: 'var(--color-smoke)' }}>
        <div className="u-shell">
          <Reveal>
            <Link to="/story/kitchen" className="btn btn--outline">
              <span>Meet the kitchen</span>
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
