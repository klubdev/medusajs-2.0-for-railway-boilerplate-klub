import { z } from "zod";

import {
  createFindParams,
} from "@medusajs/medusa/api/utils/validators";

export const AdminGetQuoteParams = createFindParams({
  limit: 15,
  offset: 0,
})
  .strict();

export type GetQuoteParamsType = z.infer<typeof GetQuoteParams>;
export const GetQuoteParams = createFindParams({
  limit: 15,
  offset: 0,
})

export type CreateQuoteType = z.infer<typeof CreateQuote>;
export const CreateQuote = z
  .object({
    cart_id: z.string(),
  })
  .strict();