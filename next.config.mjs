/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      // This allows Next.js to serve images from the local 'public' folder
      // You can also specify external domains if needed
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'ui-avatars.com',
        },
        {
          protocol: 'https',
          hostname: '**.supabase.co',
        },
        {
          protocol: 'https',
          hostname: '**.supabase.in',
        },
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
        },
      ],
      unoptimized: false, // Set to true if you want to skip image optimization
    },
  };
  
  export default nextConfig;
  