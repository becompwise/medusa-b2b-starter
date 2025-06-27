# Custom Module

A module is a package of reusable functionalities. It can be integrated into your Medusa application without affecting the overall system.

To create a module:

## 1. Create a Service

A module must define a service. A service is a TypeScript or JavaScript class holding methods related to a business logic or commerce functionality.

For example, create the file `src/modules/brand/service.ts` with the following content:

```ts title="src/modules/brand/service.ts"
export default class BrandModuleService {
  getMessage() {
    return 'Brand, world!';
  }
}
```

## 2. Export Module Definition

A module must have an `index.ts` file in its root directory that exports its definition. The definition specifies the main service of the module.

For example, create the file `src/modules/brand.index.ts` with the following content:

```ts title="src/modules/brand.index.ts" highlights={[["4", "", "The main service of the module."]]}
import BrandModuleService from './service';
import { Module } from '@medusajs/framework/utils';

export const BRAND_MODULE = 'brandModuleService';

export default Module(BRAND_MODULE, {
  service: BrandModuleService,
});
```

## 3. Add Module to Configurations

The last step is to add the module in Medusa’s configurations.

In `medusa-config.js`, add the module to the `modules` object:

```js title="medusa-config.js"
import { BRAND_MODULE } from './src/modules/brand';

module.exports = defineConfig({
  // ...
  modules: {
    [BRAND_MODULE]: {
      resolve: './modules/brand',
    },
  },
});
```

Its key (`brandModuleService` or `BRAND_MODULE`) is the name of the module’s main service. It will be registered in the Medusa container with that name.

## 4. Generate Migrations

To generate a migration for the Blog Module, run the following command in your Medusa application's directory:

```
npx medusa db:generate brand
```

## 5. Run Mirations

To reflect the changes in the generated migration file on the database, run the db:migrate command:

```
npx medusa db:migrate
```

## Use Module

You can resolve the main service of the module in other resources, such as an API route:

```ts
import { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import BrandModuleService from '../../../modules/brand/service';
import { BRAND_MODULE } from '../../../modules/brand';

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const brandModuleService: BrandModuleService =
    req.scope.resolve(BRAND_MODULE);

  res.json({
    message: brandModuleService.getMessage(),
  });
}
```
