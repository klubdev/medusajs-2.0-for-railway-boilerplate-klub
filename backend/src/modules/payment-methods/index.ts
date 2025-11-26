import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import {
  StripePayPalProviderService,
  StripeKlarnaProviderService
} from "./services"

const services = [
  StripePayPalProviderService,
  StripeKlarnaProviderService,
]

export default ModuleProvider(Modules.PAYMENT, {
  services,
})