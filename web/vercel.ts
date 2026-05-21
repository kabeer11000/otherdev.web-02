import { routes, deploymentEnv, type VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  crons: [
    {
      path: '/api/qdrant-ping',
      schedule: '0 12 */2 * *',
    },
  ],
  functions: {
    'app/(payload)/admin/**': { maxDuration: 60 },
  },
}