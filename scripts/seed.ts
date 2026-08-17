#!/usr/bin/env tsx
/**
 * Floresco Database Seed Script
 * Run: npm run seed
 *
 * Creates:
 *  - Owner admin user (CHANGE PASSWORD AFTER FIRST LOGIN)
 *  - All 12 products from the product catalogue
 *  - Initial site settings
 */
import { config } from 'dotenv';
import dns from 'node:dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

config({ path: '.env.local' });

// Node's bundled DNS resolver sometimes can't complete the SRV/TXT lookup
// mongodb+srv:// needs on Windows, even though the OS resolver can. Point
// it at a public resolver instead.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set in .env.local');
  process.exit(1);
}

// Inline schemas to avoid import issues
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: String, phone: String,
  role: { type: String, default: 'customer' },
  addresses: [], wishlist: [],
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: String, brand: String, category: String, tagline: String, description: String,
  scentNotes: { top: [String], heart: [String], base: [String] },
  sizes: [{ size: String, price: Number, stock: Number, sku: String }],
  images: [{ url: String, alt: String, isPrimary: Boolean }],
  color1: String, color2: String, featured: Boolean, badge: String,
  rating: Number, reviewCount: Number, status: { type: String, default: 'active' },
  seo: { metaTitle: String, metaDescription: String },
}, { timestamps: true });

