
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
        const cats = (p?.categories ?? [])
            .filter((c: any) => {
                if (!category_id) return true
                const segs = String(c?.mpath ?? "").split(".")
                return segs.includes(category_id)
            })
            .filter((c: any) => Number.isFinite(Number(c?.metadata?.order)))

        if (!cats.length) return Infinity

        let deepest = cats[0]
        let bestDepth = String(deepest?.mpath ?? "").split(".").length

        for (const c of cats) {
            const depth = String(c?.mpath ?? "").split(".").length
            if (depth > bestDepth) {
                bestDepth = depth
                deepest = c
            }
        }

        return Number(deepest?.metadata?.order ?? Infinity)
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