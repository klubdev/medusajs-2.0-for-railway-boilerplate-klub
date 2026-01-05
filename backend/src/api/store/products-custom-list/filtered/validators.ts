import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

const MetadataSchema = z.record(z.union([
    z.string(),
    z.array(z.string())
])).optional()
const OptionSchema = z.record(z.union([
    z.string(),
    z.array(z.string())
])).optional()

export const StoreGetProductsParams = createFindParams().extend({
    //  standard filters 
    category_id: z.union([
        z.string(),
        z.array(z.string())
    ]).optional(),
    collection_id: z.union([
        z.string(),
        z.array(z.string())
    ]).optional(),
    type_id: z.union([
        z.string(),
        z.array(z.string())
    ]).optional(),
    tag_id: z.union([
        z.string(),
        z.array(z.string())
    ]).optional(),

    // your custom filters
    metadata: MetadataSchema,
    option: OptionSchema,
    price_min: z.coerce.number().optional(),
    price_max: z.coerce.number().optional(),
})
