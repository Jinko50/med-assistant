import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ status: 'running', clinicalReady: false }, { headers: { 'Cache-Control': 'no-store' } }); }
