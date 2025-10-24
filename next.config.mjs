/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['@supabase/supabase-js'],
    eslint: {
      ignoreDuringBuilds: false,
    },
    typescript: {
      ignoreBuildErrors: false,
    },
    images: {
      domains: ['ullxlqclnuyrykduzvfb.supabase.co'],
      unoptimized: true,
    },
    outputFileTracingRoot: process.cwd(),
  }
  
  export default nextConfig
  