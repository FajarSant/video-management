// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nonaktifkan server actions sepenuhnya
  experimental: {
    serverActions: false
  },
  
  // Tambahkan konfigurasi untuk API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },

  // Konfigurasi untuk menangani file besar
  api: {
    responseLimit: '100mb',
    bodyParser: {
      sizeLimit: '100mb'
    }
  }
}

module.exports = nextConfig