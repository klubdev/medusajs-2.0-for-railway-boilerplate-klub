import {
  Text,
  Container,
  Heading,
  Img,
  Hr,
  Section,
  Link,
} from "@react-email/components";

import { Base } from "../layout/base";

type GiftCardDTO = {
  id: string;
  status: "pending" | "redeemed" | string;
  code: string;
  currency_code: string;
  expires_at: string | null;
  reference_id: string;
  reference: string;
  line_item_id: string;
  note: string | null;
  metadata: Record<string, unknown>;
  raw_value?: {
    value: string;
    precision: number;
  };
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  deleted_at: string | null;
  value: number;
};

type GiftCardSendProps = {
  name: string;
  note?: string;
  card: GiftCardDTO;
  card_url: string;
  preview?: string;
  storefrontUrl?: string;
};

function GiftCardEmailComponent({
  name,
  note,
  card,
  card_url,
  preview = "Your gift card from Bon Beau Joli",
  storefrontUrl,
}: GiftCardSendProps) {
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: card?.currency_code ?? "eur",
  });

  return (
    <Base preview={preview}>
      <Container className="px-2">
        <Heading className="font-times text-4xl font-normal tracking-wider text-center text-[#263A56]">
          Bon Bea Joli Gift Card
        </Heading>
        <Hr className="border-black/20" />
      </Container>
      <Container className="px-2">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base m-0">
            <strong>{name}</strong> sent you a gift card and included a personal
            message just for you.
          </Text>
          {note?.trim() && (
            <Text className="text-[#263A56] text-base mt-4">
              <i>“{note}”</i>
            </Text>
          )}
        </Section>
        <Section className="my-6 text-center">
          <Img src={card_url} className="w-full h-auto mt-auto" />
        </Section>
      </Container>
      <Container className="px-2">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base mt-0">
            <b>Gift Card Code:</b> {card.code}
          </Text>
          <Text className="text-[#263A56] text-base mt-0">
            <b>Created at:</b> {new Date(card.created_at).toDateString()}
          </Text>
          <Text className="text-[#263A56] text-base mt-0">
            <b>Amount:</b> {formatter.format(card?.value ?? 0)}
          </Text>
          <Text className="text-[#263A56] text-base mt-0">
            <b>Expired at:</b>{" "}
            {card.expires_at ? new Date(card.expires_at).toDateString() : "∞"}
          </Text>
        </Section>
      </Container>
      <Container className="px-2">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base m-0">
            You can use the Gift Card code during your checkout process.
          </Text>
        </Section>
        <Section className="px-2 py-10 w-full text-center">
          <Link
            title="Happy shopping"
            className="w-1/3 bg-[#263A56] text-[#FCF9F3] text-base font-normal no-underline text-center px-5 py-3"
            target="_blank"
            href={`${storefrontUrl}`}
          >
            Happy Shopping
          </Link>
        </Section>
      </Container>
    </Base>
  );
}

export const giftCardEmail = (props: GiftCardSendProps) => (
  <GiftCardEmailComponent {...props} />
);

const mockGiftCardSned: GiftCardSendProps = {
  name: "Jonh Doe",
  note: "A small treat for you—happy shopping!",
  card: {
    id: "gcard_01KCP8VAA4H1V1QGN4CV0BFXN8",
    status: "redeemed",
    code: "GIFT-BN5Y-XU8X-72BN-5YXU",
    value: 100,
    currency_code: "eur",
    line_item_id: "ordli_01KCP8V9JY1NTW11DQ0K26Q31Y",
    reference_id: "order_01KCP8V9JWZ3TM7T0YS18JDYNG",
    reference: "order",
    expires_at: null,
    note: null,
    metadata: {
      template_urls: [
        {
          url: "https://files.markupgo.com/tasks/671e210c32a5e62c72d66b32/1769710511510.jpeg",
          template_id: "6978752fb3c238af23b74fcd",
        },
        {
          url: "https://files.markupgo.com/tasks/671e210c32a5e62c72d66b32/1769710516918.jpeg",
          template_id: "6977f4ecb3c238af23b73ea2",
        },
      ],
    },
    updated_at: "2026-01-29T18:15:18.067Z",
    created_at: "2025-12-17T13:44:00.068Z",
    deleted_at: null,
  },
  card_url:
    "https://files.markupgo.com/tasks/671e210c32a5e62c72d66b32/1769710511510.jpeg",
};

export default () => <GiftCardEmailComponent {...mockGiftCardSned} />;
