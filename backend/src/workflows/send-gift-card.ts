import { createWorkflow, when, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";
import { MEDUSA_STOREFRONT_URL } from '../lib/constants'

type WorkflowInput = {
    email: string
    email_from: string
    name: string
    note?: string
    is_send_copy: boolean
    order_id: string
    gift_card_id: string
    gift_card_template_url: string
}

export const sendGiftCardWorkflow = createWorkflow(
    "send-gift-card",
    (input: WorkflowInput) => {
        const { data: gift_cards } = useQueryGraphStep({
            entity: "gift_cards",
            fields: ["id", "status", "value", "code", "currency_code", "expires_at", "metadata"],
            filters: { id: input.gift_card_id },
            options: { throwIfKeyNotFound: true },
        })

        const card = transform({ gift_cards }, ({ gift_cards }) => gift_cards?.[0])

        const notifications = transform({ card, input }, ({ card, input }) => {
            const arr = [
                {
                    to: input.email,
                    channel: "email",
                    template: "gift-card",
                    data: {
                        name: input.name,
                        note: input.note ?? "",
                        card,
                        card_url: input.gift_card_template_url,
                        storefrontUrl: MEDUSA_STOREFRONT_URL,
                    },
                },
            ]

            if (input.is_send_copy === true) {
                arr.push({
                    to: input.email_from,
                    channel: "email",
                    template: "gift-card",
                    data: {
                        name: input.name,
                        note: input.note ?? "",
                        card,
                        card_url: input.gift_card_template_url,
                        storefrontUrl: MEDUSA_STOREFRONT_URL,
                    },
                })
            }

            return arr
        })

        const notification = when({ card }, ({ card }) => !!card?.id).then(() => {
            return sendNotificationStep(notifications)
        })

        return new WorkflowResponse({ notification })
    }
)

