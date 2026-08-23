import { Link } from 'react-router-dom';
import { DEPTH } from '@/motion/constants';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { Parallax } from '@/components/motion/Parallax';
import { CHEFS } from '@/data/site';

/**
 * Two portraits with curtain masks at deliberately different viewport
 * margins, so they never enter together. A pull-quote line-masks between them.
 */
export function KitchenBlock() {
  const [first, second] = CHEFS;

  return (
    <section id="kitchen" className="relative py-24 lg:py-32">
      <div className="u-shell">
        <Reveal>
          <p className="u-mono mb-12" style={{ color: 'var(--color-bone-faint)' }}>
            The kitchen
          </p>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* First portrait, entering earlier */}
          <div className="lg:col-span-4">
            <Parallax rate={DEPTH.near}>
              <CurtainMask margin="0px 0px -20% 0px">
                <Picture
                  src={first.image}
                  alt={first.name}
                  ratio="3/4"
                  sizes="(max-width: 1024px) 100vw, 32vw"
                  className="w-full"
                />
              </CurtainMask>
            </Parallax>
            <Reveal delay={0.1}>
              <div className="pt-6">
                <h3 className="u-display mb-2" style={{ fontSize: 'var(--t-dish)' }}>
                  {first.name}
                </h3>
                <p className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
                  {first.role}
                </p>
              </div>
            </Reveal>
          </div>

          {/* Pull-quote between them */}
          <div className="flex items-center lg:col-span-4">
            <div>
              <LineMask
                text={`“${first.quote}”`}
                as="blockquote"
                className="u-display"
                margin="0px 0px -25% 0px"
              />
              <Reveal delay={0.2}>
                <p className="u-mono mt-7" style={{ color: 'var(--color-bone-faint)' }}>
                  {first.name} · {first.role}
                </p>
              </Reveal>
              <Reveal delay={0.25}>
                <Link to="/story/kitchen" className="btn btn--ghost mt-8">
                  <span>Meet the brigade</span>
                </Link>
              </Reveal>
            </div>
          </div>

          {/* Second portrait, offset vertically and entering later */}
          <div className="lg:col-span-4 lg:pt-28">
            <Parallax rate={DEPTH.mid}>
              <CurtainMask margin="0px 0px -35% 0px">
                <Picture
                  src={second.image}
                  alt={second.name}
                  ratio="3/4"
                  sizes="(max-width: 1024px) 100vw, 32vw"
                  className="w-full"
                />
              </CurtainMask>
            </Parallax>
            <Reveal delay={0.1}>
              <div className="pt-6">
                <h3 className="u-display mb-2" style={{ fontSize: 'var(--t-dish)' }}>
                  {second.name}
                </h3>
                <p className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
                  {second.role}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
