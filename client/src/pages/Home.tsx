import { PageShell } from '@/components/layout/PageShell';
import { Hero } from '@/components/sections/home/Hero';
import { StationRail } from '@/components/sections/home/StationRail';
import { SignatureChapters } from '@/components/sections/home/SignatureChapters';
import { StoryBlock } from '@/components/sections/home/StoryBlock';
import { KitchenBlock } from '@/components/sections/home/KitchenBlock';
import { ExperienceRail } from '@/components/sections/home/ExperienceRail';
import { GalleryStrip } from '@/components/sections/home/GalleryStrip';
import { ReviewCarousel } from '@/components/sections/home/ReviewCarousel';
import { ReserveBand } from '@/components/sections/home/ReserveBand';
import { BRAND } from '@/data/brand';

export default function Home() {
  return (
    <PageShell title={BRAND.name} description={BRAND.description}>
      <Hero />
      <StationRail />
      <SignatureChapters />
      <StoryBlock />
      <KitchenBlock />
      <ExperienceRail />
      <GalleryStrip />
      <ReviewCarousel />
      <ReserveBand />
    </PageShell>
  );
}
