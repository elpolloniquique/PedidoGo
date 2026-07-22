import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    app: 'merchant-web',
    at: new Date().toISOString(),
  });
}
