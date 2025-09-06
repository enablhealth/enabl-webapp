import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Prevent ESLint issues from failing production builds
    ignoreDuringBuilds: true,
  },
  env: {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_DOCUMENTS_BUCKET_DEV: process.env.S3_DOCUMENTS_BUCKET_DEV,
    S3_DOCUMENTS_BUCKET_STAGING: process.env.S3_DOCUMENTS_BUCKET_STAGING,
    S3_DOCUMENTS_BUCKET_PROD: process.env.S3_DOCUMENTS_BUCKET_PROD,
  },
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', '@aws-sdk/client-comprehendmedical'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
      };
    }
    return config;
  },
};

export default nextConfig;
