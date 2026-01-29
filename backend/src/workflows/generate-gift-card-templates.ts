import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { generateMarkupgoTemplatesStep } from "./steps/generate-markupgo-templates"
import { buildGiftCardUpdatesStep } from "./steps/build-giftcard-updates"
import { updateGiftCardsStep } from "@medusajs/loyalty-plugin/workflows"

type GiftCardTemplatesRow = {
    id: string
    card_id: string
    from: string
    title: string
    created_at: string
    expired_at: string
    amount: string
    code?: string
}

export const generateGiftCardTemplatesWorkflow: ReturnType<typeof createWorkflow> = createWorkflow(
    "generate-gift-card-templates-workflow",
    ({ rows }: { rows: GiftCardTemplatesRow[] }) => {
        const results = generateMarkupgoTemplatesStep({ rows })
        const updates = buildGiftCardUpdatesStep({ results })
        const updated = updateGiftCardsStep(updates)

        return new WorkflowResponse({ results, updated })
    }
)