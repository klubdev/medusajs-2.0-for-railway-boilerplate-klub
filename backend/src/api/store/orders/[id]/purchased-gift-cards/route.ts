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
    const { data: giftCards, } = await query.graph({
        entity: "gift_cards",
        fields: req.queryConfig.fields,
        filters: {
            reference_id: id,
            reference: "order",
        },
    }, {
        throwIfKeyNotFound: false
    });

    if (!giftCards) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `No gift cards found by order id ${id}`
        )
    }

    const sorted = (giftCards || []).slice().sort((a, b) => {
        const liA = (a as { line_item_id?: string | null }).line_item_id ?? ""
        const liB = (b as { line_item_id?: string | null }).line_item_id ?? ""
        if (liA !== liB) return liA.localeCompare(liB)
        const tA = String((a as { created_at?: unknown }).created_at ?? "")
        const tB = String((b as { created_at?: unknown }).created_at ?? "")
        return tA.localeCompare(tB)
    })


    res.json({ gift_cards: sorted });
}