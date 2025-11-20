import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { generateInvoicePdfWorkflow } from "../workflows/generate-invoice-pdf"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const notificationModuleService = container.resolve("notification")

  // Fetch order data once
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "currency_code",
      "total",
      "email",
      "items.*",
      "items.variant.*",
      "items.variant.product.*",
      "shipping_address.*",
      "billing_address.*",
      "shipping_methods.*",
      "tax_total",
      "subtotal",
      "discount_total",
    ],
    filters: { id: data.id }
  })

  // Run both workflows in parallel with individual error handling
  await Promise.all([
    // Generate Invoice PDF and send email
    (async () => {
      try {
        const { result: { pdf_buffer } } = await generateInvoicePdfWorkflow(container)
          .run({ input: { order_id: data.id } })

        const base64Content = Buffer.from(pdf_buffer).toString("base64")

        await notificationModuleService?.createNotifications({
          to: order.email || "",
          template: "order-placed",
          channel: "email",
          data: order,
          attachments: [
            {
              content: base64Content,
              filename: `invoice-${order.id}.pdf`,
              content_type: "application/pdf",
              disposition: "attachment"
            }
          ]
        })
      } catch (err) {
        console.error("Failed to generate/send invoice PDF:", err)
      }
    })(),

    // Send Order Confirmation Workflow
    (async () => {
      try {
        await sendOrderConfirmationWorkflow(container).run({ input: { id: data.id } })
      } catch (err) {
        console.error("Failed to send order confirmation request:", err)
      }
    })()
  ])
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
