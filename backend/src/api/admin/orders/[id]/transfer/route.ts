import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const { id } = req.params
    const body = req.body as { customer_id?: string }
    const { customer_id } = body

    if (!customer_id) {
        res.status(400).json({
            message: "customer_id is required",
        })
        return
    }

    try {
        const orderModule = req.scope.resolve(Modules.ORDER)

        // Directly update the order's customer_id (no transfer request needed)
        const updatedOrder = await orderModule.updateOrders(id, {
            customer_id: customer_id,
        })

        res.json({
            order: updatedOrder,
        })
    } catch (error: any) {
        res.status(400).json({
            message: error.message || "Failed to transfer order ownership",
        })
    }
}