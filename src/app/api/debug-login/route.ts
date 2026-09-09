import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models';

export const runtime = 'nodejs';

// TEMPORARY diagnostic route — replicates the credentials authorize() flow
// exactly, reporting only booleans/timing, never the password hash.
// Delete this file once login is confirmed working.
export async function POST(req: NextRequest) {
  const started = Date.now();
  try {
    const { email, password } = await req.json();
    await connectDB();
    const connectedMs = Date.now() - started;

    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    const lookupMs = Date.now() - started;

    if (!user) {
      return NextResponse.json({ connectedMs, lookupMs, userFound: false });
    }

    const hasPasswordField = !!user.password;
    let passwordMatches: boolean | null = null;
    if (hasPasswordField && password) {
      passwordMatches = await bcrypt.compare(password, user.password);
    }
    const totalMs = Date.now() - started;

    return NextResponse.json({
      connectedMs,
      lookupMs,
      totalMs,
      userFound: true,
      role: user.role,
      hasPasswordField,
      passwordMatches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, elapsedMs: Date.now() - started }, { status: 500 });
  }
}
