import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

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

type RenderResult = {
    row_id: string
    card_id: string
    template_id: string
    url: string
}

export const generateMarkupgoTemplatesStep = createStep(
    "generate-markupgo-templates-step",
    async ({ rows }: { rows: GiftCardTemplatesRow[] }) => {
        const apiUrl = process.env.MARKUPGO_URL
        const apiKey = process.env.MARKUPGO_KEY
        const templates = process.env.MARKUPGO_TEMPLATES

        if (!apiUrl) throw new Error("MARKUPGO_URL is not configured")
        if (!apiKey) throw new Error("MARKUPGO_KEY is not configured")
        if (!templates) throw new Error("MARKUPGO_TEMPLATES is not configured")

        const options = { properties: { format: "jpeg", quality: 100 } }
        const ids = templates.split(",").map((s) => s.trim()).filter(Boolean)

        const results: RenderResult[] = []

        for (const templateId of ids) {
            for (const row of rows) {
                const markupResult = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "x-api-key": apiKey,
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        source: {
                            type: "template",
                            data: {
                                id: templateId,
                                context: {
                                    cardName: row.title,
                                    from: row.from,
                                    created_at: row.created_at,
                                    expired_at: row.expired_at,
                                    amount: row.amount,
                                    code: row.code,
                                },
                            },
                        },
                        options,
                    }),
                })

                if (!markupResult.ok) {
                    const errText = await markupResult.text()
                    throw new Error(
                        `MarkupGo request failed (template=${templateId}, row=${row.id}, status=${markupResult.status}): ${errText}`
                    )
                }

                const data = await markupResult.json()

                if (!data?.url) {
                    throw new Error(
                        `MarkupGo response missing url (template=${templateId}, row=${row.id})`
                    )
                }

                results.push({
                    row_id: row.id,
                    card_id: row.card_id,
                    template_id: templateId,
                    url: data.url,
                })
            }
        }

        return new StepResponse(results)
    }
)
