# Module Links

A module link forms an association between two data models of different modules, while maintaining module isolation.

For example:

```ts
import HelloModule from '../modules/hello';
import ProductModule from '@medusajs/product';
import { defineLink } from '@medusajs/framework/utils';

export default defineLink(
  ProductModule.linkable.product,
  HelloModule.linkable.myCustom
);
```

This defines a link between the Product Module's `product` data model and the Hello Module (custom module)'s `myCustom` data model.

Learn more about links in [this documentation](https://docs.medusajs.com/v2/advanced-development/modules/module-links)

## sync the Link to the Database

A module link is represented in the database as a table that stores the IDs of linked records. So, after defining the link, run the following command to create the module link's table in the database:

```
npx medusa db:migrate
```
