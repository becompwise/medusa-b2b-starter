import type { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/utils';
import { decrypt, encrypt } from '../../../../../lib/util/crypto'; // adjust to root
import { NextFunction } from 'express';

/**
 * GET /admin/orders/:id/manual-cc
 * Returns decrypted card data that was stored in order.metadata.
 *
 * Access is protected by the default Admin auth middleware, so only
 * logged‑in staff can fetch it.
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse,
  _next: NextFunction
) => {
  const orderId = req.params.id;

  /* 1  Resolve the Graph‑Query service — no OrderService */
  const queryService = req.scope.resolve(
    ContainerRegistrationKeys.QUERY
  ) as any;

  /* 2  Fetch exactly the fields we need */
  const { data: orders } = await queryService.graph(
    {
      entity: 'order',
      // we only need metadata; limit to 1 row
      fields: ['id', 'metadata'],
      filters: { id: orderId as any } as any,
      pagination: { take: 1 },
    },
    { throwIfKeyNotFound: false }
  );

  const order = orders?.[0];

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const meta: Record<string, any> = order.metadata || {};

  if (!meta.enc_number || !meta.enc_cvc) {
    return res
      .status(404)
      .json({ message: 'No manual‑credit‑card metadata found' });
  }

  /* 3  Decrypt on the server (Node has crypto) */
  let pan = '•••• ' + meta.last4digit;
  let cvc = '•••';

  try {
    pan = decrypt(meta.enc_number);
    cvc = decrypt(meta.enc_cvc);
  } catch {
    /* leave masked fallback if decryption fails */
  }

  /* 4  Return clear‑text (or masked) values */
  return res.json({
    cardholder: meta.cardholder,
    pan,
    cvc,
    expiry_month: meta.expiry_month,
    expiry_year: meta.expiry_year,
  });
};
