// storefront/src/lib/data/cc.ts
"use server"
// import { getAuthHeaders } from "./cookies"
import { sdk } from "@/lib/config" // your pre‑configured Medusa SDK
import { encrypt } from "@/lib/util/crypto" // Node crypto (runs on server)

export interface SaveCcPayload {
  cartId: string
  cardholder: string
  card_number: string
  expiry_month: number
  expiry_year: number
  cvc: string
}

/**
 * Encrypts sensitive fields, then PATCHes /store/carts/:id
 * so the cart stays open and checkout can continue.
 */
export async function saveCc({
  cartId,
  cardholder,
  card_number,
  expiry_month,
  expiry_year,
  cvc,
}: SaveCcPayload) {
  // 1. Build encrypted metadata
  const metadata = {
    cardholder,
    enc_number: encrypt(card_number),
    enc_cvc: encrypt(cvc),
    last4digit: card_number.slice(-4),
    expiry_month,
    expiry_year,
  }

  // 2. Forward customer auth headers so Store API authorises the write
  // (Next "use server" action gets the cookies automatically)
  const headers: Record<string, any> = {}
  if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  }

  // 3. PATCH the cart using the Medusa Store SDK
  const { cart } = await sdk.store.cart.update(
    cartId,
    { metadata },
    {}, // query params
    headers // extra headers
  )

  return cart // caller can re‑fetch or inspect as needed
}

// /** Uses NEXT_PUBLIC_MEDUSA_BACKEND_URL for absolute path. */
// export async function saveCc(payload: SaveCcPayload) {
//   const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
//   const path = `${base}/store/customers/${payload.customer_id}/cart/save-cc`
//   const headers = {
//     "Content-Type": "application/json",
//     "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
//     ...(await getAuthHeaders()),
//   }

//   console.log("### header:", headers)

//   const res = await fetch(path, {
//     method: "POST",
//     headers: headers,
//     body: JSON.stringify(payload),
//   })

//   if (!res.ok) {
//     const err = await res.json()
//     throw new Error(err.error || "Failed to save card")
//   }
//   return res.json() // { saved:true, cart_id, last4 }
// }
