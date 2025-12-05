import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { sendOrderConfirmationWorkflow } from "../../../../../workflows/send-order-confirmation"
import { generateInvoicePdfWorkflow } from "../../../../../workflows/generate-invoice-pdf";
import { MedusaError } from "@medusajs/framework/utils";

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const { id } = req.params

    try {
        const { result: { pdf_buffer } } = await generateInvoicePdfWorkflow(req.scope).run({
            input: { order_id: id }
        })

        const base64Content = Buffer.from(pdf_buffer).toString("base64")
        const result = await sendOrderConfirmationWorkflow(req.scope)
            .run({
                input: {
                    order_id: id,
                    pdfContent: base64Content
                }
            })

        res.json({
            message: `Order confirmation email resent for order ${id}`
        })
    } catch (err) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Failed to resend order id: ${JSON.stringify(err)}`
        )
    }
} 