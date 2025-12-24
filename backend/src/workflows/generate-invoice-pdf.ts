import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { generateInvoicePdfStep, GenerateInvoicePdfStepInput } from "./steps/generate-invoice-pdf"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { getOrderInvoiceStep } from "./steps/get-order-invoice"

type WorkflowInput = {
  order_id: string
}

export const generateInvoicePdfWorkflow = createWorkflow(
  "generate-invoice-pdf",
  (input: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "items.*",
        "gift_cards.*",
        "metadata",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "payment_collections.*",
        "payment_collections.payments.*",
        "payment_collections.payment_providers.*",
        "customer.*",
        "total",
        "subtotal",
        "discount_total",
        "shipping_total",
        "tax_total",
        "item_subtotal",
        "item_total",
        "item_tax_total",
        "gift_card_total",
        "credit_line_subtotal",
        "credit_line_tax_total",
        "credit_line_total",
        "original_item_total",
      ],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "query-order" })

    const { data: gift_cards } = useQueryGraphStep({
      entity: "gift_cards",
      fields: [
        "id",
        "status",
        "value",
        "code",
        "currency_code",
        "expires_at",
        "reference_id",
        "reference",
        "line_item_id",
        "note",
        "metadata",
      ],
      filters: { reference_id: input.order_id },
      options: { throwIfKeyNotFound: false },
    }).config({ name: "query-gift-cards" })

    const countryFilters = transform({ orders }, (data) => {
      const country_codes: string[] = []
      if (data.orders[0].billing_address?.country_code) {
        country_codes.push(data.orders[0].billing_address.country_code)
      }
      if (data.orders[0].shipping_address?.country_code) {
        country_codes.push(data.orders[0].shipping_address.country_code)
      }
      return country_codes
    })

    const { data: countries } = useQueryGraphStep({
      entity: "country",
      fields: ["display_name", "iso_2"],
      filters: { iso_2: countryFilters },
    }).config({ name: "retrieve-countries" })


    const transformedOrder = transform({ orders, countries }, (data) => {
      const order = data.orders[0]

      if (order.billing_address?.country_code) {
        order.billing_address.country_code =
          data.countries.find((c) => c.iso_2 === order.billing_address!.country_code)
            ?.display_name || order.billing_address!.country_code
      }

      if (order.shipping_address?.country_code) {
        order.shipping_address.country_code =
          data.countries.find((c) => c.iso_2 === order.shipping_address!.country_code)
            ?.display_name || order.shipping_address!.country_code
      }

      return order
    })


    const orderWithGiftCards = transform(
      { transformedOrder, gift_cards },
      ({ transformedOrder, gift_cards }) => {
        const hasGiftCardItems = transformedOrder.items?.some(
          (item: any) => item.is_giftcard === true
        )

        return {
          ...transformedOrder,
          gift_cards_line_items: hasGiftCardItems ? gift_cards ?? [] : [],
        }
      }
    )

    // Use the enriched order everywhere below
    const invoice = getOrderInvoiceStep({
      order_id: orderWithGiftCards.id,
    })

    const { pdf_buffer } = generateInvoicePdfStep({
      order: orderWithGiftCards,
      items: orderWithGiftCards.items,
      invoice_id: invoice.id,
    } as unknown as GenerateInvoicePdfStepInput)

    return new WorkflowResponse({ pdf_buffer })
  }
)
