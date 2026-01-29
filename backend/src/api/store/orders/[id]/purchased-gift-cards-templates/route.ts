import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { generateGiftCardTemplatesWorkflow } from "../../../../../workflows/generate-gift-card-templates"

export const GiftCardTemplatesConfgSchema = z.object({
    id: z.string(),
    card_id: z.string(),
    from: z.string(),
    title: z.string(),
    created_at: z.string(),
    expired_at: z.string(),
    amount: z.string(),
    code: z.string().optional(),
})

export const GiftCardTemplatesRequestSchema = z.object({
    rows: z.array(GiftCardTemplatesConfgSchema),
})

export type GiftCardTemplatesRequest = z.infer<
    typeof GiftCardTemplatesRequestSchema
>

export const POST = async (
    req: MedusaRequest<GiftCardTemplatesRequest>,
    res: MedusaResponse
) => {
    const parsed = GiftCardTemplatesRequestSchema.safeParse(req.body)

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid request body",
            errors: parsed.error.flatten().fieldErrors,
        })
    }

    try {
        const { result } = await generateGiftCardTemplatesWorkflow(req.scope).run({
            input: {
                rows: parsed.data.rows,
            },
        })

        return res.json({
            results: result,
        })
    } catch (e) {
        const message =
            e instanceof Error ? e.message : "Failed to generate gift card templates"

        return res.status(500).json({ message })
    }
}
