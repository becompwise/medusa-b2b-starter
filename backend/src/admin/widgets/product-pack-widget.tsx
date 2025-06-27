// frontend/admin/widgets/product-pack-widget.tsx
import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { DetailWidgetProps, AdminProduct } from '@medusajs/framework/types';
import {
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Button,
  toast,
} from '@medusajs/ui';
import { useState } from 'react';
import { sdk } from '../lib/client';

/**
 * Pack‑sale widget (Medusa v2.7.1).
 *
 * 1.   Edits `metadata.pack_sale` on a product.
 * 2.   After saving metadata it synchronises every variant’s first price row
 *      to `unit_price` using the **admin** product endpoints.
 */

type PackEntry = { ratio: number; size: string };

type PackSale = {
  is_pack_sale: boolean;
  pack_chart: PackEntry[];
  unit_price: number;
};

const PackSaleSettings = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  /* ---------- state ---------- */
  const initial: PackSale = (product.metadata?.pack_sale as PackSale) || {
    is_pack_sale: false,
    pack_chart: [],
    unit_price: 0,
  };

  const [isPackSale, setIsPackSale] = useState(initial.is_pack_sale);
  const [packRows, setPackRows] = useState<PackEntry[]>(initial.pack_chart);
  const [unitPrice, setUnitPrice] = useState<string>(
    initial.unit_price.toFixed(2)
  );

  /* ---------- helpers ---------- */
  const addRow = () => setPackRows((r) => [...r, { ratio: 0, size: '' }]);
  const updateRow = (i: number, e: PackEntry) =>
    setPackRows((r) => r.map((row, idx) => (idx === i ? e : row)));
  const removeRow = (i: number) =>
    setPackRows((r) => r.filter((_, idx) => idx !== i));

  /* ---------- save ---------- */
  const onSave = async () => {
    // validate rows
    for (let i = 0; i < packRows.length; i++) {
      const { size, ratio } = packRows[i];
      if (!size.trim() && ratio > 0) {
        toast.error(`Please enter a size for row ${i + 1}.`);
        return;
      }
    }

    // validate price
    const priceFloat = parseFloat(unitPrice);
    if (isNaN(priceFloat) || priceFloat < 0) {
      toast.error('Please enter a valid unit price.');
      return;
    }

    const cleaned = packRows.filter(
      ({ size, ratio }) => size.trim() || ratio !== 0
    );

    const metadata = {
      ...(product.metadata || {}),
      pack_sale: {
        is_pack_sale: isPackSale,
        pack_chart: cleaned,
        unit_price: priceFloat,
      },
    };

    try {
      /* ① Save metadata via admin product.update */
      await sdk.admin.product.update(product.id, { metadata });

      /* ② Fetch variants (prices included) */
      const { variants } = await sdk.admin.product.listVariants(product.id, {
        fields: 'id,*prices', // include price rows
      });

      /* ③ Upsert first price row to match unit_price (USD cents) */
      const amount = Math.round(priceFloat * 100) / 100;
      await Promise.all(
        variants.map((v: any) =>
          sdk.admin.product.updateVariant(product.id, v.id, {
            prices: [
              {
                id: v.prices?.[0]?.id, // update if exists else create
                currency_code: 'usd',
                amount,
              },
            ],
          })
        )
      );

      toast.success('Pack‑sale metadata & variant prices saved ✔︎');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save pack‑sale settings.');
    }
  };

  /* ---------- UI ---------- */
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Unit Price | Pack‑Sale Settings</Heading>

        {/* price & toggle */}
        <div className="my-4 flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <Label htmlFor="unit-price">Unit Price</Label>
            <Input
              id="unit-price"
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-24"
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="is-pack-sale">Enable Pack Sale</Label>
            <Switch
              id="is-pack-sale"
              checked={isPackSale}
              onCheckedChange={setIsPackSale}
            />
          </div>
        </div>

        {/* pack chart list */}
        <div className="mt-6 mb-2 flex items-center space-x-2">
          <Heading level="h3" className="flex-1">
            Pack Chart
          </Heading>
          <Button size="small" variant="secondary" onClick={addRow}>
            + Add Pack Slot
          </Button>
        </div>

        {packRows.length > 0 && (
          <div className="flex space-x-2 mb-2">
            <div className="flex-1 font-medium">Size</div>
            <div className="flex-1 font-medium">Ratio</div>
            <div className="w-20" />
          </div>
        )}

        {packRows.map((row, i) => (
          <div key={i} className="flex space-x-2 items-end mb-3">
            <Input
              className="flex-1"
              placeholder={`Size ${i + 1}`}
              value={row.size}
              onChange={(e) => updateRow(i, { ...row, size: e.target.value })}
            />
            <Input
              className="flex-1"
              type="number"
              placeholder={`Ratio ${i + 1}`}
              value={row.ratio}
              onChange={(e) =>
                updateRow(i, { ...row, ratio: Number(e.target.value) })
              }
            />
            <Button
              size="small"
              variant="secondary"
              onClick={() => removeRow(i)}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button onClick={onSave} variant="primary">
          Save - Unit Price & Pack‑Sale
        </Button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({ zone: 'product.details.after' });
export default PackSaleSettings;
