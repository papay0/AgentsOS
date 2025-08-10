import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/home(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Redirect authenticated users from root to /home
  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url));
  }
  
  // Protect /home routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};