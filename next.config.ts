
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    // Required for graphql-ws in Node.js environment
    // Only apply this configuration on the server-side
    if (!config.resolve.fallback) {
        config.resolve.fallback = {};
    }
     if (typeof window === 'undefined') {
        config.resolve.fallback.ws = require.resolve('ws');
     }
     // Add rule to handle .gql or .graphql files
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      loader: 'graphql-tag/loader',
    });

    return config;
  },
};

export default nextConfig;
