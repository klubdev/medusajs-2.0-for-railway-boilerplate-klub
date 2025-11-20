import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { sendOrderConfirmationWorkflow } from "../../../../../workflows/send-order-confirmation"
import { MedusaError } from "@medusajs/framework/utils";

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const { id } = req.params

    try {
        // ✅ Correct usage with input
        const result = await sendOrderConfirmationWorkflow(req.scope).run({ input: { order_id : id} })
        
        res.json({
            message: `Order confirmation email resent for order ${id}`
        })
    } catch (err) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Failed to resend order id: ${id}`
        )
    }
} 