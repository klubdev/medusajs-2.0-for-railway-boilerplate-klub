import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod"
import { updateInvoiceConfigWorkflow } from "../../../workflows/update-invoice-config";
import { InvoiceConfig } from "../../../modules/invoice-generator/models/invoice-config";


type UpdateInvoiceConfigResult = {
  result: {
    invoice_config: typeof InvoiceConfig
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query")

  const { data: [invoiceConfig] } = await query.graph({
    entity: "invoice_config",
    fields: ["*"],
  })

  res.json({
    invoice_config: invoiceConfig
  })
}

export const PostInvoiceConfgSchema = z.object({
  company_name: z.string().optional(),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().optional(),
  company_logo: z.string().optional(),
  notes: z.string().optional(),
})

type PostInvoiceConfig = z.infer<typeof PostInvoiceConfgSchema>

export async function POST(
  req: MedusaRequest<PostInvoiceConfig>,
  res: MedusaResponse
) {
  const workflowResult = await updateInvoiceConfigWorkflow(req.scope)
    .run({
      input: req.validatedBody,
    }) as UpdateInvoiceConfigResult

  const { invoice_config } = workflowResult.result

  res.json({
    invoice_config
  })
}