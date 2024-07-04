/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, 
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        port: "",
      },
    ],
    domains: ["localhost", "*.googleusercontent.com"],
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public", // Destination directory for the PWA files
    cacheOnFrontEndNav:true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify:true,
    disable:false,
    workboxOptions:{
        disableDevLogs: true,
    },
  });


module.exports = withPWA(nextConfig)
  