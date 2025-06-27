import { Module } from '@medusajs/framework/utils';
import ProductPackService from './service';

export const PRODUCT_PACK_MODULE = 'product_pack';

export default Module(PRODUCT_PACK_MODULE, {
  service: ProductPackService,
});
