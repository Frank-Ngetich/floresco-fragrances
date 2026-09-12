import mongoose from 'mongoose';

// Cloudflare Workers cancels a promise that resolves in a different request
// context than the one that created it. Caching an in-flight *pending*
// mongoose.connect() promise across requests (the standard pattern for
// long-lived serverless containers) means a second request can end up
// awaiting a connection attempt a different, possibly-already-finished
// request started — an unsafe cross-request handoff on Workers. Instead,
// only ever reuse an already-*established* connection (mongoose's own
// readyState), and let each request that needs one own its connect call
// end-to-end within its own lifecycle.
//
// If an earlier request got cut off mid-handshake, the global mongoose
// singleton (shared across requests reusing the same warm Workers isolate)
// can be left in a stuck, non-0/non-1 readyState — every later request in
// that isolate would otherwise inherit that broken state forever. Force-close
// and retry fresh whenever that happens, and after a failed attempt, so the
// next request always starts clean.
export async function connectDB(): Promise<typeof mongoose> {
  const state = mongoose.connection.readyState;

  if (state === 1) {
    return mongoose;
  }

  if (state !== 0) {
    try { await mongoose.connection.close(); } catch {}
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const opts = {
    bufferCommands: false,
    // A Workers isolate handles one request at a time and is short-lived —
    // a large pool just means more sockets to open (each a full TLS
    // handshake) before any of them are useful, and more state to leak
    // across isolate recycling. A single connection reused via readyState
    // is both cheaper to establish and simpler to reason about here.
    maxPoolSize: 1,
    minPoolSize: 0,
    family: 4, // skip IPv6 resolution attempts — pure overhead on Workers' network stack
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 8000,
    heartbeatFrequencyMS: 30000,
  };

  // A fresh handshake from a cold Workers isolate to Atlas occasionally
  // blips (DNS, TLS, a slow shard) — one quick retry clears most of those
  // instead of surfacing a failure the caller then has to fall back from.
  try {
    await mongoose.connect(MONGODB_URI, opts);
  } catch (err) {
    try { await mongoose.connection.close(); } catch {}
    await new Promise(r => setTimeout(r, 300));
    try {
      await mongoose.connect(MONGODB_URI, opts);
    } catch (retryErr) {
      try { await mongoose.connection.close(); } catch {}
      throw retryErr;
    }
  }

  return mongoose;
}
