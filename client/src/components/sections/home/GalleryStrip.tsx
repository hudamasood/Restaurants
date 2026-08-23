import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { DUR, EASE } from '@/motion/constants';
import { usePassProgress } from '@/motion/scroll';
import { useCanAnimate } from '@/motion/guards';
import { Picture } from '@/components/media/Picture';
import { Reveal } from '@/components/motion/Reveal';
import { GALLERY_STRIP } from '@/data/site';

/** Per-item reveal delay and per-item parallax rate, so the grid breathes
 *  rather than moving as a slab. */
const DELAYS = [0, 0.09, 0.18, 0.09, 0.27, 0.18, 0.36];
const RATES = [-2, -6, -4, -10, -3, -8, -5];

const SPANS = [
  'col-span-6 lg:col-span-4 lg:row-span-2',
  'col-span-6 lg:col-span-4',
  'col-span-6 lg:col-span-4 lg:row-span-2',
  'col-span-6 lg:col-span-4',
  'col-span-4 lg:col-span-4',
  'col-span-4 lg:col-span-4',
  'col-span-4 lg:col-span-4',
];

export function GalleryStrip() {
  return (
    <section id="gallery" className="relative py-24 lg:py-32">
      <div className="u-shell">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
              The room
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/gallery" className="btn btn--ghost">
              <span>Full gallery</span>
            </Link>
          </Reveal>
        </div>

        <div className="grid auto-rows-[minmax(140px,20vh)] grid-cols-12 gap-3 lg:gap-4">
          {GALLERY_STRIP.map((item, i) => (
            <StripItem key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StripItem({
  item,
  index,
}: {
  item: (typeof GALLERY_STRIP)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);
  const canAnimate = useCanAnimate();
  const y = useTransform(progress, [0, 1], ['0%', `${RATES[index]}%`]);

  return (
    <motion.div
      ref={ref}
      className={`group relative overflow-hidden ${SPANS[index]}`}
      initial={{ opacity: 0, y: canAnimate ? 20 : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{
        duration: canAnimate ? DUR.base : DUR.micro,
        delay: canAnimate ? DELAYS[index] : 0,
        ease: EASE.house as unknown as number[],
      }}
    >
      <Link to={`/gallery?image=${item.id}`} className="block h-full w-full">
        <motion.div className="h-[112%] w-full" style={enabled ? { y } : undefined}>
          <Picture
            src={item.image}
            alt={item.caption}
            className="h-full w-full transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 50vw, 33vw"
          />
        </motion.div>
        <div
          className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{
            background:
              'linear-gradient(to top, rgb(11 11 12 / 0.85), rgb(11 11 12 / 0))',
          }}
        >
          <span className="u-mono" style={{ color: 'var(--color-bone)' }}>
            {item.caption}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
