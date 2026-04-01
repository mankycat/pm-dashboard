import { NextResponse } from 'next/server';
import { getPages, createPageInDb, updatePage, deletePage, Page } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

// GET /api/pages?databaseId=xyz&projectId=abc
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const databaseId = searchParams.get('databaseId');
        const projectId = searchParams.get('projectId'); // optional filter
        
        if (!databaseId) {
            return NextResponse.json({ success: false, error: 'databaseId is required' }, { status: 400 });
        }

        let pages = await getPages(databaseId);

        // Very basic simple filtering if a projectId is provided.
        // It blindly checks if ANY property on the page specifically matches the projectId
        if (projectId) {
            pages = pages.filter(p => Object.values(p.properties).includes(projectId));
        }

        return NextResponse.json({ success: true, pages });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

// POST /api/pages
// Body: { databaseId: string, title: string, properties?: any, content?: string }
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { databaseId, title, properties, content } = body;

        if (!databaseId || !title) {
            return NextResponse.json({ success: false, error: 'databaseId and title are required' }, { status: 400 });
        }

        const newPage: Page = {
            id: uuidv4(),
            databaseId,
            title,
            properties: properties || {},
            content: content || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await createPageInDb(newPage);
        return NextResponse.json({ success: true, page: newPage });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

// PATCH /api/pages
// Body: { databaseId: string, pageId: string, title?: string, properties?: any, content?: string }
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { databaseId, pageId, title, properties, content } = body;

        if (!databaseId || !pageId) {
            return NextResponse.json({ success: false, error: 'databaseId and pageId are required' }, { status: 400 });
        }

        let updatedProps: unknown = null;

        await updatePage(databaseId, pageId, (page) => {
            if (title !== undefined) page.title = title;
            if (content !== undefined) page.content = content;
            if (properties !== undefined && typeof properties === 'object') {
                page.properties = { ...page.properties, ...properties };
            }
            updatedProps = page;
        });

        return NextResponse.json({ success: true, page: updatedProps });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

// DELETE /api/pages
// Body: { databaseId: string, pageId: string }
export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { databaseId, pageId } = body;

        if (!databaseId || !pageId) {
            return NextResponse.json({ success: false, error: 'databaseId and pageId are required' }, { status: 400 });
        }

        await deletePage(databaseId, pageId);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
