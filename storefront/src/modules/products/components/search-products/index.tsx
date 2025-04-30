// File: modules/products/components/search-products/index.tsx
"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MagnifyingGlassMini } from "@medusajs/icons"

/**
 * SearchProducts component: renders a search input in the navbar.
 * On submit, navigates to the /{countryCode}/store page with a search query parameter.
 */
export default function SearchProducts() {
  // 1️⃣ Read the current pathname
  const pathname = usePathname() // :contentReference[oaicite:0]{index=0}
  // e.g. "/"                   → ["", ""]
  //      "/us/store"           → ["", "us", "store"]
  //      "/de/categories/phones"→ ["", "de", "categories", "phones"]

  // 2️⃣ Extract the country code (or fallback to default)
  const segments = pathname.split("/")
  const countryCode = segments[1] || "us"

  const [searchTerm, setSearchTerm] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // If the input is cleared, reload store page without the search param
  useEffect(() => {
    if (searchTerm === "") {
      startTransition(() => {
        router.push(`/${countryCode}/store`)
      })
    }
  }, [searchTerm, router, countryCode])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    startTransition(() => {
      if (trimmed) {
        router.push(
          `/${countryCode}/store?searchBy=${encodeURIComponent(trimmed)}`
        )
      } else {
        router.push(`/${countryCode}/store`)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex-1 mx-6 max-w-lg hidden small:flex"
    >
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for products"
        className="w-full border rounded-full px-4 py-2 pr-10 focus:outline-none"
        aria-label="Search for products"
      />
      <button
        type="submit"
        disabled={isPending}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <MagnifyingGlassMini className="w-4 h-4 text-neutral-500" />
      </button>
    </form>
  )
}
