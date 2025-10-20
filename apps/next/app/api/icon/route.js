// app/api/icon/route.js

// ⛔️ полностью отключаем SSG/ISR для роута
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs'; // исключаем edge

// ❌ УДАЛИТЕ 'use server' вверху файла

export async function GET(request) {
  // ⬇️ динамические импорты, чтобы сборщик не подхватывал react-dom/server на этапе анализа
  const { renderToString } = await import('react-dom/server');
  const Icons = await import('lucide-react');

  try {
    const { searchParams } = new URL(request.url);
    const iconName = searchParams.get('icon') || '';
    const IconComponent = Icons[iconName];

    if (!IconComponent) {
      return new Response(JSON.stringify({ icon: '' }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const width = searchParams.get('width');
    const height = searchParams.get('height');
    const size = searchParams.get('size');
    const fill = searchParams.get('fill');
    const strokeWidth = searchParams.get('strokeWidth');

    const iconProps = {
      color: 'currentColor',
      ...(width && { width }),
      ...(height && { height }),
      ...(size && { size }),
      ...(fill && { fill }),
      ...(strokeWidth && { strokeWidth }),
    };

    const svg = renderToString(<IconComponent {...iconProps} />);

    return new Response(JSON.stringify({ icon: svg }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('Error rendering icon:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}
