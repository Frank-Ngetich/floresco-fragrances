import type { Metadata } from 'next';
import { ContactClient } from '@/components/contact/ContactClient';
export const metadata: Metadata = { title: 'Visit & Contact', description: 'Visit Floresco at Kapsoya Business Park, Eldoret.' };
export default function ContactPage() { return <ContactClient />; }
