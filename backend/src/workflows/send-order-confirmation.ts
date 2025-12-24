import { createWorkflow, when, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";
import { MEDUSA_STOREFRONT_URL } from '../lib/constants'

type WorkflowInput = {
  order_id: string
  pdfContent: string
}

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  (input: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep(
      {
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
      }
    ).config({ name: 'query-order' })

    const { data: gift_cards } = useQueryGraphStep(
      {
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
      }
    ).config({ name: 'query-gift-cards' })

    // Merge expanded gift cards into the order object passed to email template
    const orderForEmail = transform(
      { orders, gift_cards },
      ({ orders, gift_cards }) => {
        const order = orders[0]

        const hasGiftCardItems = order.items?.some(
          (item: any) => item.is_giftcard === true
        )

        return {
          ...order,
          gift_cards_line_items: hasGiftCardItems ? gift_cards ?? [] : [],
        }
      }
    )

    const filename = transform(
      { orders },
      ({ orders }) => `invoice-${orders[0].display_id}.pdf`
    )
    const pdfContent = transform({ input }, ({ input }) => input.pdfContent)

    const attachments = pdfContent
      ? [
        {
          content: pdfContent,
          filename,
          content_type: "application/pdf",
          disposition: "attachment",
        },
      ]
      : []


    const notification = when({ orders }, ({ orders }) => !!orders[0].email)
      .then(() => {
        return sendNotificationStep([
          {
            to: orders[0].email!,
            channel: "email",
            template: "order-placed",
            data: {
              order: orderForEmail,
              storefrontUrl: MEDUSA_STOREFRONT_URL
            },
            attachments
          },
          {
            to: "kristel@bonbeaujoli.com",
            channel: "email",
            template: "order-placed",
            data: {
              order: orders[0],
              storefrontUrl: MEDUSA_STOREFRONT_URL,
            },
            attachments
          }
        ])
      })


    return new WorkflowResponse({
      notification
    })
  }
)