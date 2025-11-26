import Stripe from "stripe";

export type StripeOptions = {
    apiKey: string
    webhookSecret: string
    capture?: boolean
    automaticPaymentMethods?: boolean
    paymentDescription?: string
}

export type StripeIndeterminateState = {
    indeterminate_due_to: string
}

export const ErrorCodes = {
    PAYMENT_INTENT_UNEXPECTED_STATE: "payment_intent_unexpected_state",
}

export const ErrorIntentStatus = {
    SUCCEEDED: "succeeded",
    CANCELED: "canceled",
}

export type StripeErrorData = Stripe.PaymentIntent | StripeIndeterminateState
export type HandledErrorType =
    | { retry: true }
    | { retry: false; data: StripeErrorData }


export interface PaymentIntentOptions {
    capture_method?: "automatic" | "manual"
    setup_future_usage?: "on_session" | "off_session"
    payment_method_types?: string[]
    payment_method_options?: {
        oxxo?: {
            expires_after_days?: number
        }
    }
}

export const PaymentProviderKeysExtended = {
  PAYPAL: "stripe-paypal",
  KLARNA: "stripe-klarna"
}