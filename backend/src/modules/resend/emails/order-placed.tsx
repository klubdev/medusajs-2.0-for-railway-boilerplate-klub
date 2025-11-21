import {
  Text,
  Column,
  Container,
  Heading,
  Img,
  Row,
  Hr,
  Section,
  Link,
} from "@react-email/components";

import { Base } from "../layout/base";
import { OrderLineItem } from "../component/orderLineItem";

import {
  BigNumberValue,
  CustomerDTO,
  OrderDTO,
  PaymentCollectionDTO,
} from "@medusajs/framework/types";

type OrderPlacedEmailProps = {
  order: OrderDTO & {
    customer: CustomerDTO;
    payment_collections: PaymentCollectionDTO;
  };
  preview?: string;
  storefrontUrl?: string;
};

function OrderPlacedEmailComponent({
  order,
  preview = "Thank you for your order from Bon Beau Joli",
  storefrontUrl,
}: OrderPlacedEmailProps) {
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: order.currency_code,
  });

  const formatPrice = (price: BigNumberValue) => {
    if (typeof price === "number") {
      return formatter.format(price);
    }

    if (typeof price === "string") {
      return formatter.format(parseFloat(price));
    }

    return price?.toString() || "";
  };

  const getPaymentInfo = (type: string) => {
    const items = {
      pp_stripe_stripe: "Credit card",
      "pp_stripe-ideal_stripe": "iDeal",
      "pp_stripe-bancontact_stripe": "Bancontact",
      pp_paypal_paypal: "PayPal",
      pp_system_default: "Manual Payment",
    };

    return items[type] || "Default";
  };

  return (
    <Base preview={preview}>
      {/* Thank You Message */}
      <Container className="px-2">
        <Heading className="font-times text-4xl font-normal tracking-wider text-center text-[#263A56]">
          Thank you for your order!
        </Heading>

        <Hr className="border-black/20" />
      </Container>

      <Container className="px-2">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base m-0">
            Hi {order?.customer?.first_name}, we're getting your order ready to
            be shipped.
          </Text>
          <Text className="text-[#263A56] text-base m-0">
            Order Id: #{order.display_id}
          </Text>
        </Section>
      </Container>

      {/* Order Summary */}
      <Container className="px-2">
        <Section className="my-2">
          <Heading className="font-times text-lg font-semibold tracking-wide text-[#263A56] mb-4">
            Order Summary
          </Heading>
          {order.items?.map((item) => (
            <OrderLineItem
              label={item.product_title}
              amount={item.unit_price}
              prefix={`${item.quantity} x `}
              currency_code={order.currency_code}
            />
          ))}
          <Hr className="border-black/20" />

          <OrderLineItem
            label="Subtotal (excl. shipping)"
            amount={order.subtotal}
            currency_code={order.currency_code}
          />
          {order.discount_total != 0 && (
            <OrderLineItem
              label="Discount"
              amount={order.discount_total}
              prefix="-"
              currency_code={order.currency_code}
            />
          )}
          {order.shipping_total != 0 && (
            <OrderLineItem
              label="Shipping Costs"
              amount={order.shipping_total}
              currency_code={order.currency_code}
            />
          )}
          {order.tax_total != 0 && (
            <OrderLineItem
              label="Taxes included in price"
              amount={order.tax_total}
              currency_code={order.currency_code}
            />
          )}
          {order.gift_card_total != 0 && (
            <OrderLineItem
              label="Gift card"
              amount={order.gift_card_total}
              currency_code={order.currency_code}
            />
          )}

          <Hr className="border-black/20" />

          <OrderLineItem
            label="Total"
            amount={order.total}
            currency_code={order.currency_code}
            bolder={true}
          />
        </Section>
      </Container>
      <Container className="px-2">
        <Hr className="border-black/20" />
      </Container>

      {/* Order Infromation */}
      <Container className="px-2">
        <Row className="my-2">
          <Column className="w-1/2">
            <Text className="text-[#263A56] text-base font-semibold">
              Shipping Address
            </Text>
            <Text className="text-[#263A56] text-sm m-0">
              <span>
                {order?.shipping_address?.first_name}{" "}
                {order?.shipping_address?.last_name}
              </span>{" "}
              <br />
              <span>
                {order?.shipping_address?.address_1}{" "}
                {order?.shipping_address?.address_2
                  ? order?.shipping_address?.address_2
                  : ""}
              </span>
              <br />
              <span>
                {order?.shipping_address?.postal_code}
                {", "}
                {order?.shipping_address?.city}
              </span>{" "}
              <br />
              <span className="uppercase">
                {order?.shipping_address?.country_code}
              </span>
              <br />
            </Text>
          </Column>
          <Column className="w-1/2">
            <Text className="text-[#263A56] text-base font-semibold">
              Billing Address
            </Text>
            <Text className="text-[#263A56] text-sm m-0">
              <span>
                {order?.billing_address?.first_name}{" "}
                {order?.billing_address?.last_name}
              </span>{" "}
              <br />
              <span>
                {order?.billing_address?.address_1}{" "}
                {order?.billing_address?.address_2
                  ? order?.billing_address?.address_2
                  : ""}
              </span>
              <br />
              <span>
                {order?.billing_address?.postal_code}
                {", "}
                {order?.billing_address?.city}
              </span>{" "}
              <br />
              <span className="uppercase">
                {order?.billing_address?.country_code}
              </span>
            </Text>
          </Column>
        </Row>
        <Row className="my-2">
          <Column className="w-1/2">
            <Text className="text-[#263A56] text-base font-semibold">
              Shipping method
            </Text>
            <Text className="text-[#263A56] text-base m-0">
              {order.shipping_methods?.map((method) => (
                <span key={method.id}>
                  {method.name} {formatPrice(method.total)}
                </span>
              ))}
            </Text>
          </Column>
          {Array.isArray(order?.payment_collections) &&
            order.payment_collections.length > 0 && (
              <Column className="w-1/2">
                <Text className="text-[#263A56] text-base font-semibold">
                  Payment method
                </Text>
                <Text className="text-[#263A56] text-base m-0">
                  {order.payment_collections[0]?.payments?.[0]?.provider_id
                    ? getPaymentInfo(
                        order.payment_collections[0].payments[0].provider_id
                      )
                    : "Default"}
                </Text>
              </Column>
            )}
        </Row>
      </Container>
      {/* Order Items */}
      <Hr className="border-black/20" />
      <Container className="px-2">
        <Heading className="font-times text-lg font-semibold tracking-wide text-[#263A56] mb-4">
          Your Items
        </Heading>
        {order.items?.map((item) => (
          <Section key={item.id} className="border-b border-black/20 pb-2">
            <Row>
              <Column className="w-1/3">
                <Img
                  src={item.thumbnail ?? ""}
                  alt={item.product_title ?? ""}
                  className="rounded-sm"
                  width="100%"
                />
              </Column>
              <Column className="w-2/3 pl-4">
                <Text className="text-lg font-semibold text-[#263A56] my-1">
                  {item.product_title}
                </Text>
                <Text className="text-[#263A56] my-1">
                  {item.variant_title}
                </Text>
                <Text className="text-[#263A56] my-1 text-base">
                  {item.quantity}
                  {" x "} {formatPrice(item.total)}
                </Text>
              </Column>
            </Row>
          </Section>
        ))}
        <Section className="px-2 py-10 w-full text-center">
          <Link
            className="w-1/3 bg-[#263A56] text-[#FCF9F3] text-base font-normal no-underline text-center px-5 py-3"
            target="_blank"
            href={`${storefrontUrl}/order/${order.id}/confirmed`}
          >
            View Order
          </Link>
        </Section>
      </Container>
    </Base>
  );
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);

