import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";

export async function GET(
    req: MedusaStoreRequest,
    res: MedusaResponse
) {
    const { id } = req.params;

    const fields = req.query.fields?.split(",") ?? [
        'id',
        'status',
        'value',
        'code',
        'currency_code',
        'expires_at',
        'reference_id',
        'reference',
        'line_item_id',
        'note',
        'metadata'
    ];

    if (!id) {
        throw new MedusaError(
            MedusaError.Types.INVALID_ARGUMENT,
            "ID is required."
        )
    }

    const query = req.scope.resolve("query")
    const { data: [gift_card], } = await query.graph({
        entity: "gift_cards",
        fields,
        filters: {
            line_item_id: id
        },
    }, {
        throwIfKeyNotFound: true
    });

    if (!gift_card) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `No gift card found by order item id ${id}`
        )
    }

    res.json({ gift_card });
}