import { ModuleProvider, Modules } from '@medusajs/framework/utils';
import type {
  CartDTO,
  PaymentSessionDTO,
  PaymentSessionStatus,
} from '@medusajs/types';
import { encrypt, decrypt } from '../../lib/util/crypto';

class ManualCreditCardProvider {
  static identifier = 'manual-credit-card';

  // 1️⃣ Called when user selects this method
  async initiatePayment({ cart }: { cart: CartDTO }) {
    return {
      session_data: {},
      payment_data: { status: 'pending' },
    };
  }

  // 2️⃣ Called when front-end POSTs CC info
  async updatePaymentSession(
    _: { cart: CartDTO; session: PaymentSessionDTO },
    {
      data,
    }: {
      data: {
        cardholder: string;
        card_number: string;
        expiry_month: number;
        expiry_year: number;
        cvc: string;
      };
    }
  ) {
    const encNumber = encrypt(data.card_number);
    const encCvc = encrypt(data.cvc);
    const last4 = data.card_number.slice(-4);

    return {
      session_data: {
        cardholder: data.cardholder,
        enc_number: encNumber,
        enc_cvc: encCvc,
        expiry_month: data.expiry_month,
        expiry_year: data.expiry_year,
        last4digit: last4,
      },
    };
  }

  // 3️⃣ Used by Admin to show saved CC
  async getPaymentData(session: PaymentSessionDTO) {
    const d = session.data!;
    return {
      cardholder: d.cardholder,
      last4digit: d.last4digit,
      expiry_month: d.expiry_month,
      expiry_year: d.expiry_year,
      // 🔓 if you really want full PAN, decrypt here:
      full_number: decrypt(d.enc_number as string),
    };
  }

  // 4️⃣ No‐ops for manual
  async authorizePayment() {
    return { authorized: true };
  }
  async capturePayment() {
    return { captured: true };
  }
  async cancelPayment() {
    return {};
  }
  async deletePayment() {
    return {};
  }
  async getPaymentStatus(): Promise<PaymentSessionStatus> {
    return 'pending';
  }
}

export default ModuleProvider(Modules.PAYMENT, {
  services: [ManualCreditCardProvider],
});

// And expose an admin widget for the Order page:
export const widgetModule = {
  getWidgets: () => [{}],
};