const mockOrder = {
  order: {
    id: "order_01JSNXDH9BPJWWKVW03B9E9KW8",
    display_id: 1,
    email: "shahednasser@gmail.com",
    currency_code: "eur",
    total: 20,
    subtotal: 20,
    discount_total: 0,
    shipping_total: 10,
    tax_total: 0,
    item_subtotal: 10,
    item_total: 10,
    item_tax_total: 0,
    customer_id: "cus_01JSNXD6VQC1YH56E4TGC81NWX",
    items: [
      {
        id: "ordli_01JSNXDH9C47KZ43WQ3TBFXZA9",
        title: "L",
        subtitle: "Medusa Sweatshirt",
        thumbnail:
          "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
        variant_id: "variant_01JSNXAQCZ5X81A3NRSVFJ3ZHQ",
        product_id: "prod_01JSNXAQBQ6MFV5VHKN420NXQW",
        product_title: "Medusa Sweatshirt",
        product_description:
          "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
        product_subtitle: null,
        product_type: null,
        product_type_id: null,
        product_collection: null,
        product_handle: "sweatshirt",
        variant_sku: "SWEATSHIRT-L",
        variant_barcode: null,
        variant_title: "L",
        variant_option_values: null,
        requires_shipping: true,
        is_giftcard: false,
        is_discountable: true,
        is_tax_inclusive: false,
        is_custom_price: false,
        metadata: {},
        raw_compare_at_unit_price: null,
        raw_unit_price: {
          value: "10",
          precision: 20,
        },
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        tax_lines: [],
        adjustments: [],
        compare_at_unit_price: null,
        unit_price: 10,
        quantity: 1,
        raw_quantity: {
          value: "1",
          precision: 20,
        },
        detail: {
          id: "orditem_01JSNXDH9DK1XMESEZPADYFWKY",
          version: 1,
          metadata: null,
          order_id: "order_01JSNXDH9BPJWWKVW03B9E9KW8",
          raw_unit_price: null,
          raw_compare_at_unit_price: null,
          raw_quantity: {
            value: "1",
            precision: 20,
          },
          raw_fulfilled_quantity: {
            value: "0",
            precision: 20,
          },
          raw_delivered_quantity: {
            value: "0",
            precision: 20,
          },
          raw_shipped_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_requested_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_received_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_dismissed_quantity: {
            value: "0",
            precision: 20,
          },
          raw_written_off_quantity: {
            value: "0",
            precision: 20,
          },
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          item_id: "ordli_01JSNXDH9C47KZ43WQ3TBFXZA9",
          unit_price: null,
          compare_at_unit_price: null,
          quantity: 1,
          fulfilled_quantity: 0,
          delivered_quantity: 0,
          shipped_quantity: 0,
          return_requested_quantity: 0,
          return_received_quantity: 0,
          return_dismissed_quantity: 0,
          written_off_quantity: 0,
        },
        subtotal: 10,
        total: 10,
        original_total: 10,
        discount_total: 0,
        discount_subtotal: 0,
        discount_tax_total: 0,
        tax_total: 0,
        original_tax_total: 0,
        refundable_total_per_unit: 10,
        refundable_total: 10,
        fulfilled_total: 0,
        shipped_total: 0,
        return_requested_total: 0,
        return_received_total: 0,
        return_dismissed_total: 0,
        write_off_total: 0,
        raw_subtotal: {
          value: "10",
          precision: 20,
        },
        raw_total: {
          value: "10",
          precision: 20,
        },
        raw_original_total: {
          value: "10",
          precision: 20,
        },
        raw_discount_total: {
          value: "0",
          precision: 20,
        },
        raw_discount_subtotal: {
          value: "0",
          precision: 20,
        },
        raw_discount_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_original_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_refundable_total_per_unit: {
          value: "10",
          precision: 20,
        },
        raw_refundable_total: {
          value: "10",
          precision: 20,
        },
        raw_fulfilled_total: {
          value: "0",
          precision: 20,
        },
        raw_shipped_total: {
          value: "0",
          precision: 20,
        },
        raw_return_requested_total: {
          value: "0",
          precision: 20,
        },
        raw_return_received_total: {
          value: "0",
          precision: 20,
        },
        raw_return_dismissed_total: {
          value: "0",
          precision: 20,
        },
        raw_write_off_total: {
          value: "0",
          precision: 20,
        },
      },
    ],
    shipping_address: {
      id: "caaddr_01JSNXD6W0TGPH2JQD18K97B25",
      customer_id: null,
      company: "Company Name",
      first_name: "Shahed",
      last_name: "Nasser",
      address_1: "Address 1",
      address_2: "Address 2",
      city: "Rotterdam",
      country_code: "nl",
      province: "",
      postal_code: "3027 ES",
      phone: "+1 1111 111111",
      metadata: null,
      created_at: "2025-04-25T07:25:48.801Z",
      updated_at: "2025-04-25T07:25:48.801Z",
      deleted_at: null,
    },
    billing_address: {
      id: "caaddr_01JSNXD6W0V7RNZH63CPG26K5W",
      customer_id: null,
      company: "Company Name",
      first_name: "Shahed",
      last_name: "Nasser",
      address_1: "Address 1",
      address_2: "Address 2",
      city: "Rotterdam",
      country_code: "nl",
      province: "",
      postal_code: "3027 ES",
      phone: "+1 1111 111111",
      metadata: null,
      created_at: "2025-04-25T07:25:48.801Z",
      updated_at: "2025-04-25T07:25:48.801Z",
      deleted_at: null,
    },
    shipping_methods: [
      {
        id: "ordsm_01JSNXDH9B9DDRQXJT5J5AE5V1",
        name: "Standard Shipping",
        description: null,
        is_tax_inclusive: false,
        is_custom_amount: false,
        shipping_option_id: "so_01JSNXAQA64APG6BNHGCMCTN6V",
        data: {},
        metadata: null,
        raw_amount: {
          value: "10",
          precision: 20,
        },
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        tax_lines: [],
        adjustments: [],
        amount: 10,
        order_id: "order_01JSNXDH9BPJWWKVW03B9E9KW8",
        detail: {
          id: "ordspmv_01JSNXDH9B5RAF4FH3M1HH3TEA",
          version: 1,
          order_id: "order_01JSNXDH9BPJWWKVW03B9E9KW8",
          return_id: null,
          exchange_id: null,
          claim_id: null,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          shipping_method_id: "ordsm_01JSNXDH9B9DDRQXJT5J5AE5V1",
        },
        subtotal: 10,
        total: 10,
        original_total: 10,
        discount_total: 0,
        discount_subtotal: 0,
        discount_tax_total: 0,
        tax_total: 0,
        original_tax_total: 0,
        raw_subtotal: {
          value: "10",
          precision: 20,
        },
        raw_total: {
          value: "10",
          precision: 20,
        },
        raw_original_total: {
          value: "10",
          precision: 20,
        },
        raw_discount_total: {
          value: "0",
          precision: 20,
        },
        raw_discount_subtotal: {
          value: "0",
          precision: 20,
        },
        raw_discount_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_original_tax_total: {
          value: "0",
          precision: 20,
        },
      },
    ],
    payment_collections: [
      {
        id: "pay_col_01KAG2R04EW0CE9KSTAN4YCJ47",
        currency_code: "eur",
        completed_at: "2025-11-20T09:12:49.366Z",
        status: "completed",
        metadata: null,
        raw_amount: { value: "184.7", precision: 20 },
        raw_authorized_amount: { value: "184.7", precision: 20 },
        raw_captured_amount: { value: "184.7", precision: 20 },
        raw_refunded_amount: { value: "0", precision: 20 },
        created_at: "2025-11-20T07:30:29.647Z",
        updated_at: "2025-11-20T09:12:49.370Z",
        deleted_at: null,
        payments: [
          {
            id: "pay_01KAG8KBPEBGNTK4SRYWRBA97P",
            currency_code: "eur",
            provider_id: "pp_stripe-ideal_stripe",
            data: {
              id: "pi_3SVTucRsEY2EXE411bp4Ppx4",
              amount: 18470,
              object: "payment_intent",
              review: null,
              source: null,
              status: "succeeded",
              created: 1763629942,
              invoice: null,
              currency: "eur",
              customer: "cus_TSBk0BL9nAMEnD",
              livemode: true,
              metadata: { session_id: "payses_01KAG8JHRHTW5B8SP8KAHDKSQE" },
              shipping: null,
              processing: null,
              application: null,
              canceled_at: null,
              description: null,
              next_action: null,
              on_behalf_of: null,
              client_secret:
                "pi_3SVTucRsEY2EXE411bp4Ppx4_secret_EW2HQIIL5IacOHDR03xRy3j0X",
              latest_charge: "py_3SVTucRsEY2EXE411zXKdqlM",
              receipt_email: null,
              transfer_data: null,
              amount_details: { tip: {} },
              capture_method: "automatic",
              payment_method: "pm_1SVTumRsEY2EXE41IWbpSuee",
              transfer_group: null,
              amount_received: 18470,
              amount_capturable: 0,
              last_payment_error: null,
              setup_future_usage: null,
              cancellation_reason: null,
              confirmation_method: "automatic",
              payment_method_types: ["ideal"],
              statement_descriptor: null,
              application_fee_amount: null,
              payment_method_options: { ideal: {} },
              automatic_payment_methods: null,
              statement_descriptor_suffix: null,
              excluded_payment_method_types: null,
              payment_method_configuration_details: null,
            },
            metadata: null,
            captured_at: "2025-11-20T09:12:49.328Z",
            canceled_at: null,
            payment_collection_id: "pay_col_01KAG2R04EW0CE9KSTAN4YCJ47",
            payment_session: { id: "payses_01KAG8JHRHTW5B8SP8KAHDKSQE" },
            raw_amount: { value: "184.7", precision: 20 },
            created_at: "2025-11-20T09:12:49.103Z",
            updated_at: "2025-11-20T09:12:49.343Z",
            deleted_at: null,
            payment_session_id: "payses_01KAG8JHRHTW5B8SP8KAHDKSQE",
            amount: 184.7,
          },
        ],
        amount: 184.7,
        authorized_amount: 184.7,
        captured_amount: 184.7,
        refunded_amount: 0,
      },
    ],
    customer: {
      id: "cus_01JSNXD6VQC1YH56E4TGC81NWX",
      company_name: "Comapny Name",
      first_name: "Jonh",
      last_name: "Doe",
      email: "jonhdoe@example.com",
      phone: "+1 1111 22222",
      has_account: false,
      metadata: null,
      created_by: null,
      created_at: "2025-04-25T07:25:48.791Z",
      updated_at: "2025-04-25T07:25:48.791Z",
      deleted_at: null,
    },
  },
};
// @ts-ignore
export default () => <OrderPlacedEmailComponent {...mockOrder} />;
