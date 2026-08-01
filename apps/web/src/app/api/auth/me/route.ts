import { NextResponse } from 'next/server';
import { ADMIN_USERNAME } from '@/lib/config';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== 'mock-jwt-token-for-admin-session-standalone') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const targetUsername = process.env.ADMIN_USERNAME || ADMIN_USERNAME;
    const targetEmail = process.env.ADMIN_EMAIL || 'admin@virtualtour.com';

    return NextResponse.json({
      success: true,
      data: {
        id: 'admin-id-standalone',
        username: targetUsername,
        email: targetEmail,
        lastLoginAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error?.message || 'Server error' } },
      { status: 500 }
    );
  }
}
