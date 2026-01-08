
import type { HttpTypes } from "@medusajs/types"

type SortOptions = "price" | "-price" | "category"
interface MinPricedProduct extends HttpTypes.StoreProduct {
    _minPrice?: number
}


export const normalizeRecord = (input: any): Record<string, string | string[]> => {
    if (!input || typeof input !== "object") return {}
    const out: Record<string, string | string[]> = {}

    for (const [k, v] of Object.entries(input)) {
        if (!k) continue
        if (Array.isArray(v)) {
            const arr = v.map(String).map((s) => s.trim()).filter(Boolean)
            if (arr.length) out[k] = arr
        } else if (typeof v === "string") {
            const s = v.trim()
            if (s) out[k] = s
        }
    }
    return out
}

export const toNumberOrUndefined = (v: any): number | undefined => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN
    return Number.isFinite(n) ? n : undefined
}

export const asArray = (v: any): string[] => {
    if (v == null) return []
    if (Array.isArray(v)) return v.map(String).filter(Boolean)
    if (typeof v === "string") {
        if (v.includes(",")) return v.split(",").map((s) => s.trim()).filter(Boolean)
        return [v]
    }
    return [String(v)]
}

export const inClause = (values: string[], binds: any[]) => {
    binds.push(...values)
    return `(${values.map(() => "?").join(", ")})`
}

export const sortedProducts = (
    products: HttpTypes.StoreProduct[],
    sortBy: SortOptions,
    category_id?: string
): HttpTypes.StoreProduct[] => {
    const sorted = products as MinPricedProduct[]

    const getCatOrder = (p: any) => {
        const orders = (p.categories ?? [])
            .filter((c: any) => (category_id ? c?.mpath?.includes(category_id) : true))
            .map((c: any) => Number(c?.metadata?.order))
            .filter(Number.isFinite)

        return orders.length ? Math.min(...orders) : Infinity
    }

    if (sortBy === "category") {
        sorted.sort((a, b) => getCatOrder(a) - getCatOrder(b))
    }

    if (sortBy === "price" || sortBy === "-price") {
        for (const product of sorted) {
            product._minPrice = product.variants?.length
                ? Math.min(...product.variants.map(v => v?.calculated_price?.calculated_amount ?? 0))
                : Infinity
        }

        sorted.sort((a, b) => {
            const diff = (a._minPrice ?? Infinity) - (b._minPrice ?? Infinity)
            return sortBy === "price" ? diff : -diff
        })
    }

    return sorted
}


export const filterByPrice = (products: HttpTypes.StoreProduct[], priceMin: number = 0, priceMax: number = 0): HttpTypes.StoreProduct[] => {
    return products.filter((p: any) => {
        const amounts: number[] = (p.variants ?? [])
            .map((v: any) => v?.calculated_price?.calculated_amount)
            .filter((n: any) => typeof n === "number")

        if (!amounts.length) return false

        const min = Math.min(...amounts)

        if (priceMin !== undefined && min < priceMin) return false
        if (priceMax !== undefined && min > priceMax) return false

        return true
    })
}

export const getOrderKey = (order: any) => {
    if (!order) return ""
    if (typeof order === "string") return order
    if (typeof order === "object") {
        const [key, dir] = Object.entries(order)[0] ?? []
        if (!key) return ""
        const d = String(dir).toUpperCase()
        return d === "DESC" ? `-${key}` : key
    }

    return ""
}