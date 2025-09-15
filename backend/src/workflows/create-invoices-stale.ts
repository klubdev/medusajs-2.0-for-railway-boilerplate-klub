import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateInvoicesStep } from "./steps/update-invoices"
import { InvoiceStatus } from "../modules/invoice-generator/models/invoice"

type CreateWorkflowInvoicesStaleInput = {
  order_id: string
}

export const createInvoicesStaleWorkflow: ReturnType<typeof createWorkflow> =
  createWorkflow(
    "create-invoices-stale",
    (input: CreateWorkflowInvoicesStaleInput) => {
      const updatedInvoices = updateInvoicesStep({
        selector: {
          order_id: input.order_id
        },
        data: {
          status: InvoiceStatus.STALE
        }
      })

      return new WorkflowResponse({
        invoices: updatedInvoices
      })
    }
  )