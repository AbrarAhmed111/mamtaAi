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
        {
          protocol: 'https',
          hostname: 'media.istockphoto.com',
        },
        {
          protocol: 'https',
          hostname: '**.istockphoto.com',
        },
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
        },
        {
          protocol: 'https',
          hostname: '**.unsplash.com',
        },
        {
          protocol: 'https',
          hostname: '**.pexels.com',
        },
        {
          protocol: 'https',
          hostname: '**.pixabay.com',
        },
        {
          protocol: 'https',
          hostname: 'static.vecteezy.com',
        },
        {
          protocol: 'https',
          hostname: '**.static.vecteezy.com',
        },
        {
          protocol: 'https',
          hostname: '**.vecteezy.com',
        },
        {
          protocol: 'https',
          hostname: 'www.google.com',
        },
        {
          protocol: 'https',
          hostname: '**.google.com',
        },
      ],
      unoptimized: false, // Set to true if you want to skip image optimization
    },
  };
  
  export default nextConfig;
  