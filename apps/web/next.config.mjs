/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@seethapaati/contracts'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;