const User    = mongoose.models.User    || mongoose.model('User',    UserSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const PRODUCTS = [
  { slug:'velvet-oud-intense', name:'Velvet Oud Intense', brand:'House Niche', category:'arabian-oud',
    tagline:'Deep, smoky oud with warm amber and damask rose.', description:'A masterful composition that unfolds like a velvet curtain in a candlelit room. Rare Cambodian oud meets damask rose and golden amber, finishing with sandalwood that lingers for hours.',
    scentNotes:{ top:['Bergamot','Saffron','Pink Pepper'], heart:['Damask Rose','Amber','Jasmine'], base:['Cambodian Oud','Sandalwood','White Musk'] },
    sizes:[{size:'50ml',price:8500,stock:12,sku:'VOI-50'},{size:'100ml',price:14500,stock:8,sku:'VOI-100'}],
    images:[{url:'',alt:'Velvet Oud Intense',isPrimary:true}], color1:'#3A2C22',color2:'#7A5A38', featured:true,badge:'Bestseller',rating:4.9,reviewCount:128,status:'active', seo:{metaTitle:'Velvet Oud Intense | Floresco',metaDescription:'Deep Cambodian oud with damask rose and amber.'} },
  { slug:'bloom-de-nuit', name:'Bloom de Nuit', brand:'Designer', category:'women',
    tagline:'Night-blooming florals wrapped in creamy vanilla.', description:'A luminous white floral that opens with bergamot and pink pepper, unfolding into jasmine sambac and tuberose, grounded by creamy vanilla.',
    scentNotes:{ top:['Bergamot','Pink Pepper','Mandarin'], heart:['Jasmine Sambac','Tuberose','White Peony'], base:['Vanilla','Sandalwood','White Musk'] },
    sizes:[{size:'30ml',price:8200,stock:6,sku:'BDN-30'},{size:'50ml',price:12800,stock:15,sku:'BDN-50'},{size:'100ml',price:18500,stock:7,sku:'BDN-100'}],
    images:[{url:'',alt:'Bloom de Nuit',isPrimary:true}], color1:'#C77B95',color2:'#EFC2D0', featured:true,badge:'New',rating:4.8,reviewCount:94,status:'active', seo:{metaTitle:'Bloom de Nuit | Floresco',metaDescription:'Night-blooming florals wrapped in creamy vanilla.'} },
  { slug:'noir-elegant-homme', name:'Noir Élégant Homme', brand:'Designer', category:'men',
    tagline:'Lavender and iris with tonka and aged leather.', description:'Structured and confident. Lavender absolute meets iris and tonka bean for a timeless evening fragrance.',
    scentNotes:{ top:['Lavender','Cardamom','Bergamot'], heart:['Iris','Geranium','Sage'], base:['Tonka Bean','Leather','Vetiver'] },
    sizes:[{size:'50ml',price:11200,stock:10,sku:'NEH-50'},{size:'100ml',price:15800,stock:5,sku:'NEH-100'}],
    images:[{url:'',alt:'Noir Élégant Homme',isPrimary:true}], color1:'#222226',color2:'#5B5B66', featured:true,rating:4.7,reviewCount:76,status:'active', seo:{metaTitle:'Noir Élégant Homme | Floresco',metaDescription:'A structured masculine fragrance.'} },
  { slug:'rose-damascena', name:'Rose Damascena', brand:'Arabian House', category:'arabian-oud',
    tagline:'Turkish rose absolute with honey and white musk.', description:'A love letter to the world\'s most prized rose. Distilled roses from Isparta meet golden honey and animalic musk.',
    scentNotes:{ top:['Damask Rose','Lychee','Bergamot'], heart:['Rose Absolute','Honey','Peony'], base:['White Musk','Sandalwood','Patchouli'] },
    sizes:[{size:'50ml',price:7200,stock:20,sku:'RD-50'},{size:'100ml',price:12500,stock:14,sku:'RD-100'}],
    images:[{url:'',alt:'Rose Damascena',isPrimary:true}], color1:'#8E2C48',color2:'#D66E8C', featured:true,rating:4.9,reviewCount:156,status:'active', seo:{metaTitle:'Rose Damascena | Floresco',metaDescription:'Turkish rose absolute with honey and musk.'} },
  { slug:'sauvage-moderne', name:'Sauvage Moderne EDP', brand:'Designer', category:'men',
    tagline:'Bergamot, Sichuan pepper and radiant ambroxan.', description:'A modern classic with greater depth. Bergamot and pepper open to ambroxan of extraordinary radiance.',
    scentNotes:{ top:['Bergamot','Sichuan Pepper','Lavender'], heart:['Elemi','Nutmeg','Ambroxan'], base:['Ambroxan','Cedar','Labdanum'] },
    sizes:[{size:'60ml',price:12500,stock:8,sku:'SM-60'},{size:'100ml',price:16800,stock:6,sku:'SM-100'}],
    images:[{url:'',alt:'Sauvage Moderne EDP',isPrimary:true}], color1:'#1B2B45',color2:'#4A6FA5', rating:4.8,reviewCount:203,status:'active', seo:{metaTitle:'Sauvage Moderne EDP | Floresco',metaDescription:'Bergamot and ambroxan — a modern masculine icon.'} },
  { slug:'mademoiselle-cherie', name:'Mademoiselle Chérie', brand:'Designer', category:'women',
    tagline:'Orange blossom, May rose and soft patchouli.', description:'Effortlessly chic. Sicilian orange blossom over May rose, resting on patchouli and white musk.',
    scentNotes:{ top:['Sicilian Orange','Neroli','Mandarin'], heart:['May Rose','Grasse Jasmine','Iris'], base:['Patchouli','White Musk','Vetiver'] },
    sizes:[{size:'35ml',price:11800,stock:9,sku:'MC-35'},{size:'50ml',price:15800,stock:12,sku:'MC-50'},{size:'100ml',price:22000,stock:4,sku:'MC-100'}],
    images:[{url:'',alt:'Mademoiselle Chérie',isPrimary:true}], color1:'#A8323E',color2:'#E8909A', badge:"Editor's Pick",rating:4.9,reviewCount:187,status:'active', seo:{metaTitle:'Mademoiselle Chérie | Floresco',metaDescription:'Orange blossom and rose — effortless chic.'} },
  { slug:'amber-royale', name:'Amber Royale', brand:'House Niche', category:'unisex',
    tagline:'Golden amber, saffron and Atlas cedar.', description:'Regal and uncompromising. Golden amber meets Persian saffron and Moroccan cedar.',
    scentNotes:{ top:['Saffron','Bergamot','Cardamom'], heart:['Amber','Rose','Iris'], base:['Atlas Cedar','Sandalwood','Amber Resin'] },
    sizes:[{size:'50ml',price:9800,stock:11,sku:'AR-50'},{size:'100ml',price:14200,stock:7,sku:'AR-100'}],
    images:[{url:'',alt:'Amber Royale',isPrimary:true}], color1:'#8A5A1E',color2:'#D9A84E', rating:4.7,reviewCount:91,status:'active', seo:{metaTitle:'Amber Royale | Floresco',metaDescription:'Golden amber and saffron — unisex luxury.'} },
  { slug:'citrus-verde', name:'Citrus Verde', brand:'House Niche', category:'unisex',
    tagline:'Sicilian lime, green tea and earthy vetiver.', description:'The scent of a Mediterranean morning. Bright lime and green tea, grounded by vetiver.',
    scentNotes:{ top:['Sicilian Lime','Mint','Grapefruit'], heart:['Green Tea','Basil','Petitgrain'], base:['Vetiver','Cedar','Musk'] },
    sizes:[{size:'50ml',price:6900,stock:18,sku:'CV-50'},{size:'100ml',price:10500,stock:12,sku:'CV-100'}],
    images:[{url:'',alt:'Citrus Verde',isPrimary:true}], color1:'#2E5D3A',color2:'#7FB77E', badge:'Fresh Pick',rating:4.6,reviewCount:63,status:'active', seo:{metaTitle:'Citrus Verde | Floresco',metaDescription:'Lime, green tea and vetiver.'} },
  { slug:'oud-malaki', name:'Oud Malaki', brand:'Arabian House', category:'arabian-oud',
    tagline:'Aged Cambodian oud with leather and warming spice.', description:'Uncompromising and majestic. Aged oud with soft leather and warming spices.',
    scentNotes:{ top:['Smoky Oud','Cardamom','Cinnamon'], heart:['Damask Rose','Leather','Incense'], base:['Aged Oud','Sandalwood','Amber'] },
    sizes:[{size:'30ml',price:8400,stock:6,sku:'OM-30'},{size:'50ml',price:12500,stock:4,sku:'OM-50'}],
    images:[{url:'',alt:'Oud Malaki',isPrimary:true}], color1:'#2B1F1A',color2:'#6E4A2F', rating:4.9,reviewCount:74,status:'active', seo:{metaTitle:'Oud Malaki | Floresco',metaDescription:'Aged Cambodian oud — royal and uncompromising.'} },
  { slug:'aqua-marine-homme', name:'Aqua Marine Homme', brand:'Designer', category:'men',
    tagline:'Sea accord, neroli and clean white musk.', description:'The freshness of an ocean breeze bottled. Marine accord, neroli and white musk.',
    scentNotes:{ top:['Sea Notes','Mint','Bergamot'], heart:['Neroli','Lavender','Marine'], base:['White Musk','Cedar','Driftwood'] },
    sizes:[{size:'50ml',price:8500,stock:14,sku:'AMH-50'},{size:'100ml',price:12200,stock:8,sku:'AMH-100'}],
    images:[{url:'',alt:'Aqua Marine Homme',isPrimary:true}], color1:'#0E4C63',color2:'#57B3C9', rating:4.5,reviewCount:112,status:'active', seo:{metaTitle:'Aqua Marine Homme | Floresco',metaDescription:'Marine freshness — sea, neroli and musk.'} },
  { slug:'fleur-divoire', name:"Fleur d'Ivoire", brand:'House Niche', category:'women',
    tagline:'Peony, lychee and cashmeran musk.', description:'Soft and radiant. Peonies and lychee over skin-warm cashmeran musk.',
    scentNotes:{ top:['Peony','Lychee','Freesia'], heart:['Rose','Magnolia','Jasmine'], base:['Cashmeran','White Musk','Cedar'] },
    sizes:[{size:'50ml',price:8800,stock:16,sku:'FDI-50'},{size:'100ml',price:13500,stock:9,sku:'FDI-100'}],
    images:[{url:'',alt:"Fleur d'Ivoire",isPrimary:true}], color1:'#B08D3C',color2:'#EBD9A8', rating:4.8,reviewCount:128,status:'active', seo:{metaTitle:"Fleur d'Ivoire | Floresco",metaDescription:'Peony, lychee and musk — softly radiant.'} },
  { slug:'santal-mystique', name:'Santal Mystique', brand:'House Niche', category:'unisex',
    tagline:'Australian sandalwood, cardamom and papyrus.', description:'Meditative and warm. Australian sandalwood with green cardamom and dry papyrus.',
    scentNotes:{ top:['Cardamom','Papyrus','Bergamot'], heart:['Sandalwood','Iris','Violet'], base:['Sandalwood','Cedar','Amber'] },
    sizes:[{size:'50ml',price:11200,stock:13,sku:'SM2-50'},{size:'100ml',price:16500,stock:6,sku:'SM2-100'}],
    images:[{url:'',alt:'Santal Mystique',isPrimary:true}], color1:'#6B4A2E',color2:'#C29B6C', badge:'Staff Pick',rating:4.8,reviewCount:89,status:'active', seo:{metaTitle:'Santal Mystique | Floresco',metaDescription:'Sandalwood and cardamom — meditative and warm.'} },
];

async function seed() {
  console.log('\n🌺 Floresco — Database Seed\n');
  await mongoose.connect(MONGODB_URI!);
  console.log('✓ Connected to MongoDB');

  // Owner user
  const ownerEmail = 'owner@florescofragrances.co.ke';
  const existing = await User.findOne({ email: ownerEmail });
  if (!existing) {
    const hash = await bcrypt.hash('Floresco2026!', 10);
    await User.create({ email: ownerEmail, password: hash, name: 'Floresco Owner', role: 'owner' });
    console.log('✓ Created owner user');
    console.log('  Email:    ' + ownerEmail);
    console.log('  Password: Floresco2026!');
    console.log('  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY after first login\n');
  } else {
    console.log('✓ Owner user already exists');
  }

  // Products
  let created = 0, skipped = 0;
  for (const product of PRODUCTS) {
    try {
      await Product.findOneAndUpdate({ slug: product.slug }, product, { upsert: true, new: true });
      created++;
    } catch {
      skipped++;
    }
  }
  console.log(`✓ Products: ${created} upserted, ${skipped} skipped`);

  await mongoose.disconnect();
  console.log('\n✅ Seed complete. Run `npm run dev` to start the server.\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
