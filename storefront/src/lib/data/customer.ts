"use server"

import { sdk } from "@/lib/config"
import medusaError from "@/lib/util/medusa-error"
import { B2BCart, B2BCustomer } from "@/types/global"
import { CartDTO, HttpTypes } from "@medusajs/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { retrieveCart, updateCart } from "./cart"
import { createCompany, createEmployee } from "./companies"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
  setCartId,
} from "./cookies"

export const retrieveCustomerCart = async (
  bearerToken: string
): Promise<any> => {
  // console.log("### bearerToken", bearerToken)
  // 1️⃣  Auth check
  const authHeaders = await getAuthHeaders()
  if (!authHeaders) {
    return null
  }

  // 2️⃣  Fetch the customer record
  let customer: B2BCustomer
  try {
    const next = await getCacheOptions("customers")
    const { customer: fetched } = await sdk.client.fetch<{
      customer: B2BCustomer
    }>(`/store/customers/me`, {
      method: "GET",
      query: { fields: "*employee,*orders" },
      headers: authHeaders,
      next,
      cache: "force-cache",
    })
    customer = fetched
  } catch {
    return null
  }

  // 3️⃣  Fetch the customer’s cart array
  let cart: B2BCart = {} as any
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/${customer.id}/cart`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          Authorization: `Bearer ${bearerToken}`, // use passed-in token
        },
      }
    )

    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.message || `HTTP ${res.status}`)
    }
    cart = json.cart ?? ({} as B2BCart)
    console.log("### fetchCustomerCart_cart", cart)
  } catch {
    // no carts or fetch error → leave carts=[]
  }

  return { customer, customer_cart: cart }
}

export const retrieveCustomer = async (): Promise<B2BCustomer | null> => {
  // 1️⃣  Auth check
  const authHeaders = await getAuthHeaders()
  if (!authHeaders) {
    return null
  }

  // 2️⃣  Fetch the customer record
  let customer: B2BCustomer
  try {
    const next = await getCacheOptions("customers")
    const { customer: fetched } = await sdk.client.fetch<{
      customer: B2BCustomer
    }>(`/store/customers/me`, {
      method: "GET",
      query: { fields: "*employee,*orders" },
      headers: authHeaders,
      next,
      cache: "force-cache",
    })
    customer = fetched
  } catch {
    return null
  }

  return customer
}

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
    company_name: formData.get("company_name") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const customHeaders = { authorization: `Bearer ${token}` }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      customHeaders
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    setAuthToken(loginToken as string)

    const companyForm = {
      name: formData.get("company_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("company_phone") as string,
      address: formData.get("company_address") as string,
      city: formData.get("company_city") as string,
      state: formData.get("company_state") as string,
      zip: formData.get("company_zip") as string,
      country: formData.get("company_country") as string,
      currency_code: formData.get("currency_code") as string,
    }

    const createdCompany = await createCompany(companyForm)

    const createdEmployee = await createEmployee({
      company_id: createdCompany?.id as string,
      customer_id: createdCustomer.id,
      is_admin: true,
      spending_limit: 0,
    }).catch((err) => {
      console.log("error creating employee", err)
    })

    const cacheTag = await getCacheTag("customers")
    revalidateTag(cacheTag)

    await transferCart()

    return {
      customer: createdCustomer,
      company: createdCompany,
      employee: createdEmployee,
    }
  } catch (error: any) {
    console.log("error", error)
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        track("customer_logged_in")
        setAuthToken(token as string)

        const [customerCacheTag, productsCacheTag, cartsCacheTag] =
          await Promise.all([
            getCacheTag("customers"),
            getCacheTag("products"),
            getCacheTag("carts"),
          ])

        revalidateTag(customerCacheTag)

        const { customer, customer_cart } = (await retrieveCustomerCart(
          token as string
        )) as any
        console.log("### customer_cart", await customer_cart)
        setCartId(await customer_cart?.id)
        console.log("### login-customer.cart", await customer_cart)
        const cart = (await retrieveCart(customer_cart?.id)) as any

        if (customer?.employee?.company_id) {
          await updateCart({
            metadata: {
              ...cart?.metadata,
              company_id: customer.employee.company_id,
            },
          })
        }

        revalidateTag(productsCacheTag)
        revalidateTag(cartsCacheTag)
      })
  } catch (error: any) {
    return error.toString()
  }

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

export async function signout(countryCode: string, customerId: string) {
  await sdk.auth.logout()
  removeAuthToken()
  track("customer_logged_out")

  // remove next line if want the cart to persist after logout
  await removeCartId()

  const [authCacheTag, customerCacheTag, productsCacheTag, cartsCacheTag] =
    await Promise.all([
      getCacheTag("auth"),
      getCacheTag("customers"),
      getCacheTag("products"),
      getCacheTag("carts"),
    ])

  revalidateTag(authCacheTag)
  revalidateTag(customerCacheTag)
  revalidateTag(productsCacheTag)
  revalidateTag(cartsCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")

  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

// // // // File: storefront/src/lib/data/customerCart.ts

// // // /**
// // //  * Fetches the active cart for a given customer from the Medusa Store API.
// // //  *
// // //  * @param customerId - The ID of the customer whose active cart you want to retrieve.
// // //  * @returns The current cart object.
// // //  */
// // // export async function fetchCustomerCart(
// // //   customerId: string,
// // //   bearerToken: string
// // // ): Promise<B2BCart> {
// // //   console.log("fetchCustomerCart_customerId", customerId)

// // //   const res = await fetch(
// // //     `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/${customerId}/cart`,
// // //     {
// // //       method: "GET",
// // //       headers: {
// // //         "Content-Type": "application/json",
// // //         "x-publishable-api-key":
// // //           process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
// // //         Authorization: `Bearer ${bearerToken}`, // use passed-in token
// // //       },
// // //     }
// // //   )

// // //   const json = await res.json()
// // //   if (!res.ok) {
// // //     throw new Error(json.message || `HTTP ${res.status}`)
// // //   }

// // //   console.log("fetchCustomerCart_cart", (json.cart ?? {}) as B2BCart)
// // //   // **Pull out the array** and return it
// // //   return json.cart as B2BCart
// // // }
