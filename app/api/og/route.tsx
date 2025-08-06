import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'AgentsOS';
    const subtitle = searchParams.get('subtitle') || 'Code Anywhere, Anytime.';
    const subtitle2 = searchParams.get('subtitle2') || 'Claude Code built-in, zero setup.';
    
    return new ImageResponse(
      <div
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #111827 25%, #1e1b4b 50%, #4c1d95 75%, #ec4899 100%)',
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '1200px',
          height: '630px',
          backgroundImage: 'radial-gradient(circle at 240px 315px, rgba(147, 51, 234, 0.3) 0%, transparent 300px), radial-gradient(circle at 960px 315px, rgba(236, 72, 153, 0.3) 0%, transparent 300px)',
          opacity: 0.7,
        }} />
        
        {/* AI OS badge */}
        <div style={{
          position: 'absolute',
          top: '100px',
          left: '60px',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontWeight: '500',
        }}>
          Your AI Coding Operating System
        </div>
        
        
        {/* Main content - centered with flexbox */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '1000px',
        }}>
          {/* Main Title */}
          <div style={{
            fontSize: '96px',
            fontWeight: '800',
            color: 'white',
            lineHeight: 1,
            letterSpacing: '-2px',
            marginBottom: '40px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {title}
          </div>
          
          {/* Subtitle Line 1 */}
          <div style={{
            fontSize: '32px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '16px',
            letterSpacing: '0px',
          }}>
            {subtitle}
          </div>
          
          {/* Subtitle Line 2 */}
          <div style={{
            fontSize: '28px',
            fontWeight: '400',
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: '0px',
          }}>
            {subtitle2}
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: unknown) {
    console.log(`Error generating OG image: ${e instanceof Error ? e.message : String(e)}`);
    return new Response(`Failed to generate OG image`, {
      status: 500,
    });
  }
}