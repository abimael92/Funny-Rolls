import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'funny-rolls.s3.eu-west-1.amazonaws.com',
				pathname: '/recipe-images/**',
			},
			// Add other domains if needed
			{
				protocol: 'https',
				hostname: 'vnldrvrgfwdwoeuyjrot.supabase.co',
				pathname: '/storage/v1/object/public/**',
			},
		],
	},

	serverExternalPackages: ['@aws-sdk/client-s3'],

	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				stream: require.resolve('stream-browserify'),
				buffer: require.resolve('buffer/'),
			};
		}
		return config;
	},
};

export default nextConfig;
