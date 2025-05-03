// src/modules/checkout/components/ManualCcForm.tsx
"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { saveCc } from "@/lib/data/cc"
import { useCart } from "@/lib/context/cart-context"
import Button from "@/modules/common/components/button"

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
  //   card_number: "", // never show full PAN
  //   expiry_month: initialMeta?.expiry_month?.toString() ?? "",
  //   expiry_year: initialMeta?.expiry_year?.toString() ?? "",
  //   cvc: "",
  // })
  /* sample */
  const [form, setForm] = useState({
    cardholder: "test park",
    card_number: "4242424242424242",
    expiry_month: "10",
    expiry_year: "2025",
    cvc: "111",
  })

  const [saving, setSaving] = useState(false)
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
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false)
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

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
      /* clear PAN & CVC after save */
      setForm((f) => ({ ...f, card_number: "", cvc: "" }))
    } catch (err: any) {
      setError(err.message || "Failed to save card")
    } finally {
      setSaving(false)
    }
  }

  /* helper to show masked number if already saved */
  const maskedNumber = initialMeta
    ? `•••• ${initialMeta.last4digit}`
    : form.card_number

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
        {/* <input
          id="card_number"
          name="card_number"
          type="tel"
          inputMode="numeric"
          pattern="\d{13,16}"
          required={!saved}
          disabled={saved}
          placeholder="1234 5678 9012 3456"
          className="mt-1 block w-full p-2 border rounded-md"
          value={maskedNumber}
          onChange={onChange}
        /> */}
        {/* Card‑number field */}
        {saved ? (
          /* ----- read‑only masked display ----- */
          <input
            type="text"
            value={`•••• ${initialMeta!.last4digit}`}
            disabled // no validation fires
            className="mt-1 block w-full p-2 border rounded-md"
            onDoubleClick={() => {
              // double‑click to edit
              setSaved(false) // switch to editable mode
              setForm((f) => ({ ...f, card_number: "" }))
            }}
          />
        ) : (
          /* ----- editable numeric field ----- */
          <input
            name="card_number"
            placeholder="Card #"
            value={form.card_number}
            onChange={onChange}
            required
            pattern="\d{13,16}"
            className="mt-1 block w-full p-2 border rounded-md"
            autoFocus // focus after unlocking
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
        </div>
      </div>
      {/* messages */}
      {error && <p className="text-red-500">{error}</p>}
      {saved && !error && (
        <p className="text-green-600">
          Card ending in {initialMeta?.last4digit || form.card_number.slice(-4)}{" "}
          saved
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
