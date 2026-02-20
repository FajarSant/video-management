// // middleware.ts
// import { withAuth } from 'next-auth/middleware'
// import { NextResponse } from 'next/server'

// export default withAuth(
//   function middleware(req) {
//     const token = req.nextauth.token
//     const path = req.nextUrl.pathname

//     console.log('🔍 Middleware:', { path, hasToken: !!token, role: token?.role })

//     // PUBLIC ROUTES - selalu izinkan akses
//     if (path === '/login' || path === '/') {
//       // Jika sudah login dan mencoba akses login, redirect ke dashboard
//       if (token && path === '/login') {
//         if (token.role === 'ADMIN') {
//           return NextResponse.redirect(new URL('/admin/dashboard', req.url))
//         } else {
//           return NextResponse.redirect(new URL('/customer/dashboard', req.url))
//         }
//       }
//       return NextResponse.next()
//     }

//     // PROTECTED ROUTES - butuh token
//     if (!token) {
//       return NextResponse.redirect(new URL('/login', req.url))
//     }

//     // ROLE-BASED PROTECTION
//     if (path.startsWith('/admin') && token.role !== 'ADMIN') {
//       return NextResponse.redirect(new URL('/unauthorized', req.url))
//     }

//     if (path.startsWith('/customer') && token.role !== 'CUSTOMER') {
//       return NextResponse.redirect(new URL('/unauthorized', req.url))
//     }

//     return NextResponse.next()
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => {
//         // Return true agar middleware selalu dijalankan
//         return true
//       }
//     },
//     pages: {
//       signIn: '/login',
//     }
//   }
// )

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }