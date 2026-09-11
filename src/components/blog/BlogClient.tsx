'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, FileText } from 'lucide-react';

const T = { ease: [0.16, 1, 0.3, 1] as const };

// TEMPORARY — free-license Unsplash placeholder (photo by Mindaugas
// Norvilas) standing in for real brand photography on the Journal header.
const JOURNAL_HERO_BG = 'https://images.unsplash.com/photo-1643716991951-285e23e35961?w=1920&q=80&fm=jpg&fit=crop';

interface Post {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  category?: string;
  author?: string;
  publishedAt?: string;
}

function CoverImage({ post, className }: { post: Post; className?: string }) {
  if (post.coverImage) {
    return <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className={className} />;
  }
  return (
    <div className="w-full h-full bg-gradient-to-br from-stone to-stone/70 flex items-center justify-center">
      <FileText size={32} className="text-white/20" strokeWidth={1} />
    </div>
  );
}

export function BlogClient() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef  = useRef<HTMLDivElement>(null);
  const heroIn   = useInView(heroRef, { once: true });
  const gridRef  = useRef<HTMLDivElement>(null);
  const gridIn   = useInView(gridRef, { once: true, margin: '-80px' });

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = posts[0];
  const rest     = posts.slice(1);

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="relative py-24 text-center overflow-hidden">
        <Image src={JOURNAL_HERO_BG} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(8,7,6,0.5) 0%, rgba(8,7,6,0.76) 100%)' }} />
        <motion.div ref={heroRef} initial={{ opacity: 0, y: 24 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ ...T, duration: 0.8 }}
          className="relative">
          <div className="eyebrow mb-4" style={{ color: 'rgb(201,164,85)' }}>Floresco</div>
          <h1 className="font-display text-[clamp(2.8rem,6vw,5rem)] mb-4 text-white">The Journal</h1>
          <p className="text-white/70 text-sm max-w-xs mx-auto">Fragrance stories, education and the art of living beautifully.</p>
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="aspect-[4/5] bg-stone/[0.04] animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <FileText size={40} strokeWidth={1} className="mx-auto text-stone/20 mb-5" />
            <h2 className="font-display text-2xl mb-3">The first stories are being written.</h2>
            <p className="text-stone/45 text-sm max-w-sm mx-auto">Check back soon for fragrance guides, education, and the story of Floresco.</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T, duration: 0.8 }} className="mb-16">
                <Link href={`/blog/${featured.slug}`} className="group grid lg:grid-cols-2 border border-stone/10 overflow-hidden hover:border-wine-200 transition-colors">
                  <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[420px] overflow-hidden">
                    <CoverImage post={featured} className="object-cover" />
                  </div>
                  <div className="p-10 lg:p-14 flex flex-col justify-center bg-white">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      {featured.category && (
                        <span className="text-[0.6rem] tracking-[0.28em] uppercase text-wine-600 border border-wine-200 px-3 py-1">{featured.category}</span>
                      )}
                      {featured.publishedAt && (
                        <span className="text-stone/35 text-xs flex items-center gap-1.5">
                          <Calendar size={11} />{new Date(featured.publishedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-[clamp(1.8rem,2.5vw,2.6rem)] mb-5 group-hover:text-wine-700 transition-colors leading-tight">{featured.title}</h2>
                    <p className="text-stone/55 leading-relaxed mb-8 text-sm max-w-md">{featured.excerpt}</p>
                    <span className="flex items-center gap-2 text-[0.68rem] tracking-[0.2em] uppercase font-medium text-wine-600 border-b border-wine-400 pb-0.5 self-start group-hover:gap-3 transition-all">
                      Read Article →
                    </span>
                  </div>
                </Link>
              </motion.div>
            )}

            {rest.length > 0 && (
              <>
                <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-stone/8">
                  <h2 className="font-display text-2xl">Latest Articles</h2>
                  <span className="text-[0.68rem] tracking-[0.18em] uppercase text-stone/35">{posts.length} articles</span>
                </div>

                <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post, i) => (
                    <motion.div key={post._id}
                      initial={{ opacity: 0, y: 24 }} animate={gridIn ? { opacity: 1, y: 0 } : {}}
                      transition={{ ...T, duration: 0.65, delay: i * 0.08 }}>
                      <Link href={`/blog/${post.slug}`} className="group block border border-stone/10 hover:border-wine-200 transition-colors bg-white">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <CoverImage post={post} className="object-cover" />
                        </div>
                        <div className="p-6">
                          {post.category && (
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-[0.58rem] tracking-[0.28em] uppercase text-wine-600 font-medium">{post.category}</span>
                            </div>
                          )}
                          <h3 className="font-display text-[1.15rem] leading-snug mb-3 group-hover:text-wine-700 transition-colors">{post.title}</h3>
                          <p className="text-stone/50 text-[0.82rem] leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                          <span className="text-[0.65rem] tracking-[0.2em] uppercase font-medium text-wine-600 border-b border-wine-300 pb-0.5">Read More →</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
