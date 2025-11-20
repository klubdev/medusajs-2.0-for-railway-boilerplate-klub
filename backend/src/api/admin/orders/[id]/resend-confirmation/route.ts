import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { sendOrderConfirmationWorkflow } from "../../../../../workflows/send-order-confirmation"
import { MedusaError } from "@medusajs/framework/utils";

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const { id } = req.params

    try {
        await sendOrderConfirmationWorkflow(req.scope).run({ input: { id } })
    } catch (err) {
        console.error(err);
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Failed to resend order: ${id}`
        )
    }
} 