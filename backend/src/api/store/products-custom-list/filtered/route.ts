import { MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, QueryContextType } from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    FeatureFlag,
    isPresent,
    QueryContext,
    remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { RequestWithContext, wrapProductsWithTaxPrices } from "@medusajs/medusa/api/store/products/helpers"
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "@medusajs/medusa/api/utils/middlewares/index"
import { normalizeRecord, toNumberOrUndefined } from "../../../../modules/product-custom-list/helpers"
import { STORE_PRODUCT_CUSTOM_LIST_SERVICE } from "../../../../modules/product-custom-list"
import { IndexEngineFeatureFlag } from "../../../../modules/product-custom-list/utils/types"

export const GET = async (
    req: RequestWithContext<HttpTypes.StoreProductListParams>,
    res: MedusaResponse<HttpTypes.StoreProductListResponse>
) => {
    if (FeatureFlag.isFeatureEnabled(IndexEngineFeatureFlag.key)) {
        if (
            isPresent(req.filterableFields.tags) ||
            isPresent(req.filterableFields.categories)
        ) {
            return await getProducts(req, res)
        }
        return await getProductsWithIndexEngine(req, res)
    }
    return await getProducts(req, res)
}

async function getProductsWithIndexEngine(
    req: RequestWithContext<HttpTypes.StoreProductListParams>,
    res: MedusaResponse<HttpTypes.StoreProductListResponse>
) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const context: QueryContextType = {}
    const withInventoryQuantity = req.queryConfig.fields.some((field) =>
        field.includes("variants.inventory_quantity")
    )

    if (withInventoryQuantity) {
        req.queryConfig.fields = req.queryConfig.fields.filter(
            (field) => !field.includes("variants.inventory_quantity")
        )
    }

    if (isPresent(req.pricingContext)) {
        context["variants"] ??= {}
        context["variants"]["calculated_price"] = QueryContext(req.pricingContext!)
    }

    const filters: Record<string, any> = req.filterableFields
    if (isPresent(filters.sales_channel_id)) {
        const salesChannelIds = filters.sales_channel_id

        filters["sales_channels"] ??= {}
        filters["sales_channels"]["id"] = salesChannelIds

        delete filters.sales_channel_id
    }


    const { data: products = [], metadata: meta } = await query.index({
        entity: "product",
        fields: req.queryConfig.fields,
        filters,
        pagination: req.queryConfig.pagination,
        context,
    })

    if (withInventoryQuantity) {
        await wrapVariantsWithInventoryQuantityForSalesChannel(
            req,
            products.map((product) => product.variants).flat(1)
        )
    }

    await wrapProductsWithTaxPrices(req, products)
    res.json({
        products,
        count: meta!.estimate_count,
        estimate_count: meta!.estimate_count,
        offset: meta!.skip,
        limit: meta!.take,
    })
}

async function getProducts(
    req: RequestWithContext<HttpTypes.StoreProductListParams>,
    res: MedusaResponse<HttpTypes.StoreProductListResponse>
) {

    const filters: Record<string, any> = {
        ...(req as any).filterableFields
    }

    const metadata = normalizeRecord((req.query as any).metadata)
    const optionByTitle = normalizeRecord((req.query as any).option)

    const priceMin = toNumberOrUndefined((req.query as any).price_min)
    const priceMax = toNumberOrUndefined((req.query as any).price_max)

    if (priceMin !== undefined || priceMax !== undefined) {
        delete filters.price_min;
        delete filters.price_max;
    }

    if (Object.keys(optionByTitle).length) {
        delete filters.option;
    }

    const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
    const context: object = {}
    const withInventoryQuantity = req.queryConfig.fields.some((field) =>
        field.includes("variants.inventory_quantity")
    )

    if (withInventoryQuantity) {
        req.queryConfig.fields = req.queryConfig.fields.filter(
            (field) => !field.includes("variants.inventory_quantity")
        )
    }

    // add metadata to filter
    if (Object.keys(metadata).length) {
        filters.metadata = metadata
    }

    if (Object.keys(optionByTitle).length) {
        const svc = req.scope.resolve(STORE_PRODUCT_CUSTOM_LIST_SERVICE) as any
        const optionFilters = await svc.mapOptionTitlesToOptionIdValue(optionByTitle)

        const uniq = Array.from(
            new Map(optionFilters.map((f: any) => [`${f.option_id}:${f.value}`, f])).values()
        )

        filters.$or = uniq.map((f: any) => ({
            variants: {
                options: {
                    option_id: f.option_id,
                    value: f.value,
                },
            },
        }))
    }

    if (isPresent(req.pricingContext)) {
        context["variants.calculated_price"] = {
            context: req.pricingContext,
        }
    }

    const queryObject = remoteQueryObjectFromString({
        entryPoint: "product",
        variables: {
            filters,
            ...req.queryConfig.pagination,
            ...context,
        },
        fields: req.queryConfig.fields,
    })

    const { rows: products, metadata: meta } = await remoteQuery(queryObject)

    if (withInventoryQuantity) {
        await wrapVariantsWithInventoryQuantityForSalesChannel(
            req,
            products.map((product) => product.variants).flat(1)
        )
    }

    await wrapProductsWithTaxPrices(req, products)

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
        offset: meta.skip,
        limit: meta.take,
    })
}


