import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global { var __mongooseCache: MongooseCache | undefined; }

const cached: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cached;

let dnsConfigured = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!dnsConfigured) {
    dnsConfigured = true;
    // Node's bundled DNS resolver sometimes can't complete the SRV/TXT
    // lookup mongodb+srv:// needs on Windows, even though the OS resolver
    // can. Set this right before connecting so it applies in whichever
    // process/worker actually handles the request.
    const dns = await import('node:dns');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
