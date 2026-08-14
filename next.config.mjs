/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sequelize", "pino", "pino-pretty", "@react-pdf/renderer", "pdf-lib"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/home/student/in-scricao-monitoria",
        destination: "/home/student/inscricao-monitoria",
        permanent: true,
      },
      {
        source: "/home/student/inscricao",
        destination: "/home/student/inscricao-monitoria",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
