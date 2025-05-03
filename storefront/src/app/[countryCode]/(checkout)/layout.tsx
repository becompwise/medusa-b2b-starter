// src/app/[countryCode]/checkout/layout.tsx
"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { B2BCart } from "@/types/global"
import { getOrSetCart } from "@/lib/data/cart"
import { CartProvider } from "@/lib/context/cart-context"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import LogoIcon from "@/modules/common/icons/logo"
import MedusaCTA from "@/modules/layout/components/medusa-cta"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { countryCode } = useParams()
  const [cart, setCart] = useState<B2BCart | null>(null)

  // Fetch (or create) the active cart once we know the locale
  useEffect(() => {
    if (countryCode) {
      getOrSetCart(countryCode as string).then(setCart)
    }
  }, [countryCode])

  // You can optionally render a spinner while the cart loads
  if (!cart) return <div className="p-10 text-center">Loading cart…</div>

  return (
    <CartProvider cart={cart}>
      {/* header */}
      <div className="mb-2 w-full bg-white relative small:min-h-screen">
        <div className="h-16 bg-white">
          <nav className="flex h-full items-center content-container justify-between">
            <LocalizedClientLink className="hover:text-ui-fg-base" href="/">
              <h1 className="text-base font-medium flex items-center">
                <LogoIcon className="inline mr-2" />
                HOME
              </h1>
            </LocalizedClientLink>
          </nav>
        </div>
        {/* checkout steps */}
        <div
          className="relative bg-neutral-100"
          data-testid="checkout-container"
        >
          {children}
        </div>
        {/* footer */}
        <div className="py-4 w-full flex items-center justify-center">
          <MedusaCTA />
        </div>
      </div>
    </CartProvider>
  )
}
