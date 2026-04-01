import { NextResponse } from 'next/server';
import { getDatabases } from '@/lib/data';

// GET /api/databases
export async function GET() {
    try {
        const databases = await getDatabases();
        return NextResponse.json({ success: true, databases });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
