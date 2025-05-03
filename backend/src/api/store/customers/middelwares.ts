import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from '@medusajs/framework';
import { MiddlewaresConfig } from '@medusajs/medusa';
export const config: MiddlewaresConfig = {
  routes: [
    {
      method: ['GET'], // HTTP verb(s)
      matcher: '/store/customers/:id/cart', // the exact path
      middlewares: [
        authenticate('customer', ['bearer', 'session']), // require a logged-in customer
      ],
    },
    // {
    //   method: ['POST'], // HTTP verb(s)
    //   matcher: '/store/customers/:id/cart/save-cc', // the exact path
    //   middlewares: [
    //     authenticate('customer', ['bearer', 'session']), // require a logged-in customer
    //   ],
    // },
  ],
};
