import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";

export async function GET(
    req: MedusaStoreRequest,
    res: MedusaResponse
) {
    const { id } = req.params;

    if (!id) {
        throw new MedusaError(
            MedusaError.Types.INVALID_ARGUMENT,
            "Order is required."
        )
    }

    const query = req.scope.resolve("query")
    const { data: [gift_card], } = await query.graph({
        entity: "gift_cards",
        fields: req.queryConfig.fields,
        filters: {
            reference_id: id
        },
    }, {
        throwIfKeyNotFound: false
    });

    if (!gift_card) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `No gift cards found by order id ${id}`
        )
    }

    res.json({ gift_card });
}