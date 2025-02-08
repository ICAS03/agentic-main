/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    outDir: 'out',
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
}

module.exports = nextConfig 