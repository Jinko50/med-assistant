import { NextResponse } from 'next/server';
// Fail closed until deployed auth, schema, safety and operational checks exist.
export async function GET() { return NextResponse.json({ ready: false, reason: 'development_milestone' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
