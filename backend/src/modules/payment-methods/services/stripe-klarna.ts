import StripeCore from "../core/stripe-core"
import { PaymentIntentOptions, PaymentProviderKeysExtended } from "../types"

class StripeKlarnaProviderService extends StripeCore {
    static identifier = PaymentProviderKeysExtended.KLARNA

    constructor(_, options) {
        super(_, options)
    }

    get paymentIntentOptions(): PaymentIntentOptions {
        return {
            payment_method_types: ["klarna"],
            capture_method: "automatic",
        }
    }
}

export default StripeKlarnaProviderService