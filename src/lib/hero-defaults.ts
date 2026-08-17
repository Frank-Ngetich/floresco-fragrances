export interface HeroData {
  badge: string;
  heading1: string;
  heading2: string;
  subtext: string;
  tagline: string;
  cta1Label: string;
  cta1Link: string;
  cta2Label: string;
  cta2Link: string;
  pills: string[];
  trustItems: { label: string; sub: string }[];
  bgFrom: string;
  bgMid: string;
  bgTo: string;
  showParticles: boolean;
  showOrbitRings: boolean;
  showRatingBadge: boolean;
  videoUrl: string;
  useVideo: boolean;
  heroImageUrl: string;
}

export const DEFAULT_HERO: HeroData = {
  badge: "Eldoret's Luxury Fragrance House",
  heading1: 'Your story,',
  heading2: 'begins to bloom.',
  subtext: 'A luxury fragrance house born in the heart of Eldoret — curating 100% original perfumes for those who understand that the right scent tells the story words cannot.',
  tagline: 'Kapsoya Business Park, Eldoret · Delivering across all 47 counties',
  cta1Label: 'Explore the Collection',
  cta1Link: '/shop',
  cta2Label: 'Our Story',
  cta2Link: '/about',
  pills: ['Oud', 'Bergamot', 'Rose', 'Amber', 'Sandalwood'],
  trustItems: [
    { label: '100% Authentic',    sub: 'Guaranteed original' },
    { label: 'Same-day Delivery', sub: 'Within Eldoret' },
    { label: '47 Counties',       sub: 'Nationwide courier' },
  ],
  bgFrom: '#FDFBF8',
  bgMid:  '#F7F1EC',
  bgTo:   '#EDE3DB',
  showParticles:   true,
  showOrbitRings:  true,
  showRatingBadge: true,
  videoUrl: '',
  useVideo: false,
  heroImageUrl: '',
};
