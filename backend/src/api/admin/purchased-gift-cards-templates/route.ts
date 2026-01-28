import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

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

  const apiUrl = process.env.MARKUPGO_URL
  const apiKey = process.env.MARKUPGO_KEY
  const templates = process.env.MARKUPGO_TEMPLATES

  if (!apiUrl) {
    return res.status(500).json({
      message: "MARKUPGO_URL is not configured. Set it in your environment.",
    })
  }

  if (!apiKey) {
    return res.status(500).json({
      message: "MARKUPGO_KEY is not configured. Set it in your environment.",
    })
  }

  if (!templates) {
    return res.status(500).json({
      message:
        "MARKUPGO_TEMPLATES is not configured. Set it in your environment.",
    })
  }

  const options = {
    properties: { format: "jpeg", quality: 100 },
  }

  const ids = templates.split(",").map((s) => s.trim()).filter(Boolean)
  const rows = parsed.data.rows

  const results: Array<{
    row_id: string
    card_id: string
    template_id: string
    url: string
  }> = []

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
        return res.status(502).json({
          message: "MarkupGo request failed",
          template_id: templateId,
          row_id: row.id,
          status: markupResult.status,
          details: errText,
        })
      }

      const data = await markupResult.json()

      if (!data?.url) {
        return res.status(502).json({
          message: "MarkupGo response missing url",
          template_id: templateId,
          row_id: row.id,
          response: data,
        })
      }

      results.push({
        row_id: row.id,
        card_id: row.card_id,
        template_id: templateId,
        url: data.url,
      })
    }
  }

  return res.json({ results })
}
