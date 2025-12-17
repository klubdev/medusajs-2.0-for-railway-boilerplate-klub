import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";

export async function GET(
    req: MedusaStoreRequest,
    res: MedusaResponse
) {
    const { id } = req.params;
    
    let fields: string[] = [
        "id",
        "code",
        "value",
        "currency_code",
        "line_item_id",
        "note",
        "metadata",
        "expires_at",
        "status",
        "reference_id",
        "reference"
    ];

    const queryFields = req.query.fields;

    if (typeof queryFields === "string") {
        fields = queryFields.split(",");
    } else if (Array.isArray(queryFields)) {
        fields = queryFields.map(f => f.toString());
    }

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