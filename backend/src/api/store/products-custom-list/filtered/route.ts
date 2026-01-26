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
import { normalizeRecord, toNumberOrUndefined, sortedProducts, getOrderKey } from "../../../../modules/product-custom-list/helpers"
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

    const svc = req.scope.resolve(STORE_PRODUCT_CUSTOM_LIST_SERVICE) as any

    const filters: Record<string, any> = {
        ...(req as any).filterableFields
    }

    const metadata = normalizeRecord((req.query as any).metadata)
    const optionByTitle = normalizeRecord((req.query as any).option)

    const rawOrder = (req.queryConfig.pagination as any)?.order

    const orderBy = getOrderKey(rawOrder)
    const isCustomOrder = ["price", "-price", "category"].includes(orderBy)

    const priceMin = toNumberOrUndefined((req.query as any).price_min)
    const priceMax = toNumberOrUndefined((req.query as any).price_max)

    if (priceMin !== undefined || priceMax !== undefined) {
        delete filters.price_min;
        delete filters.price_max;
    }

    if (Object.keys(optionByTitle).length) {
        delete filters.option;
    }

    if (isCustomOrder) {
        delete filters.order
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

        if (priceMin !== undefined || priceMax !== undefined) {
            const ids = await svc.getProductsFilteredByPrice({
                price_min: priceMin,
                price_max: priceMax,
                currency_code: req.pricingContext?.currency_code ?? 'eur',
                categoryIds: filters?.categories?.id,
                collectionIds: filters?.collection_id,
            })

            if (ids) filters.id = ids; 
        }
    }

    let paginationVars = req.queryConfig.pagination as any

    if (isCustomOrder) {
        const { order, ...withoutOrder } = paginationVars
        paginationVars = withoutOrder
    }

    const queryObject = remoteQueryObjectFromString({
        entryPoint: "product",
        variables: {
            filters,
            ...paginationVars,
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

    let sorted = products
    if (isCustomOrder) {
        sorted = sortedProducts(sorted, orderBy as any, filters?.categories?.id)
    }

    res.json({
        products: sorted,
        count: meta?.count,
        offset: meta.skip,
        limit: meta.take,
    })
}