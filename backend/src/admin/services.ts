import type { AdminOrder } from "@medusajs/framework/types";
import type { GiftCardLineItem, PurchasedGiftCardResponse } from "./types";

export const findByKeyValue = (array: any, key: string, value: string): any => {
    return array.find((item) => item[key] === value);
}

export const getFormatDate = (iso?: string): string => {
    if (!iso) return ""
    try {
        const d = new Date(iso)
        return d.toISOString().slice(0, 10)
    } catch {
        return iso
    }
}

export const getCustomerName = (order: AdminOrder): string => {
    const c = order.customer
    if (c?.first_name || c?.last_name) {
        return [c.first_name, c.last_name].filter(Boolean).join(" ").trim()
    }
    const s = order.shipping_address
    if (s?.first_name || s?.last_name) {
        return [s.first_name, s.last_name].filter(Boolean).join(" ").trim()
    }
    return order.email || "Customer"
}

export const extractGiftCards = (order: AdminOrder, cards: PurchasedGiftCardResponse[]): GiftCardLineItem[] => {
    if (!cards?.length) return [];

    const items = order.items ?? [];
    const from = getCustomerName(order);
    const rows = [];

    for (const item of items) {
        const isGift =
            item.is_giftcard === true ||
            item.variant?.product?.is_giftcard === true ||
            item.product?.is_giftcard === true;

        if (!isGift) continue;

        const qty = Math.max(1, Number(item.quantity) || 1);
        const unitPrice = item.unit_price ?? 0;
        const giftCard = findByKeyValue(cards, "line_item_id", item?.id)

        if (!Object.entries(giftCard)?.length) continue;

        for (let i = 0; i < qty; i++) {
            rows.push({
                id: item?.id,
                preview: item?.thumbnail ?? "",
                title: item?.title,
                unit_price: unitPrice,
                unit_price_formatted: new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: giftCard?.currency_code
                }).format(unitPrice),
                from,
                card_id: giftCard?.id,
                card_value: giftCard?.value,
                card_code: giftCard?.code,
                card_currency_code: giftCard?.currency_code,
                card_created_at: getFormatDate(giftCard?.created_at),
                card_expires_at: getFormatDate(giftCard?.expires_at),
                card_status: giftCard?.status,
                card_metadata: giftCard?.metadata
            })
        }
    }

    return rows;
};