/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/**',
      },
      // Supabase storage - local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase storage - production (add your production domain)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  allowedDevOrigins: ['http://127.0.0.1:3000', 'http://localhost:3000'],

  // Webpack configuration to handle Supabase warnings
  webpack: (config, { isServer }) => {
    // Suppress specific warnings from Supabase realtime client
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ]

    // Optimize webpack cache for better performance
    if (!isServer) {
      config.cache = {
        ...config.cache,
        maxMemoryGenerations: 1,
      }
    }

    // Handle dynamic imports in Supabase
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },

  // Experimental features to improve performance
  experimental: {
    // Enable webpack build worker for faster builds
    webpackBuildWorker: true,
    // Optimize package imports
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
}

export default nextConfig
