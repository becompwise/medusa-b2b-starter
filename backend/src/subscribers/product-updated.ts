import { type SubscriberConfig } from '@medusajs/medusa';

// subscriber function
export default async function productUpdateHandler() {
  console.log('A product was updated3');
}

// subscriber config
export const config: SubscriberConfig = {
  event: 'product.updated',
};
