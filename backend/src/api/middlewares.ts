import { defineMiddlewares, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http";
import { PostBundledProductsSchema } from "./admin/bundled-products/route";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { PostCartsBundledLineItemsSchema } from "./store/carts/[id]/line-item-bundles/route";
import { PostAdminCreateBrand } from "./admin/brands/validators"

import { CreateQuote, GetQuoteParams } from "./admin/quotes/validators";
import { listAdminQuoteQueryConfig } from "./admin/quotes/query-config";
import { AdminGetQuoteParams } from "./admin/quotes/validators";
import { listStoreQuoteQueryConfig } from "./store/customers/me/quotes/query-config";
import { PostInvoiceConfgSchema } from "./admin/invoice-config/route"

import { z } from "zod";

export const GetBrandsSchema = createFindParams()
export const GetBundleProductsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/bundled-products",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(PostBundledProductsSchema),
      ],
    },
    {
      matcher: "/admin/bundled-products",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetBundleProductsSchema, {
          defaults: [
            "id",
            "title",
            "product.*",
            "items.*",
            "items.product.*",
          ],
          isList: true,
          defaultLimit: 15,
        }),
      ],
    },
    {
      matcher: "/store/carts/:id/line-item-bundles",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(PostCartsBundledLineItemsSchema)
      ],
    },
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateBrand),
      ],
    },
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetBrandsSchema,
          {
            defaults: [
              "id",
              "name",
              "products.*",
            ],
            isList: true,
          }
        ),
      ],

    },
    {
      matcher: "/admin/products",
      method: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me/quotes",
      middlewares: [
        validateAndTransformBody(CreateQuote),
      ],
    },
    {
      matcher: "/store/customers/me/quotes*",
      middlewares: [
        validateAndTransformQuery(GetQuoteParams, listStoreQuoteQueryConfig),
      ],
    },
    {
      matcher: "/admin/quotes*",
      middlewares: [
        validateAndTransformQuery(
          AdminGetQuoteParams,
          listAdminQuoteQueryConfig
        ),
      ],
    },
    {
      matcher: "/admin/invoice-config",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(PostInvoiceConfgSchema)
      ]
    }
  ]
})