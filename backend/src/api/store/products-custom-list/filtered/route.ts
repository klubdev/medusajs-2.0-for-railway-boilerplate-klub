import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const context: object = {}

    const withInventoryQuantity = req.queryConfig.fields.some((field) =>
        field.includes("variants.inventory_quantity")
    )

    if (withInventoryQuantity) {
        req.queryConfig.fields = req.queryConfig.fields.filter(
            (field) => !field.includes("variants.inventory_quantity")
        )
    }

    const { data: products = [], metadata } = await query.graph(
        {
            entity: "product",
            fields: req.queryConfig.fields,
            filters: req.filterableFields,
            pagination: req.queryConfig.pagination,
            context,
        },
        {
            throwIfKeyNotFound: false
        }
    )

    res.json({
        products,
        count: metadata!.count,
        offset: metadata!.skip,
        limit: metadata!.take,
    })
} 