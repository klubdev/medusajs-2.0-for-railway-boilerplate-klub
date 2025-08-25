import { defineMiddlewares, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http";
import { PostBundledProductsSchema } from "./admin/bundled-products/route";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { PostCartsBundledLineItemsSchema } from "./store/carts/[id]/line-item-bundles/route";
import { PostAdminCreateBrand } from "./admin/brands/validators"
import { z } from "zod";

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
        validateAndTransformQuery(createFindParams(), {
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
          createFindParams(),
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
    }
  ]
})