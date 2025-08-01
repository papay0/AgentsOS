import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'Vibe code from anywhere with AgentsPod';
    const subtitle = searchParams.get('subtitle') || 'Even from your phone • No setup';
    
    return new ImageResponse(
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 20%, #1e40af 40%, #3b82f6 60%, #6366f1 80%, #8b5cf6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)',
          opacity: 0.6,
        }} />
        
        {/* Floating Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.2))',
          filter: 'blur(40px)',
        }} />
        
        
        {/* Terminal Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100px',
          height: '100px',
          marginBottom: '40px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(45deg, #3b82f6, #6366f1)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
          }}>
            &gt;_
          </div>
        </div>
        
        {/* Main Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
        }}>
          {/* Main Message with Better Styling */}
          <div style={{
            fontSize: '64px',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            textShadow: '0 2px 20px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)',
            maxWidth: '1000px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '32px',
          }}>
            {title}
          </div>
          
          {/* Subtitle */}
          <div style={{
            fontSize: '36px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            marginBottom: '40px',
          }}>
            {subtitle}
          </div>
        
          {/* Accent Line */}
          <div style={{
            width: '200px',
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)',
            borderRadius: '2px',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
          }} />
        </div>
        
        {/* Corner Decorations */}
        <div style={{
          position: 'absolute',
          bottom: '8%',
          right: '8%',
          display: 'flex',
          gap: '8px',
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.6)',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.6)',
            boxShadow: '0 0 8px rgba(99, 102, 241, 0.8)',
          }} />
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.6)',
            boxShadow: '0 0 6px rgba(139, 92, 246, 0.8)',
          }} />
        </div>
        
        {/* Bottom Brand */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          fontSize: '24px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '600',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        }}>
          AgentsPod.dev
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