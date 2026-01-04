import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Prefer WebP format for better compression
    formats: ["image/webp"],
    remotePatterns: [
      // Cloudflare Images (main Farcaster CDN)
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        pathname: "/**",
      },
      // AWS CloudFront (IPFS gateway, NFT images)
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
        pathname: "/**",
      },
      // Imgur
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "/**",
      },
      // Warpcast
      {
        protocol: "https",
        hostname: "*.warpcast.com",
        pathname: "/**",
      },
      // IPFS gateways
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ipfs.io",
        pathname: "/**",
      },
      // Pinata IPFS (multiple subdomains)
      {
        protocol: "https",
        hostname: "*.pinata.cloud",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.mypinata.cloud",
        pathname: "/**",
      },
      // Arweave
      {
        protocol: "https",
        hostname: "arweave.net",
        pathname: "/**",
      },
      // Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Lens Protocol
      {
        protocol: "https",
        hostname: "*.lens.dev",
        pathname: "/**",
      },
      // NFT.storage
      {
        protocol: "https",
        hostname: "*.nftstorage.link",
        pathname: "/**",
      },
      // Generic image hosts
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
