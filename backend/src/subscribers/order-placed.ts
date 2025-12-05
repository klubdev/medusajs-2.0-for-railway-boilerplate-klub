import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { generateInvoicePdfWorkflow } from "../workflows/generate-invoice-pdf"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Promise.all([
    (async () => {
      try {
        const { result: { pdf_buffer } } = await generateInvoicePdfWorkflow(container).run({
          input: {
            order_id: data.id
          }
        })
        const base64Content = Buffer.from(pdf_buffer).toString("base64")
        await sendOrderConfirmationWorkflow(container).run({
          input: {
            order_id: data.id,
            pdfContent: base64Content
          }
        })

      } catch (err) {
        console.error("Failed to send order confirmation request:", err)
      }
    })()
  ])
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
