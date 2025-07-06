/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  webpack: (config, { isServer }) => {
    // Ignore problematic directories that cause Watchpack errors
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/Applications/**',
        '**/Library/**',
        '**/System/**',
        '**/Volumes/**',
        '**/private/**',
        '**/usr/**',
        '**/var/**',
        '**/tmp/**',
        '**/*.app/**',
        '**/*.asar/**',
      ],
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'sample-videos.com',
      },
      {
        protocol: 'https',
        hostname: 'iilqncqvslmlzuzkaehw.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
}

module.exports = nextConfig
