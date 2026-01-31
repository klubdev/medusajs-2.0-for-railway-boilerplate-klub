import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Avatar,
  Heading,
  Badge,
  Text,
  Label,
  Copy,
  Button,
  toast,
} from "@medusajs/ui";
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";
import type {
  PurchasedGiftCardResponse,
  GiftCardLineItem,
  GiftCardTemplatesResponse,
  TemplateUrlItem,
} from "../types";
import { extractGiftCards } from "../services";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { sdk } from "../lib/sdk.js";

const OrderGiftCardTemplateGenerator = ({
  data: order,
}: DetailWidgetProps<AdminOrder>) => {
  const [generated, setGenerated] = useState(false);
  const fileds = [
    "id",
    "status",
    "value",
    "code",
    "currency_code",
    "created_at",
    "expires_at",
    "line_item_id",
    "note",
    "metadata",
  ];

  if (!order) return null;

  const { data, isLoading, refetch } = useQuery<{
    gift_cards: PurchasedGiftCardResponse[];
  }>({
    queryKey: [`order-gift-cards-${order.id}`],
    queryFn: () =>
      sdk.client.fetch(
        `/admin/orders/${order.id}/purchased-gift-cards?fields=${fileds.join(",")}`,
        {
          method: "GET",
        },
      ),
  });

  const rows: GiftCardLineItem[] = extractGiftCards(order, data?.gift_cards);

  const generateTemplates = async () => {
    if (!rows?.length) return null;
    setGenerated(true);
    try {
      await sdk.client.fetch<GiftCardTemplatesResponse[]>(
        "/admin/purchased-gift-cards-templates",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: {
            rows: rows.map((row) => ({
              id: row.id,
              card_id: row.card_id,
              from: row.from,
              title: row.title,
              created_at: row.card_created_at || "-",
              expired_at: row.card_expires_at || "No expiration",
              amount: row.unit_price_formatted,
              code: row.card_code,
            })),
          },
        },
      );

      await refetch();
      toast.success("Gift card templates generated and saved");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Failed to generate gift card templates",
      );
    } finally {
      setGenerated(false);
    }
  };

  return (
    !isLoading &&
    rows.length > 0 && (
      <Container className="divide-y p-0">
        <Text as="div" className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Gift Card(s)</Heading>
          <Text as="div" className="flex flex-row gap-4 items-center">
            <Button
              title="Generate gift card to share"
              isLoading={generated}
              variant="primary"
              size="small"
              onClick={() => generateTemplates()}
            >
              Generate gift card to share
            </Button>
            <Badge color="grey" size="small">
              {rows.length} card{rows.length !== 1 ? "s" : ""}
            </Badge>
          </Text>
        </Text>

        <Text
          as="div"
          className="flex flex-col gap-4 justify-between px-6 py-4"
        >
          {rows.map((row: GiftCardLineItem) => {
            return (
              <Container key={row.id}>
                <Text
                  as="div"
                  className="flex flex-col gap-2 justify-between p-2"
                >
                  <Text as="div" className="flex flex-row gap-2 items-center">
                    <Text
                      size="base"
                      weight="plus"
                      className="text-ui-fg-subtle"
                    >
                      {row.title}
                    </Text>
                    <Avatar
                      src={row?.preview}
                      variant="squared"
                      fallback={row.title}
                      size="xsmall"
                    />
                  </Text>
                  <Text
                    as="div"
                    className="flex flex-col md:flex-row gap-2 flex-wrap justify-between text-ui-fg-subtle"
                  >
                    <Text as="div">
                      <Label className="text-ui-fg-base">From</Label>
                      <Text size="small">{row.from || "-"}</Text>
                    </Text>
                    <Text as="div">
                      <Label className="text-ui-fg-base">Created At</Label>
                      <Text size="small">{row.card_created_at || "-"}</Text>
                    </Text>
                    <Text as="div">
                      <Label className="text-ui-fg-base">Expired At</Label>
                      <Text size="small">
                        {row.card_expires_at || "No expiration"}
                      </Text>
                    </Text>
                    <Text as="div">
                      <Label className="text-ui-fg-base">Amount</Label>
                      <Text size="small">
                        {row.unit_price_formatted || "-"}
                      </Text>
                    </Text>
                    <Text as="div">
                      <Label className="text-ui-fg-base">Code</Label>
                      <Text
                        as="div"
                        className="flex flex-row gap-1 items-center justify-start"
                      >
                        <Text size="small">{row.card_code || "—"}</Text>
                        <Copy content={row.card_code} />
                      </Text>
                    </Text>
                  </Text>

                  {row.card_metadata &&
                    row.card_metadata?.template_urls?.length > 0 && (
                      <Text
                        as="div"
                        className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-5"
                      >
                        {row.card_metadata.template_urls.map(
                          (item: TemplateUrlItem) => (
                            <Text
                              as="div"
                              key={item.template_id}
                              className="relative w-full w-full"
                            >
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-full"
                                title="Click for preview"
                              >
                                <img
                                  key={item.template_id}
                                  src={item.url}
                                  alt={item.template_id}
                                  className="rounded-md w-full h-full object-cover overflow-hidden"
                                />
                              </a>
                            </Text>
                          ),
                        )}
                      </Text>
                    )}
                </Text>
              </Container>
            );
          })}
        </Text>
      </Container>
    )
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default OrderGiftCardTemplateGenerator;
