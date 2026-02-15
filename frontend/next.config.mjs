/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable file system polling to reduce file descriptor usage
  webpack: (config) => {
    config.watchOptions = {
      poll: false,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
