import {
  Text,
  Container,
  Heading,
  Html,
  Section,
  Tailwind,
  Head,
  Preview,
  Body,
  Link,
  Button,
} from "@react-email/components";

import { Base } from "./base";

/**
 * The key for the UserResetPassword template, used to identify it
 */
export const PASSWORD_RESET = "password-reset";

/**
 * The props for the UserResetPasswordProps template
 */
export interface UserResetPasswordProps {
  email: string;
  reset_url?: string;
  preview?: string;
}

export const isResetPasswordData = (
  data: any
): data is UserResetPasswordProps =>
  typeof data.email === "string" &&
  typeof data.reset_url === "string" &&
  (typeof data.preview === "string" || !data.preview);

/**
 * The UserResetPassword template component built with react-email
 */
export const UserResetPasswordTemplate = ({
  email,
  reset_url,
  preview = `Customer reset password link is generated...`,
}: UserResetPasswordProps) => {
  return (
    <Base preview={preview}>
      <Section className="mt-[32px]">
        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
          Reset Your Password
        </Heading>
      </Section>

      <Section className="my-[32px]">
        <Text className="text-black text-[14px] leading-[24px]">
          Hello{email ? ` ${email}` : ""},
        </Text>
        <Text className="text-black text-[14px] leading-[24px]">
          We received a request to reset your password. Click the button below
          to create a new password for your account.
        </Text>
      </Section>

      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
          href={reset_url}
        >
          Reset Password
        </Button>
      </Section>

      <Section className="my-[32px]">
        <Text className="text-black text-[14px] leading-[24px]">
          Or copy and paste this URL into your browser:
        </Text>
        <Link
          href={reset_url}
          className="text-blue-600 no-underline text-[14px] leading-[24px] break-all"
        >
          {reset_url}
        </Link>
      </Section>

      <Section className="my-[32px]">
        <Text className="text-[#666666] text-[12px] leading-[24px]">
          This password reset link will expire soon for security reasons.
        </Text>
        <Text className="text-[#666666] text-[12px] leading-[24px] mt-2">
          If you didn't request a password reset, you can safely ignore this
          email. Your password will remain unchanged.
        </Text>
      </Section>

      <Section className="mt-[32px] pt-[20px] border-t border-solid border-[#eaeaea]">
        <Text className="text-[#666666] text-[12px] leading-[24px]">
          For security reasons, never share this reset link with anyone. If
          you're having trouble with the button above, copy and paste the URL
          into your web browser.
        </Text>
      </Section>
    </Base>
  );
};

UserResetPasswordTemplate.PreviewProps = {
  email: "customer@email.com",
  reset_url:
    "/account/reset-password?token=yu9YbYT4kh5JKjYjSCrhKEwBj9t8M2ZzcBtDqFA4oYLMuMogbBbXcq2BA9qwKPuK&email=customer@email.com",
} as UserResetPasswordProps;

export default UserResetPasswordTemplate;
