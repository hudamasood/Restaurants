import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Reveal } from '@/components/motion/Reveal';
import { StoryBlock } from '@/components/sections/home/StoryBlock';
import { StoryHero } from '@/components/sections/story/StoryHero';
import { BRAND } from '@/data/brand';
import { PAGE_META } from '@/data/pageMeta';

export default function Story() {
  return (
    <PageShell {...PAGE_META['/story']}>
      <StoryHero lede={BRAND.description} />

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
