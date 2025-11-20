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

type PasswordResetEmailProps = {
  reset_url: string;
  email?: string;
  preview?: string;
};

function PasswordResetEmailComponent({
  reset_url,
  email,
  preview = "Reset your password",
}: PasswordResetEmailProps) {
  return (
    <Base preview={preview}>
      <Container className="px-2">
        <Heading className="font-times text-4xl font-normal tracking-wider text-center text-[#263A56]">
          Reset Your Password
        </Heading>
        <Hr className="border-black/20" />
      </Container>

      <Container className="px-2">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base m-0">
            Hello {email ? ` ${email}` : ""},
          </Text>
          <Text className="text-[#263A56] text-base mt-4 mb-10">
            We received a request to reset your password. Click the button below
            to create a new password for your account.
          </Text>
          <Link
            className="bg-[#263A56] text-[#FCF9F3] text-base font-normal no-underline text-center px-5 py-3"
            href={reset_url}
          >
            Reset Password
          </Link>
        </Section>
      </Container>

      <Container className="px-2 mt-6">
        <Section className="my-2 text-center">
          <Text className="text-[#263A56] text-base m-0">
            Or copy and paste this URL into your browser:
          </Text>
          <Text className="text-[#6a96c6] text-base m-0">{reset_url}</Text>
          <Text className="text-[#263A56] text-base my-5">
            This password reset link will expire soon for security reasons.{" "}
            <br /> If you didn't request a password reset, you can safely ignore
            this email. <br /> Your password will remain unchanged.
          </Text>
          <Text className="text-[#263A56] text-base my-5 italic">
            For security reasons, never share this reset link with anyone.{" "}
            <br />
            If you're having trouble with the button above, copy and paste the
            URL into your web browser.
          </Text>
        </Section>
      </Container>
    </Base>
  );
}

export const passwordResetEmail = (props: PasswordResetEmailProps) => (
  <PasswordResetEmailComponent {...props} />
);

// Mock data for preview/development
const mockPasswordReset: PasswordResetEmailProps = {
  reset_url:
    "https://your-app.com/account/reset-password?token=sample-reset-token-123",
  email: "user@example.com",
};

export default () => <PasswordResetEmailComponent {...mockPasswordReset} />;
