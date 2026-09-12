/* MongoDB connections from Cloudflare Workers occasionally hang well past
   any timeout configured on the connection itself (observed hangs of 20s+
   even with a 6s serverSelectionTimeoutMS) — wrap any DB-dependent work in
   a hard wall-clock deadline so a route always responds in bounded time
   instead of leaving the client hanging indefinitely. */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label = 'operation'): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
