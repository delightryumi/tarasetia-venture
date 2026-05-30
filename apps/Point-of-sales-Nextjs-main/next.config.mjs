import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: join(__dirname, '../../'),
  images: {
    domains: [
      'images.unsplash.com',
      'openweathermap.org',
      'pbs.twimg.com',
      'via.placeholder.com',
    ],
  },
  env: {
    WEATHER_API: process.env.WEATHER_API,
  },
};

export default nextConfig;
