import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading, Text, toast } from "@medusajs/ui";
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";
import { useState } from "react";
import { sdk } from "../lib/sdk.js";

const OrderInvoiceNotificationWidget = ({
  data: order,
}: DetailWidgetProps<AdminOrder>) => {
  const [isSending, setIsSending] = useState(false);

  const sendingInvoice = async () => {
    setIsSending(true);

    try {
      await sdk.client.fetch(`/admin/orders/${order.id}/resend-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setIsSending(false);
      toast.success("Invoice sended successfully");
    } catch (error) {
      toast.error(`${error}`);
      setIsSending(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Notifications</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Resend confirmation to customer
          </Text>
        </div>
      </div>

      <div className="flex items-center justify-end px-6 py-4">
        <Button
          variant="secondary"
          disabled={isSending}
          onClick={sendingInvoice}
          isLoading={isSending}
        >
          Resend confirmation
        </Button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
});

export default OrderInvoiceNotificationWidget;
