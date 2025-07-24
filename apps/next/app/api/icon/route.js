import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const iconName = searchParams.get('icon');
    
    if (iconName) {
        const width = searchParams.get('width') || '24';
        const height = searchParams.get('height') || '24';
        const size = searchParams.get('size') || '24';
        const strokeWidth = searchParams.get('strokeWidth') || '2';
        
        // Return the icon configuration for client-side rendering
        const iconData = {
            iconName,
            width: width || size,
            height: height || size,
            strokeWidth,
            color: 'currentColor'
        };
        
        return NextResponse.json({ iconData }, { status: 200 });
    } else {
        return NextResponse.json({ iconData: null }, { status: 400 });
    }
}