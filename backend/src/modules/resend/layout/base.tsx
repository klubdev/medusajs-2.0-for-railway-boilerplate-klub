import { Container } from "@medusajs/ui";
import {
  Html,
  Section,
  Text,
  pixelBasedPreset,
  Tailwind,
  Head,
  Img,
  Hr,
  Link,
  Preview,
  Body,
} from "@react-email/components";

interface BaseProps {
  preview?: string;
  children: React.ReactNode;
}

export const Base: React.FC<BaseProps> = ({ preview, children }) => {
  return (
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
        theme: {
          extend: {
            fontFamily: {
              times: ['"Times New Roman"', "Times", "serif"],
              helvetica: ["Helvetica", "Arial", "sans-serif"],
            },
          },
        },
      }}
    >
      <Html className="font-times bg-white">
        <Head />
        <Preview>{preview}</Preview>
        <Body className="bg-white my-10 mx-auto">
          {/* Header */}
          <Container className="w-full mx-auto max-w-2xl">
            <Container className="px-2">
              <Section className="text-center px-2">
                <Img
                  src="https://d3k81ch9hvuctc.cloudfront.net/company/WNVq9E/images/01e8fa0e-8abd-4e3a-9027-dd9dab6af42b.png"
                  className="w-44 mx-auto"
                />
              </Section>
              <Section className="px-2 my-4 text-center">
                <Img
                  src="https://d3k81ch9hvuctc.cloudfront.net/company/WNVq9E/images/efa4765c-8fb6-4c3a-9378-0640e420e9a8.jpeg"
                  className="w-full h-auto mt-auto"
                />
              </Section>
            </Container>
            {children}

            <Container className="px-2">
              <Section className="text-center">
                <Text className="text-base italic font-normal">
                  Love, <br />
                  The Bon Beau Joli family
                </Text>
              </Section>
            </Container>
            {/* Footer */}
            <Container className="px-2">
              <Hr className="py-4 border-black/60" />
              <Section className="px-2 my-2 text-center">
                <Link
                  href="https://www.instagram.com/bon.beau.joli"
                  target="_blank"
                  className="mx-1 w-5 h-5"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                      fill="#263A56"
                    />
                  </svg>
                </Link>
                <Link
                  href="mail:info@bonbeaujoli.com"
                  target="_blank"
                  className="mx-1 w-5 h-5"
                >
                  <svg
                    height="20px"
                    width="20px"
                    viewBox="0 0 512 512"
                    fill="none"
                  >
                    <path
                      d="M510.678,112.275c-2.308-11.626-7.463-22.265-14.662-31.054c-1.518-1.915-3.104-3.63-4.823-5.345 c-12.755-12.818-30.657-20.814-50.214-20.814H71.021c-19.557,0-37.395,7.996-50.21,20.814c-1.715,1.715-3.301,3.43-4.823,5.345 C8.785,90.009,3.63,100.649,1.386,112.275C0.464,116.762,0,121.399,0,126.087V385.92c0,9.968,2.114,19.55,5.884,28.203 c3.497,8.26,8.653,15.734,14.926,22.001c1.59,1.586,3.169,3.044,4.892,4.494c12.286,10.175,28.145,16.32,45.319,16.32h369.958 c17.18,0,33.108-6.145,45.323-16.384c1.718-1.386,3.305-2.844,4.891-4.43c6.27-6.267,11.425-13.741,14.994-22.001v-0.064 c3.769-8.653,5.812-18.171,5.812-28.138V126.087C512,121.399,511.543,116.762,510.678,112.275z M46.509,101.571 c6.345-6.338,14.866-10.175,24.512-10.175h369.958c9.646,0,18.242,3.837,24.512,10.175c1.122,1.129,2.179,2.387,3.112,3.637 L274.696,274.203c-5.348,4.687-11.954,7.002-18.696,7.002c-6.674,0-13.276-2.315-18.695-7.002L43.472,105.136 C44.33,103.886,45.387,102.7,46.509,101.571z M36.334,385.92V142.735L176.658,265.15L36.405,387.435 C36.334,386.971,36.334,386.449,36.334,385.92z M440.979,420.597H71.021c-6.281,0-12.158-1.651-17.174-4.552l147.978-128.959 l13.815,12.018c11.561,10.046,26.028,15.134,40.36,15.134c14.406,0,28.872-5.088,40.432-15.134l13.808-12.018l147.92,128.959 C453.137,418.946,447.26,420.597,440.979,420.597z M475.666,385.92c0,0.529,0,1.051-0.068,1.515L335.346,265.221L475.666,142.8 V385.92z"
                      fill="#263A56"
                    />
                  </svg>
                </Link>
                <Link
                  href="https://www.instagram.com/bon.beau.joli/"
                  target="_blank"
                  className="mx-1 w-5 h-5"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                      fill="#263A56"
                    />
                  </svg>
                </Link>
              </Section>
              <Section className="px-2 my-4 text-center">
                <Text className="text-[#263A56] text-sm my-1">
                  Bon Beau Joli
                </Text>
                <Text className="text-[#263A56] text-sm my-1">
                  © {new Date().getFullYear()}
                </Text>
                <Text className="text-[#263A56] text-sm my-1">
                  All rights reserved.
                </Text>
                <Link
                  className="text-[#355f94] no-underline text-sm break-all"
                  target="_blank"
                  href="https://bonbeaujoli.com/"
                >
                  Visit our store
                </Link>
              </Section>
              <Section className="px-2 my-8 text-center">
                <Img
                  src="https://d3k81ch9hvuctc.cloudfront.net/company/WNVq9E/images/72fa3f7f-d1bf-4c65-86c0-01479c18bbd8.jpeg"
                  className="w-full h-auto mt-auto"
                />
              </Section>
            </Container>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};
