import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MedusaError, MedusaErrorTypes } from "@medusajs/utils"
import ProductCustomListService from "../../../../modules/product-custom-list/service"
import { STORE_PRODUCT_CUSTOM_LIST_SERVICE } from "../../../../modules/product-custom-list"
import { asArray } from "../../../../modules/product-custom-list/helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
    try {
        const metafiledsRaw = (req.query as any).metafileds
        const metafiledsFromQuery = metafiledsRaw ? asArray(metafiledsRaw) : undefined

        const categoryIds = asArray((req.query as any).category_id)
        const collectionIds = asArray((req.query as any).collection_id)
        const currencyCode = (req.query as any).currency_code as string | undefined

        const productCustomListService = req.scope.resolve(
            STORE_PRODUCT_CUSTOM_LIST_SERVICE
        ) as ProductCustomListService

        const [metadataFilters, variantsFilters, priceRange] = await Promise.all([
            productCustomListService.getProductMetadataFilterValues(metafiledsFromQuery, {
                categoryIds,
                collectionIds
            }),
            productCustomListService.getVariantsFilterValues({
                categoryIds,
                collectionIds,
            }),
            productCustomListService.getPriceRange({
                categoryIds,
                collectionIds,
                currencyCode
            }),
        ])

        res.status(200).json({
            filters: {
                metadataFilters,
                variantsFilters,
                prices: priceRange,
            },
        })
    } catch (error: any) {
        throw new MedusaError(MedusaErrorTypes.DB_ERROR, error?.message ?? "DB_ERROR")
    }
}