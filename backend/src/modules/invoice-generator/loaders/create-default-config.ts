import {
  LoaderOptions,
  IMedusaInternalService,
} from "@medusajs/framework/types"
import { InvoiceConfig } from "../models/invoice-config"

export default async function createDefaultConfigLoader({
  container,
}: LoaderOptions) {
  const service: IMedusaInternalService<
    typeof InvoiceConfig
  > = container.resolve("invoiceConfigService")

  const [_, count] = await service.listAndCount()

  if (count > 0) {
    return
  }

  await service.create({
    company_name: "Bon Beau Joli",
    company_address: "Bloemendaalseweg 139 2061 CH Bloemendaal The Netherlands",
    company_phone: "",
    company_email: "info@bonbeaujoli.com",
  })
}