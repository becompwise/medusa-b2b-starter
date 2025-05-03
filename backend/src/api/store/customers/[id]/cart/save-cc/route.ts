// // backend/src/api/store/customers/[id]/cart/save-cc/route.ts
// import type { MedusaRequest, MedusaResponse } from '@medusajs/framework';
// import { ContainerRegistrationKeys } from '@medusajs/utils';
// import { encrypt } from '../../../../../../lib/util/crypto';

// export const POST = {
//   authenticated: false,

//   handler: async (req: MedusaRequest, res: MedusaResponse) => {
//     const customerId = req.params.id;
//     const { cardholder, card_number, expiry_month, expiry_year, cvc } =
//       req.body as any;

//     if (!cardholder || !card_number || !expiry_month || !expiry_year || !cvc) {
//       return res.status(400).json({ error: 'Missing fields' });
//     }

//     /* 1  Find the active cart (incomplete) */
//     const qs = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any;
//     const { data: carts } = await qs.graph(
//       {
//         entity: 'cart',
//         fields: ['id'],
//         filters: {
//           customer_id: customerId as any,
//           completed_at: null as any,
//           deleted_at: null as any,
//         } as any,
//         pagination: { skip: 0, take: 1, order: { created_at: 'DESC' } },
//       },
//       { throwIfKeyNotFound: false }
//     );
//     const cart = carts[0];
//     console.log('### backend > cart', cart);
//     if (!cart) return res.status(404).json({ error: 'No active cart' });

//     /* 2  Persist encrypted card metadata */
//     const link = req.scope.resolve(
//       ContainerRegistrationKeys.LINK // ✅ preferred token
//     ) as any; // Link type

//     await link.update('cart', {
//       // (entity, partial‑data)
//       id: cart.id,
//       metadata: {
//         cardholder,
//         enc_number: encrypt(card_number),
//         enc_cvc: encrypt(cvc),
//         last4digit: card_number.slice(-4),
//         expiry_month,
//         expiry_year,
//       },
//     });
//     /* 3  Return success so checkout continues */
//     return res.json({ saved: true, cart_id: cart.id });
//   },
// };
