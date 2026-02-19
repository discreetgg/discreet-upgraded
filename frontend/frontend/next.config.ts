/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "api.discreet.fans",
			},
			{
				protocol: "https",
				hostname: "discreet.gg",
			},
			{
				protocol: "https",
				hostname: "**.discreet.gg",
			},
			{
				protocol: "https",
				hostname: "**.discreet.fans",
			},
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
			{
				protocol: "https",
				hostname: "cdn.discordapp.com",
			},
			{
				protocol: "https",
				hostname: "media.discordapp.net",
			},
			{
				protocol: "http",
				hostname: "localhost",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
			},
		],
		// Optimize images
		formats: ["image/avif", "image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
	// Enable compression
	compress: true,
	// Experimental optimizations
	experimental: {
		optimizePackageImports: [
			"@radix-ui/react-accordion",
			"@radix-ui/react-alert-dialog",
			"@radix-ui/react-avatar",
			"@radix-ui/react-checkbox",
			"@radix-ui/react-dialog",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-hover-card",
			"@radix-ui/react-popover",
			"@radix-ui/react-select",
			"@radix-ui/react-tabs",
			"@radix-ui/react-tooltip",
			"lucide-react",
			"recharts",
			"date-fns",
		],
	},
	// Optimize bundle size
	webpack: (config: any, { isServer }: { isServer: boolean }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
			};
		}
		return config;
	},
	// Turbopack configuration (Next.js 16+)
	turbopack: {
		// Empty config to silence the error
		// The webpack config above will be used when using --webpack flag
	},
};

export default nextConfig;
