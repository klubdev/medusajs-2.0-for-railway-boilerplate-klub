import {
  AdminCustomer,
  AdminOrder,
  FindParams,
  PaginatedResponse,
  StoreCart,
} from "@medusajs/framework/types";

export type AdminQuote = {
  id: string;
  status: string;
  draft_order_id: string;
  order_change_id: string;
  cart_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  draft_order: AdminOrder;
  cart: StoreCart;
  customer: AdminCustomer
};

export interface QuoteQueryParams extends FindParams { }

export type AdminQuoteResponse = {
  quote: AdminQuote;
};

export type AdminQuotesResponse = PaginatedResponse<{
  quotes: AdminQuote[];
}>;


export type GiftCardLineItem = {
  id: string
  thumbnail: string
  title: string
  unit_price: string
  unit_price_formatted: string
  from: string
  card_id: string
  card_value: string | number
  card_code: string
  card_currency_code: string | null
  card_created_at: string
  card_expires_at: string
  card_status: "pending" | "redeemed" | string
}

export type PurchasedGiftCardResponse = {
  id: string
  line_item_id: string
  value: string | number
  code: string
  currency_code: string | null
  created_at: string
  expires_at: string
  status: "pending" | "redeemed" | string
  note: string
  metadata: Record<string, string> | null
}

export type GiftCardTemplatesResponse = {
  row_id: string
  card_id: string
  template_id: string
  url: string
}

export type TemplateUrlItem = {
  template_id: string
  url: string
}