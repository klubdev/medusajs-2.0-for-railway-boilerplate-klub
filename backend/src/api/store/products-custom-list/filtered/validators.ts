

import { z } from "zod"
import {
    applyAndAndOrOperators,
    recursivelyNormalizeSchema,
} from "@medusajs/medusa/api/utils/common-validators/common"

import {
    GetProductsParams,
    StoreGetProductParamsDirectFields,
    transformProductParams
} from "@medusajs/medusa/api/utils/common-validators/index"

import {
    createFindParams,
    createOperatorMap,
    createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export const StoreGetProductParamsFields = z.object({
    region_id: z.string().optional(),
    country_code: z.string().optional(),
    province: z.string().optional(),
    cart_id: z.string().optional(),
})

const MetadataSchema = z.record(z.union([
    z.string(),
    z.array(z.string())
])).optional()


const OptionSchema = z.record(z.union([
    z.string(),
    z.array(z.string())
])).optional()

export type StoreGetProductParamsType = z.infer<typeof StoreGetProductParams>

export const StoreGetProductParams = createSelectParams().merge(
    StoreGetProductParamsFields
)

export const StoreGetProductVariantsParamsFields = z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    sku: z.union([z.string(), z.array(z.string())]).optional(),
    options: z
        .object({
            value: z.string().optional(),
            option_id: z.string().optional()
        })
        .optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    deleted_at: createOperatorMap().optional(),
})

const StoreProductOrItem = z.object({
    variants: z
        .object({
            options: z
                .object({
                    value: z.string().optional(),
                    option_id: z.string().optional(),
                })
                .optional(),
        })
        .merge(applyAndAndOrOperators(StoreGetProductVariantsParamsFields))
        .optional(),
})

export type StoreGetProductVariantsParamsType = z.infer<
    typeof StoreGetProductVariantsParams
>
export const StoreGetProductVariantsParams = createFindParams({
    offset: 0,
    limit: 50,
})
    .merge(StoreGetProductVariantsParamsFields)
    .merge(applyAndAndOrOperators(StoreGetProductVariantsParamsFields))

export const StoreGetProductsParamsFields = z
    .object({
        region_id: z.string().optional(),
        country_code: z.string().optional(),
        province: z.string().optional(),
        cart_id: z.string().optional(),
    })
    .merge(GetProductsParams)
    .strict()

export type StoreGetProductsParamsType = z.infer<typeof StoreGetProductsParams>
export const StoreGetProductsParams = createFindParams({
    offset: 0,
    limit: 50,
})
    .extend({
        metadata: MetadataSchema,
        option: OptionSchema,
        price_min: z.coerce.number().optional(),
        price_max: z.coerce.number().optional(),
    })
    .merge(StoreGetProductsParamsFields)
    .merge(
        z
            .object({
                variants: z
                    .object({
                        options: z
                            .object({
                                value: z.string().optional(),
                                option_id: z.string().optional(),
                            })
                            .optional(),
                    })
                    .merge(applyAndAndOrOperators(StoreGetProductVariantsParamsFields))
                    .optional(),
            })
            .merge(applyAndAndOrOperators(StoreGetProductParamsDirectFields))
            .strict()
    )
    .merge(
        z.object({
            $or: z.array(StoreProductOrItem).optional(),
            $and: z.array(StoreProductOrItem).optional(),
        })
    )
    .transform(recursivelyNormalizeSchema(transformProductParams) as any)



