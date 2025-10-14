import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
// Import complete English messages for testing
import enMessages from "@/messages/en.json";

interface WrapperProps {
  children: ReactNode;
}

export function IntlWrapper({ children }: WrapperProps) {
  return (
    <NextIntlClientProvider messages={enMessages} locale="en">
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(ui: React.ReactElement) {
  return render(ui, {
    wrapper: IntlWrapper,
  });
}
