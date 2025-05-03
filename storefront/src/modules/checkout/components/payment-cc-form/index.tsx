// src/modules/checkout/components/ManualCcForm.tsx
"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { saveCc } from "@/lib/data/cc"
import { useCart } from "@/lib/context/cart-context"
import Button from "@/modules/common/components/button"
import { digitsOnly, fourSplit } from "@/lib/util/format-card"

interface Meta {
  cardholder: string
  last4digit: string
  expiry_month: number
  expiry_year: number
}

interface Props {
  cartId: string
  initialMeta: Meta | null
  /** bubble error → Payment */
  setError: (msg: string | null) => void
  /** tell parent the form is complete/enabled */
  setCardComplete: (ready: boolean) => void
  error: string | null
}

const PaymentCcForm = ({
  cartId,
  initialMeta,
  setError,
  setCardComplete,
  error,
}: Props) => {
  const router = useRouter()
  // /* if meta exists, pre‑fill, else empty */
  // const [form, setForm] = useState({
  //   cardholder: initialMeta?.cardholder ?? "",
  //   card_number: "", // raw digits (13–19)
  // card_display: "",      // formatted "#### #### …"
  //   expiry_month: initialMeta?.expiry_month?.toString() ?? "",
  //   expiry_year: initialMeta?.expiry_year?.toString() ?? "",
  //   cvc: "",
  // })
  /* sample */
  const [form, setForm] = useState({
    cardholder: "test park",
    card_number: "4242424242424242",
    card_display: "#### #### #### ####",
    expiry_month: "10",
    expiry_year: "2025",
    cvc: "111",
  })

  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(!!initialMeta) // ← new flag
  const [saved, setSaved] = useState(!!initialMeta)

  /* recompute completeness */
  useEffect(() => {
    const ready =
      saved || // already saved?
      (!!form.cardholder &&
        /^\d{13,16}$/.test(form.card_number) &&
        /^\d{2}$/.test(form.expiry_month) &&
        /^\d{4}$/.test(form.expiry_year) &&
        /^\d{3,4}$/.test(form.cvc))
    setCardComplete(ready)
  }, [form, saved, setCardComplete])

  /* any manual edit means card needs saving again */
  /* onChange */
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "card_number" || name === "card_display") {
      const raw = digitsOnly(value)
      const disp = fourSplit(raw)
      setForm((f) => ({ ...f, card_number: raw, card_display: disp }))
      setLocked(false)
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
    setSaved(false) // card must be re‑saved
  }
  /* onSubmit unchanged except for setLocked(true) after save */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await saveCc({
        cartId: cartId,
        ...form,
        expiry_month: Number(form.expiry_month),
        expiry_year: Number(form.expiry_year),
      })
      // success – parent will let checkout continue
      setSaved(true)
      setLocked(true)
      /* clear PAN & CVC after save */
      setForm((f) => ({ ...f, card_number: "", cvc: "" }))
    } catch (err: any) {
      setError(err.message || "Failed to save card")
    } finally {
      setSaving(false)
    }
  }

  /* helper to show masked number if already saved */
  /* helper for masked view */
  const masked = `•••• ${initialMeta?.last4digit ?? form.card_number.slice(-4)}`
  console.log("masked", masked)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="cardholder"
          className="block text-sm font-medium text-gray-700"
        >
          Cardholder Name
        </label>
        <input
          id="cardholder"
          name="cardholder"
          type="text"
          required
          placeholder="John Doe"
          className="mt-1 block w-full p-2 border rounded-md"
          value={form.cardholder}
          onChange={onChange}
        />
      </div>
      <div>
        <label
          htmlFor="card_number"
          className="block text-sm font-medium text-gray-700"
        >
          Card Number
        </label>
        {/* Card‑number field */}
        {locked ? (
          /* ----- read‑only masked display ----- */
          <div className="relative">
            <input
              type="text"
              value={masked} // "•••• 1111"
              disabled
              className="mt-1 block w-full p-2 border rounded-md text-gray-500"
            />
            {/* Edit link – top‑right inside the input */}
            <button
              type="button"
              onClick={() => setLocked(false)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>
        ) : (
          /* ----- editable numeric field ----- */
          <input
            id="card_number"
            name="card_number"
            type="tel"
            inputMode="numeric"
            /* accept digits or spaces, min 13 digits, max 19 digits + 3 spaces */
            maxLength={23} // 16 digits + 3 spaces
            placeholder="1234 5678 9012 3456"
            required
            className="mt-1 block w-full p-2 border rounded-md"
            value={form.card_display}
            onChange={onChange}
          />
        )}
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="expiry_month"
            className="block text-sm font-medium text-gray-700"
          >
            Expiry Month
          </label>
          <input
            id="expiry_month"
            name="expiry_month"
            type="text"
            pattern="\d{2}"
            required
            placeholder="MM"
            className="mt-1 block w-full p-2 border rounded-md"
            value={form.expiry_month}
            onChange={onChange}
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="expiry_year"
            className="block text-sm font-medium text-gray-700"
          >
            Expiry Year
          </label>
          <input
            id="expiry_year"
            name="expiry_year"
            type="text"
            pattern="\d{4}"
            required
            placeholder="YYYY"
            className="mt-1 block w-full p-2 border rounded-md"
            value={form.expiry_year}
            onChange={onChange}
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="cvc"
            className="block text-sm font-medium text-gray-700"
          >
            CVC
          </label>
          {/* CVC field */}
          {saved ? (
            /* masked display */
            <input
              type="password" // shows ••• automatically
              value="123" // any 3–4 chars → renders •••
              disabled
              className="mt-1 block w-full p-2 border rounded-md text-gray-500"
              onDoubleClick={() => {
                setSaved(false) // unlock editing
                setForm((f) => ({ ...f, cvc: "" }))
              }}
            />
          ) : (
            /* editable field */
            <input
              id="cvc"
              name="cvc"
              type="tel"
              pattern="\d{3,4}"
              required={!saved}
              disabled={saved}
              placeholder="CVC"
              className="mt-1 block w-full p-2 border rounded-md"
              value={form.cvc}
              onChange={onChange}
            />
          )}
        </div>
      </div>
      {/* messages */}
      {error && <p className="text-red-500">{error}</p>}
      {saved && !error && (
        <p className="text-green-600">
          Card ending in {masked.slice(-4)} saved
        </p>
      )}
      {/* show button only when card needs saving */}
      {!saved && (
        <Button
          type="submit"
          isLoading={saving}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Card
        </Button>
      )}
    </form>
  )
}

export default PaymentCcForm
