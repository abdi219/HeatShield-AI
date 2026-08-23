/** @type {import('next').NextConfig} */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://unpkg.com;
  worker-src 'self' blob:;
  child-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com;
  img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://*.tile.openstreetmap.org https://unpkg.com https://cdnjs.cloudflare.com https://*.arcgisonline.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://nominatim.openstreetmap.org https://router.project-osrm.org https://api.open-meteo.com https://api.groq.com https://api.fortyguard.com https://*.supabase.co;
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Content-Security-Policy', value: cspHeader },
        ],
      },
    ];
  },
};

export default nextConfig;

