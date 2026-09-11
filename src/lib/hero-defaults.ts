export interface HeroData {
  badge: string;
  heading1: string;
  heading2: string;
  subtext: string;
  cta1Label: string;
  cta1Link: string;
  cta2Label: string;
  cta2Link: string;
  bgFrom: string;
  bgMid: string;
  bgTo: string;
  videoUrl: string;
  useVideo: boolean;
  heroImageUrl: string;
  heroBackgroundUrl: string;
}

/* TEMPORARY — free-license Unsplash placeholders standing in for real
   photography/video, purely so the full-bleed photographic hero direction
   can be reviewed. Neither is Floresco's actual product, and neither is
   licensed for a shipped commercial site — replace both with real shots of
   an actual Floresco bottle (and a real brand scene for the background)
   before launch. */
export const DEFAULT_HERO: HeroData = {
  badge: "Eldoret's Luxury Fragrance House",
  heading1: 'Your story,',
  heading2: 'begins to bloom.',
  subtext: 'A luxury fragrance house born in the heart of Eldoret — curating 100% original perfumes for those who understand that the right scent tells the story words cannot.',
  cta1Label: 'Explore the Collection',
  cta1Link: '/shop',
  cta2Label: 'Our Story',
  cta2Link: '/about',
  bgFrom: '#FDFBF8',
  bgMid:  '#F7F1EC',
  bgTo:   '#EDE3DB',
  videoUrl: '',
  useVideo: false,
  // Floating product card — photo by Laura Chouette (Unsplash), smart-cropped
  // to the card's portrait ratio instead of a blind CSS center-crop.
  heroImageUrl: 'https://images.unsplash.com/photo-1592842312573-dca0b185d2e0?w=640&h=860&fit=crop&crop=entropy&q=85',
  // Full-bleed background — colorful blue/red/black smoke, photo by Ruvim
  // Noga (Unsplash), dark enough on the left for white text to sit on top.
  heroBackgroundUrl: 'https://images.unsplash.com/photo-1529641484336-ef35148bab06?w=1920&q=80&fm=jpg&fit=crop',
};
