/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // minimal server bundle for the Docker / Cloud Run image
};

export default nextConfig;
