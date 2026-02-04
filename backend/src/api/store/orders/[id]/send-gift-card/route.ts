import { MedusaResponse, MedusaRequest } from "@medusajs/framework";
import { sendGiftCardWorkflow } from "../../../../../workflows/send-gift-card";

import { z } from "zod"

export const GiftCardInfoConfgSchema = z.object({
    email: z.string().email(),
    email_from: z.string().email(),
    name: z.string(),
    note: z.string().optional(),
    is_send_copy: z.coerce.boolean().optional().default(false),
    order_id: z.string(),
    gift_card_id: z.string(),
    gift_card_template_url: z.string()
})

export type GiftCardInfoRequest = z.infer<
    typeof GiftCardInfoConfgSchema
>

export const POST = async (
    req: MedusaRequest<GiftCardInfoRequest>,
    res: MedusaResponse
) => {
    const parsed = GiftCardInfoConfgSchema.safeParse(req.body)

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid request body",
            errors: parsed.error.flatten().fieldErrors,
        })
    }

    const { result } = await sendGiftCardWorkflow(req.scope)
        .run({
            input: {
                email: parsed.data.email,
                email_from: parsed.data.email_from,
                name: parsed.data.name,
                note: parsed.data.note,
                is_send_copy: parsed.data.is_send_copy,
                order_id: parsed.data.order_id,
                gift_card_id: parsed.data.gift_card_id,
                gift_card_template_url: parsed.data.gift_card_template_url
            }
        })

    res.json({ result });
}