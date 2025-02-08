/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    distDir: 'dist',
    images: {
        unoptimized: true,
    },
}

module.exports = nextConfig 