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
