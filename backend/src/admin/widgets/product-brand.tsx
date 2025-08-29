// https://github.com/Betanoir/medusa-variant-images/blob/master/src/admin/VariantImages/WidgetSettingsModal.tsx

import { useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";

import {
  clx,
  Container,
  Heading,
  Text,
  Drawer,
  IconButton,
  Button,
  Select,
  Label,
  toast,
} from "@medusajs/ui";

import { EllipsisHorizontal } from "@medusajs/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk.js";

type Brand = {
  id: string;
  name: string;
};

type BrandsResponse = {
  brands: Brand[];
  count: number;
  limit: number;
  offset: number;
};

type AdminProductBrand = AdminProduct & {
  brand?: {
    id: string;
    name: string;
  };
};

const ProductBrandWidgetEdit = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const currBarndId = product?.brand?.id ?? null;

  const [open, setOpen] = useState(false);
  const [brandId, setBrandId] = useState(currBarndId);
  const queryClient = useQueryClient();

  const { data: dataBrands } = useQuery<{
    brands: BrandsResponse[];
    count: number;
  }>({
    queryKey: ["brands"],
    queryFn: () =>
      sdk.client.fetch("/admin/brands", {
        method: "GET",
      }),
  });

  const brands = dataBrands?.brands ?? [];

  const { mutateAsync: UpdateProductBrand, isPending: isUpdating } =
    useMutation({
      mutationFn: async (data: Record<string, any>) => {
        await sdk.client.fetch(`/admin/products/${product.id}`, {
          method: "POST",
          body: data,
        });
      },
    });

  const handleUpdate = async () => {
    try {
      await UpdateProductBrand({
        additional_data: {
          brand_id: brandId,
        },
      });

      toast.success("Brand added successfully");
      queryClient.invalidateQueries({
        queryKey: [["product-brands", product.id]],
      });
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update brand");
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <IconButton variant="transparent" size="small">
          <EllipsisHorizontal />
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Content aria-describedby={undefined}>
        <Drawer.Header>
          <Drawer.Title>Brand Settings</Drawer.Title>
        </Drawer.Header>

        <Drawer.Body>
          <Label htmlFor="name">Brand Name</Label>
          <div className="mt-2">
            <Select
              disabled={brands.length == 0}
              onValueChange={setBrandId}
              value={brandId}
            >
              <Select.Trigger>
                <Select.Value placeholder="Choose Brand" />
              </Select.Trigger>
              <Select.Content>
                {brands.map((brand) => (
                  <Select.Item key={brand?.id} value={brand?.id}>
                    {brand?.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Drawer.Close>
          <Button
            type="submit"
            variant="primary"
            onClick={handleUpdate}
            isLoading={isUpdating}
          >
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};

const ProductBrandWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const { data: queryResult, isLoading } = useQuery({
    queryFn: () =>
      sdk.admin.product.retrieve(product.id, {
        fields: "+brand.*",
      }),
    queryKey: [["product-brands", product.id]],
  });

  const brandName = (queryResult?.product as AdminProductBrand)?.brand?.name;

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-row justify-between items-center px-6 py-4">
        <Heading level="h2">Brand</Heading>
        {isLoading || <ProductBrandWidgetEdit data={queryResult?.product} />}
      </div>
      <div
        className={clx(
          `text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4`
        )}
      >
        {JSON.stringify(product.brand)}
        <Text size="small" weight="plus" leading="compact">
          Name
        </Text>
        <Text
          size="small"
          leading="compact"
          className="whitespace-pre-line text-pretty"
        >
          {brandName || "-"}
        </Text>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});

export default ProductBrandWidget;
