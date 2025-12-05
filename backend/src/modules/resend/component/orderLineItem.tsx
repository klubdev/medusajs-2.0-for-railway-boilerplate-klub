import { Row, Text, Column } from "@react-email/components";

import { BigNumberValue } from "@medusajs/framework/types";

interface OrderLineItemProps {
  label: string;
  amount: BigNumberValue;
  currency_code: string;
  prefix?: string | null;
  bolder?: boolean;
}

export const OrderLineItem: React.FC<OrderLineItemProps> = ({
  label,
  amount,
  currency_code,
  prefix,
  bolder,
}) => {
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: currency_code,
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
  return (
    <Row className={`text-[#263A56] ${bolder ? "font-semibold mt-4" : ""}`}>
      <Column className="w-2/3">
        <Text className="m-0">{label}</Text>
      </Column>
      <Column className="w-1/3 text-right">
        <Text className="m-0">
          {prefix}
          {formatPrice(amount || 0)}
        </Text>
      </Column>
    </Row>
  );
};