// export async function GET(req: MedusaRequest, res: MedusaResponse) {
//     const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
//     const context: QueryContextType = {}

//     const metadata = normalizeRecord((req.query as any).metadata)
//     const optionByTitle = normalizeRecord((req.query as any).option)

//     const priceMin = toNumberOrUndefined((req.query as any).price_min)
//     const priceMax = toNumberOrUndefined((req.query as any).price_max)

//     const filters: Record<string, any> = {
//         ...(req as any).filterableFields,
//         status: "published",
//     }

//     if (isPresent(filters.category_id)) {
//         const ids = Array.isArray(filters.category_id)
//             ? filters.category_id
//             : [filters.category_id]

//         filters.categories = { id: ids }
//         delete filters.category_id
//     }

//     if (isPresent(filters.tag_id)) {
//         const ids = Array.isArray(filters.tag_id)
//             ? filters.tag_id
//             : [filters.tag_id]

//         filters.tags = { id: ids }
//         delete filters.tag_id
//     }

//     if (isPresent(filters.collection_id)) {
//         filters.collection_id = Array.isArray(filters.collection_id)
//             ? filters.collection_id
//             : [filters.collection_id]
//     }

//     if (filters.type_id) {
//         filters.type_id = Array.isArray(filters.type_id)
//             ? filters.type_id
//             : [filters.type_id]
//     }

//     if (isPresent(filters.sales_channel_id)) {
//         const salesChannelIds = filters.sales_channel_id

//         filters["sales_channels"] ??= {}
//         filters["sales_channels"]["id"] = salesChannelIds

//         delete filters.sales_channel_id
//     }


//     if (Object.keys(metadata).length) {
//         filters.metadata = metadata
//     }

//     if (Object.keys(optionByTitle).length) {
//         const svc = req.scope.resolve(STORE_PRODUCT_CUSTOM_LIST_SERVICE) as any
//         const optionFilters = await svc.mapOptionTitlesToOptionIdValue(optionByTitle)

//         if (optionFilters.length) {
//             filters.variants ??= {}
//             filters.variants.$and = optionFilters.map((f: any) => ({
//                 options: { option_id: f.option_id, value: f.value },
//             }))
//         }
//     }


//     if (isPresent(req.pricingContext)) {
//         context["variants"] ??= {}
//         context["variants"]["calculated_price"] ??= QueryContext(
//             req.pricingContext!
//         )
//     }

//     const { data: products = [], metadata: meta } = await query.graph(
//         {
//             entity: "product",
//             fields: (req as any).queryConfig?.fields ?? [
//                 "id",
//                 "title",
//                 "handle",
//                 "thumbnail",
//                 "variants.*",
//                 "variants.calculated_price.*",
//             ],
//             filters,
//             pagination: (req as any).queryConfig?.pagination ?? {
//                 take: Number((req.query as any).limit ?? 50),
//                 skip: Number((req.query as any).offset ?? 0),
//             },
//             context,
//         }
//     )

//     let filtered = products
//     if (priceMin !== undefined || priceMax !== undefined) {
//         filtered = products.filter((p: any) => {
//             const amounts: number[] = (p.variants ?? [])
//                 .map((v: any) => v?.calculated_price?.calculated_amount)
//                 .filter((n: any) => typeof n === "number")

//             if (!amounts.length) return false

//             const min = Math.min(...amounts)
//             if (priceMin !== undefined && min < priceMin) return false
//             if (priceMax !== undefined && min > priceMax) return false
//             return true
//         })
//     }

//     res.json({
//         products: filtered,
//         count: (priceMin !== undefined || priceMax !== undefined) ? filtered.length : meta?.count ?? filtered.length,
//         offset: meta?.skip ?? 0,
//         limit: meta?.take ?? filtered.length,
//     })
// }
