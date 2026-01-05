import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, isPresent } from "@medusajs/framework/utils"
import { STORE_PRODUCT_CUSTOM_LIST_SERVICE } from "../../../../modules/product-custom-list"
import { normalizeRecord, toNumberOrUndefined } from "../../../../modules/product-custom-list/helpers"


export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const metadata = normalizeRecord((req.query as any).metadata)
    const optionByTitle = normalizeRecord((req.query as any).option)

    const priceMin = toNumberOrUndefined((req.query as any).price_min)
    const priceMax = toNumberOrUndefined((req.query as any).price_max)

    const filters: Record<string, any> = {
        ...(req as any).filterableFields,
        status: "published",
    }

    if (filters.category_id) {
        const ids = Array.isArray(filters.category_id)
            ? filters.category_id
            : [filters.category_id]

        filters.categories = { id: ids }
        delete filters.category_id
    }

    if (filters.tag_id) {
        const ids = Array.isArray(filters.tag_id)
            ? filters.tag_id
            : [filters.tag_id]

        filters.tags = { id: ids }
        delete filters.tag_id
    }

    if (filters.collection_id) {
        filters.collection_id = Array.isArray(filters.collection_id)
            ? filters.collection_id
            : [filters.collection_id]
    }

    if (filters.type_id) {
        filters.type_id = Array.isArray(filters.type_id)
            ? filters.type_id
            : [filters.type_id]
    }

    if (Object.keys(metadata).length) {
        filters.metadata = metadata
    }
    if (Object.keys(optionByTitle).length) {
        const svc = req.scope.resolve(STORE_PRODUCT_CUSTOM_LIST_SERVICE) as any
        const optionFilters = await svc.mapOptionTitlesToOptionIdValue(optionByTitle)

        if (optionFilters.length) {
            filters.variants ??= {}
            filters.variants.$and = optionFilters.map((f: any) => ({
                options: { option_id: f.option_id, value: f.value },
            }))
        }
    }

    const context: Record<string, any> = {}
    if (isPresent((req as any).pricingContext)) {
        context["variants"] ??= {}
        context["variants"]["calculated_price"] = (req as any).pricingContext
    }

    const { data: products = [], metadata: meta } = await query.graph(
        {
            entity: "product",
            fields: (req as any).queryConfig?.fields ?? [
                "id",
                "title",
                "handle",
                "thumbnail",
                "variants.*",
                "variants.calculated_price.*",
            ],
            filters,
            pagination: (req as any).queryConfig?.pagination ?? {
                take: Number((req.query as any).limit ?? 50),
                skip: Number((req.query as any).offset ?? 0),
            },
            context,
        }
    )

    let filtered = products
    if (priceMin !== undefined || priceMax !== undefined) {
        filtered = products.filter((p: any) => {
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

    res.json({
        products: filtered,
        count: (priceMin !== undefined || priceMax !== undefined) ? filtered.length : meta?.count ?? filtered.length,
        offset: meta?.skip ?? 0,
        limit: meta?.take ?? filtered.length,
    })
}
