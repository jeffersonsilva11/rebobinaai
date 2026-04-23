/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

// Em dev, o Next precisa de 'unsafe-eval' (React Refresh) e 'unsafe-inline'
// (hot reload). Em produção removemos 'unsafe-eval' e mantemos só
// 'unsafe-inline' para scripts gerados pelo Next (chunks e styled-jsx).
// Próximo passo (fora deste fix): nonce via middleware elimina o inline.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com"
  : "script-src 'self' 'unsafe-inline' https://www.youtube.com"

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "img-src 'self' https://image.tmdb.org https://img.youtube.com https://lh3.googleusercontent.com data:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              scriptSrc,
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self' https://api.themoviedb.org https://www.omdbapi.com https://www.googleapis.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
