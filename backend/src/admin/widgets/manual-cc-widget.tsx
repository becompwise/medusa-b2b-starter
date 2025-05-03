import React, { useEffect, useState } from 'react';
import { defineWidgetConfig } from '@medusajs/admin-sdk';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type CcData = {
  cardholder: string;
  pan: string;
  cvc: string;
  expiry_month: number;
  expiry_year: number;
};
/* ------------------------------------------------------------------ */
/*  Helper: read order‑ID from current URL                            */
/*  URLs are /a/orders/<id> or /orders/<id> in Medusa Admin           */
/* ------------------------------------------------------------------ */
function getOrderIdFromPath() {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(/\/orders\/([^/]+)/);
  return m ? m[1] : null;
}

const PASSWORD = '1234567890';

/* ------------------------------------------------------------------ */
/*  Widget component                                                  */
/* ------------------------------------------------------------------ */
const ManualCcWidget: React.FC = () => {
  const orderId = getOrderIdFromPath();
  const [cc, setCc] = useState<CcData | null>(null);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/admin/orders/${orderId}/manual-cc`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setCc)
      .catch(() => null);
  }, [orderId]);

  if (!cc) return null; /* Hide while loading or when no data */

  /* masked / un‑masked strings */
  const maskedPan = `•••• ${cc.pan.slice(-4)}`;
  const maskedCvc = '•••';

  /* handle toggle click */
  const handleToggle = () => {
    if (showFull) {
      setShowFull(false);
      return;
    }

    const input = window.prompt('Enter password to view card details');
    if (input === PASSWORD) {
      setShowFull(true);
    } else if (input !== null) {
      // optional simple alert; replace with toast ui if desired
      window.alert('Incorrect password');
    }
  };

  /* inside ManualCcWidget – replace the previous return */
  return (
    <div className="bg-white border border-gray-200 rounded-rounded p-base mb-base">
      {/* header row */}
      <div className="flex items-center justify-between">
        <h3 className="p-5 text-base-semi">Credit Card</h3>
        <button
          type="button"
          onClick={handleToggle}
          className="pr-5 text-ui-fg-interactive text-xs hover:underline"
        >
          {showFull ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* divider identical to other sections */}
      <div className="w-full h-px bg-gray-200 my-base" />

      {/* definition list – two‑column layout */}
      <dl className="p-5 grid grid-cols-[120px_1fr] gap-y-3 text-s">
        <dt className="text-ui-fg-subtle">Cardholder</dt>
        <dd>{cc.cardholder}</dd>

        <dt className="text-ui-fg-subtle">Number</dt>
        <dd className="font-mono tracking-wider">
          {showFull ? cc.pan : maskedPan}
        </dd>

        <dt className="text-ui-fg-subtle">CVC</dt>
        <dd className="font-mono">{showFull ? cc.cvc : maskedCvc}</dd>

        <dt className="text-ui-fg-subtle">Expires</dt>
        <dd>
          {cc.expiry_month}/{cc.expiry_year}
        </dd>
      </dl>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Widget configuration – works in sdk v2.5                          */
/* ------------------------------------------------------------------ */
export const config = defineWidgetConfig({
  zone: 'order.details.after', // injects below the summary on Order page
});

export default ManualCcWidget;
