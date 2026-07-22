import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    app: 'customer-tracking',
    at: new Date().toISOString(),
  });
}
