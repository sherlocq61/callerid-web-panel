/** @type {import('next').NextConfig} */
const nextConfig = {
    // Only use standalone for Vercel, not for Electron
    output: process.env.ELECTRON_BUILD ? undefined : 'standalone',
    typescript: {
        // Ignore TypeScript errors during build (Supabase types not up to date)
        ignoreBuildErrors: true,
    },
    eslint: {
        // Ignore ESLint errors during build
        ignoreDuringBuilds: true,
    },
    reactStrictMode: true,
    // Webpack configuration for Electron
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            }
        }
        return config
    },
}

module.exports = nextConfig
