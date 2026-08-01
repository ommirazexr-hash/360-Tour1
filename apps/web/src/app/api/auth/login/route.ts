import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { ADMIN_USERNAME, ADMIN_PASSWORD_HASH } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Username and password are required' } },
        { status: 400 }
      );
    }

    // 1. Resolve Admin credentials from env variables or static config fallback
    const targetUsername = process.env.ADMIN_USERNAME || ADMIN_USERNAME;
    const targetEmail = process.env.ADMIN_EMAIL || 'admin@virtualtour.com';
    
    // Hash password to compare
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    let isMatched = false;

    // Check if a plain-text password is set in env vars (Vercel)
    if (process.env.ADMIN_PASSWORD) {
      isMatched = password === process.env.ADMIN_PASSWORD;
    } else {
      // Check against hashed password env var or fallback config
      const targetPasswordHash = process.env.ADMIN_PASSWORD_HASH || ADMIN_PASSWORD_HASH;
      isMatched = passwordHash === targetPasswordHash;
    }

    const isUsernameMatched = username.toLowerCase() === targetUsername.toLowerCase() || username.toLowerCase() === targetEmail.toLowerCase();

    if (isUsernameMatched && isMatched) {
      return NextResponse.json({
        success: true,
        data: {
          token: 'mock-jwt-token-for-admin-session-standalone',
          admin: {
            id: 'admin-id-standalone',
            username: targetUsername,
            email: targetEmail,
            lastLoginAt: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json(
      { success: false, error: { message: 'Invalid credentials' } },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error?.message || 'Server error' } },
      { status: 500 }
    );
  }
}
