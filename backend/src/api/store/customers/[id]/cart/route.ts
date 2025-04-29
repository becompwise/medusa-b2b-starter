// File: backend/src/api/store/customers/[id]/cart/route.ts

import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/utils';

/**
 * GET /store/customers/:id/cart
 * Retrieves the active (incomplete) cart for the given customer using Graph-based query.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = req.params.id;
  // Resolve Medusa's Graph Query service
  const queryService = req.scope.resolve(
    ContainerRegistrationKeys.QUERY
  ) as any;

  // Fetch cart where customer_id matches and cart is not completed
  const { data: carts } = await queryService.graph(
    {
      entity: 'cart',
      fields: 'id, customer_id, created_at, updated_at',
      filters: {
        // Cast to any to avoid TS mismatches
        customer_id: customerId as any,
        completed_at: null as any,
        deleted_at: null as any,
      } as any,
    },
    { throwIfKeyNotFound: false }
  );
  // console.log('backend_carts', carts);
  const cart = carts[0];
  if (!cart) {
    return res
      .status(404)
      .json({ message: 'No active cart found for this customer.' });
  }

  // Return the found cart
  return res.json({ cart });
};
