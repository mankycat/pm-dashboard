import { NextResponse } from 'next/server';
import { getDatabases } from '@/lib/data';

// GET /api/databases
export async function GET() {
    try {
        const databases = await getDatabases();
        return NextResponse.json({ success: true, databases });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
