import mongoose from 'mongoose';

// Cloudflare Workers cancels a promise that resolves in a different request
// context than the one that created it. Caching an in-flight *pending*
// mongoose.connect() promise across requests (the standard pattern for
// long-lived serverless containers) means a second request can end up
// awaiting a connection attempt a different, possibly-already-finished
// request started — an unsafe cross-request handoff on Workers. Instead,
// only ever reuse an already-*established* connection (mongoose's own
// readyState), and let each request that needs one own its own connect
// call end-to-end within its own lifecycle.
export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  });

  return mongoose;
}
