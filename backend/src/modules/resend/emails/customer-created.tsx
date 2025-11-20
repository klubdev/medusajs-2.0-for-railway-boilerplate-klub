import { Text, Container, Heading, Section, Hr } from "@react-email/components";
import { CustomerDTO } from "@medusajs/framework/types";
import { Base } from "../layout/base";

type CustomerCreatedEmailProps = {
  customer: CustomerDTO | null;
  preview?: string;
};

function СustomerCreatedEmailComponent({
  customer,
  preview = "Welcome to the Bon Beau Joli family...",
}: CustomerCreatedEmailProps) {
  return (
    <Base preview={preview}>
      <Container className="px-2">
        <Heading className="font-times text-4xl font-normal tracking-wider text-center text-[#263A56]">
          Welcome to the <br /> Bon Beau Joli family!
        </Heading>
        <Hr className="border-black/20" />
      </Container>

      <Container className="px-2">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base m-0">
            Hello {customer?.first_name},
          </Text>
          <Text className="text-[#263A56] text-base my-4">
            Thank you for creating an account — we're delighted to welcome you
            into our world.
          </Text>
        </Section>
      </Container>
    </Base>
  );
}

export const customerCreatedEmail = (props: CustomerCreatedEmailProps) => (
  <СustomerCreatedEmailComponent {...props} />
);

// Mock data for preview/development
const mockInvite: CustomerCreatedEmailProps = {
  customer: {
    id: "cus_01JSNXD6VQC1YH56E4TGC81NWX",
    email: "jonhdoe@example.com",
    has_account: true,
    company_name: "Company",
    first_name: "Jonh",
    last_name: "Doe",
    phone: "+111 111111 111111",
    metadata: null,
    default_billing_address_id: null,
    default_shipping_address_id: null,
    addresses: null,
    groups: null,
    created_by: null,
    created_at: "2025-04-25T07:25:48.791Z",
    updated_at: "2025-04-25T07:25:48.791Z",
    deleted_at: null,
  },
};

export default () => <СustomerCreatedEmailComponent {...mockInvite} />;
