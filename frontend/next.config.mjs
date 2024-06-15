// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/billback-upload', // Adjust this to your BillBack component's path
          permanent: true,
        },
      ];
    },
  
    // Include other configuration options here
    reactStrictMode: true,
    // More custom Next.js config settings can be added here
  };
  
  export default nextConfig;
  