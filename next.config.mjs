/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('sequelize');
    }
    return config;
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/pt/dashboards/crm',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(pt|en|fr|ar)',
        destination: '/:lang/dashboards/crm',
        permanent: true,
        locale: false
      },
      {
        source: '/((?!(?:pt|en|fr|ar|front-pages|favicon.ico)\\b)):path',
        destination: '/pt/:path',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig