import React, { useState, useEffect } from 'react';
import {
  defineWidgetConfig,
  useAdminProduct,
  useUpdateProduct,
} from '@medusajs/admin-sdk';

const ProductPackWidget = () => {
  const { product } = useAdminProduct();
  const updateProduct = useUpdateProduct(product.id);

  const [isPack, setIsPack] = useState(false);
  const [unitPrice, setUnitPrice] = useState('');
  const [packChart, setPackChart] = useState<number[]>([]);
  const [sizeChart, setSizeChart] = useState<string[]>([]);

  // initialize from existing metadata
  useEffect(() => {
    if (!product) return;
    const m = product.metadata || {};
    setIsPack(!!m.is_pack_sale);
    setUnitPrice(m.unit_master_price?.toString() ?? '');
    setPackChart(m.pack_chart ?? []);
    setSizeChart(m.size_chart ?? []);
  }, [product]);

  const handleSave = async () => {
    if (packChart.length !== sizeChart.length) {
      return alert('Pack chart length must match size chart length');
    }
    await updateProduct.mutateAsync({
      metadata: {
        ...product.metadata,
        is_pack_sale: isPack,
        unit_master_price: Number(unitPrice),
        pack_chart: packChart,
        size_chart: sizeChart,
      },
    });
    alert('Pack/Size settings saved!');
  };

  return (
    <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <h3>Pack / Unpack Sale Settings</h3>

      <label>
        Pack Sale?
        <input
          type="checkbox"
          checked={isPack}
          onChange={(e) => setIsPack(e.target.checked)}
        />
      </label>

      <label>
        Unit Master Price
        <input
          type="number"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
        />
      </label>

      <label>
        Pack Chart (comma-sep ratios)
        <input
          type="text"
          value={packChart.join(',')}
          onChange={(e) =>
            setPackChart(e.target.value.split(',').map((n) => Number(n)))
          }
        />
      </label>

      <label>
        Size Chart (comma-sep labels)
        <input
          type="text"
          value={sizeChart.join(',')}
          onChange={(e) => setSizeChart(e.target.value.split(','))}
        />
      </label>

      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: 'product.details.after',
});

export default ProductPackWidget;
