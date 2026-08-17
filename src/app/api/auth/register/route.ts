import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, phone, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required.' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const normalised = email.trim().toLowerCase();
    const existing   = await User.findOne({ email: normalised }).select('+password');

    /* A real, already-registered account has a password set — block it. */
    if (existing?.password) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    /* No account yet, OR a passwordless "guest" record created during a
       guest checkout — either way, claim/create it with the new password. */
    let customer;
    if (existing) {
      existing.name     = name.trim();
      existing.phone    = phone?.trim() || existing.phone;
      existing.password = passwordHash;
      await existing.save();
      customer = existing;
    } else {
      customer = await User.create({
        name:  name.trim(),
        email: normalised,
        phone: phone?.trim() || '',
        role:  'customer',
        password: passwordHash,
      });
    }

    return NextResponse.json(
      { _id: customer._id, name: customer.name, email: customer.email },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
