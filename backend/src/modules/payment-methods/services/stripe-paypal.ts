import StripeCore from "../core/stripe-core"
import { PaymentIntentOptions, PaymentProviderKeysExtended } from "../types"

class StripePayPalProviderService extends StripeCore {
    static identifier = PaymentProviderKeysExtended.PAYPAL

    constructor(_, options) {
        super(_, options)
    }

    get paymentIntentOptions(): PaymentIntentOptions {
        return {
            payment_method_types: ["paypal"],
            capture_method: "automatic",
        }
    }
}

export default StripePayPalProviderService