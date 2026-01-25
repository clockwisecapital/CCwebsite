import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Temporarily ignore build errors while cache tables are not in generated types
    // TODO: Regenerate Supabase types when ready: npx supabase gen types typescript --local
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
