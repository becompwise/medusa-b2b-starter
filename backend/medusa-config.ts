import { QUOTE_MODULE } from './src/modules/quote';
import { APPROVAL_MODULE } from './src/modules/approval';
import { COMPANY_MODULE } from './src/modules/company';
import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV!, process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  modules: {
    [COMPANY_MODULE]: {
      resolve: './modules/company',
    },
    [QUOTE_MODULE]: {
      resolve: './modules/quote',
    },
    [APPROVAL_MODULE]: {
      resolve: './modules/approval',
    },
    [Modules.CACHE]: {
      resolve: '@medusajs/medusa/cache-inmemory',
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: '@medusajs/medusa/workflow-engine-inmemory',
    },
    [Modules.PAYMENT]: {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: './src/modules/manual-payment', // ← our file
            id: 'cc',
          },
          // //------------------------------------------------
          // // Stripe  (cards)
          // //------------------------------------------------
          // {
          //   resolve: '@medusajs/payment-stripe',
          //   id: 'stripe',
          //   options: {
          //     apiKey: process.env.STRIPE_API_KEY!, // REQUIRED
          //     webhookSecret: process.env.STRIPE_WEBHOOK_SECRET, // prod
          //   },
          // },
          // //------------------------------------------------
          // // Pay-by-invoice / offline
          // //------------------------------------------------
          // {
          //   resolve: '@rokmohar/medusa-payment-manual',
          //   id: 'manual',
          //   options: {
          //     // instructions: "Wire funds to …" // optional
          //   },
          // },
        ],
      },
    },
  },
  // for production mode, admin block needed
  // admin: {
  //   disable: process.env.DISABLE_MEDUSA_ADMIN == 'true', // ✅ Make sure admin is explicitly enabled
  //   path: '/app', // ✅ Optional: Set path for /app
  //   backendUrl: process.env.VITE_MEDUSA_BACKEND_URL,
  // },
  // others:
  // admin: {
  //   disable: true, //process.env.DISABLE_MEDUSA_ADMIN === 'true',
  //   // path: '/app',
  // },
});
