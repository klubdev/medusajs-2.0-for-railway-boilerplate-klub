import {
  Text,
  Container,
  Heading,
  Section,
  Link,
  Hr,
  Button,
} from "@react-email/components";
import { Base } from "../layout/base";

type UserInvitedEmailProps = {
  invite_url: string;
  email?: string;
  preview?: string;
};

function UserInvitedEmailComponent({
  invite_url,
  email,
  preview = "You've been invited to join our platform",
}: UserInvitedEmailProps) {
  return (
    <Base preview={preview}>
      <Container className="px-2 text-center">
        <Heading className="font-times text-4xl font-normal tracking-wider text-center text-[#263A56]">
          Set up your account
        </Heading>
        <Hr className="border-black/20" />
      </Container>

      <Container className="px-2 text-center">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base m-0 text-center">
            Hello {email ? ` ${email}` : ""},
          </Text>
          <Text className="text-[#263A56] text-base mt-4 mb-10 text-center">
            You've been invited to join the Bon Beau Joli family. Click the
            button below to accept your invitation and set up your account.
          </Text>
          <Link
            className="bg-[#263A56] text-[#FCF9F3] text-base font-normal no-underline text-center px-5 py-3"
            href={invite_url}
          >
            Accept Invitation
          </Link>
        </Section>
      </Container>

      <Container className="px-2 mt-6 text-center">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base text-center m-0">
            Or copy and paste this URL into your browser:
          </Text>
          <Text className="text-[#6a96c6] text-base text-center m-0">{invite_url}</Text>
          <Text className="text-[#263A56] text-base text-center my-5">
            If you weren't expecting this invitation, you can ignore this email.
          </Text>
        </Section>
      </Container>
    </Base>
  );
}

export const userInvitedEmail = (props: UserInvitedEmailProps) => (
  <UserInvitedEmailComponent {...props} />
);

// Mock data for preview/development
const mockInvite: UserInvitedEmailProps = {
  invite_url: "https://your-app.com/app/invite/sample-token-123",
  email: "user@example.com",
};

export default () => <UserInvitedEmailComponent {...mockInvite} />;
