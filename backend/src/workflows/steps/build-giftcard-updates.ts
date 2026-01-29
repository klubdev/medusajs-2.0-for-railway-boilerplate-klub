import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type { ModuleUpdateGiftCard } from "@medusajs/loyalty-plugin/types"

type RenderResult = {
    card_id: string
    template_id: string
    url: string
}

export const buildGiftCardUpdatesStep = createStep(
    "build-giftcard-updates",
    async ({ results }: { results: RenderResult[] }) => {
        const byCard = new Map<string, Array<{ template_id: string; url: string }>>()

        for (const r of results) {
            if (!r.card_id) continue
            const arr = byCard.get(r.card_id) ?? []
            arr.push({ template_id: r.template_id, url: r.url })
            byCard.set(r.card_id, arr)
        }

        const updates: ModuleUpdateGiftCard[] = Array.from(byCard.entries()).map(
            ([id, template_urls]) => ({
                id,
                metadata: { template_urls },
            })
        )

        return new StepResponse(updates)
    }
)
