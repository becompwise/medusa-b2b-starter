import { type SubscriberArgs, type SubscriberConfig } from '@medusajs/medusa';
import { ModuleRegistrationName } from '@medusajs/framework/utils';
import {
  IProductModuleService,
  IPricingModuleService,
} from '@medusajs/framework/types';

type ProductCreatedPayload = { id: string };

export default async function productCreateHandler({
  event: { data },
  container,
}: SubscriberArgs<ProductCreatedPayload>) {
  const logger = container.resolve('logger');

  try {
    /* ——— module services ——— */
    const productService = container.resolve<IProductModuleService>(
      ModuleRegistrationName.PRODUCT
    );
    const pricingService = container.resolve<IPricingModuleService>(
      ModuleRegistrationName.PRICING
    );

    /* ①  product + variants (NO “variants.prices”) */
    const product = await productService.retrieveProduct(data.id, {
      relations: ['variants'],
    });

    /* already handled once */
    if (product.metadata?.pack_sale) return;

    /* ②  metadata */
    const amount = 0.0;
    const pack_sale = {
      is_pack_sale: true,
      pack_chart: [
        { size: 'S', ratio: 2 },
        { size: 'M', ratio: 1 },
        { size: 'L', ratio: 2 },
      ],
      unit_price: amount,
    };

    await productService.updateProducts(product.id, {
      metadata: { ...product.metadata, pack_sale },
    });

    /* ③  seed each variant’s price‑set with USD 0.00 */
    const defaultPrice = {
      amount: amount,
      currency_code: 'usd',
      rules: {},
    };

    for (const v of product.variants) {
      const priceSetId = (v as any).price_set_id;
      if (!priceSetId) {
        logger.warn(
          `Variant ${v.id} has no price_set_id → skipping price seed`
        );
        continue;
      }

      await pricingService.addPrices({
        priceSetId,
        prices: [defaultPrice],
      });
    }

    logger.info(
      `pack_sale metadata + default prices seeded for product ${product.id}`
    );
  } catch (err) {
    logger.error(`pack_sale subscriber error: ${err}`);
    console.error(err);
  }
}

export const config: SubscriberConfig = {
  event: 'product.created',
};
