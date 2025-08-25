import { defineRouteConfig } from "@medusajs/admin-sdk";
import { TagSolid } from "@medusajs/icons";
import {
  Container,
  Heading,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  useDataTable,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk.js";
import { useMemo, useState } from "react";
import CreateBrand from "../../components/create-brand.js";

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

const columnHelper = createDataTableColumnHelper<Brand>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
];

const limit = 15;

const BrandsPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });

  const offset = useMemo(() => {
    return pagination.pageIndex * limit;
  }, [pagination]);

  const { data, isLoading } = useQuery<{
    brands: BrandsResponse[];
    count: number;
  }>({
    queryKey: ["brands", offset, limit],
    queryFn: () =>
      sdk.client.fetch("/admin/brands", {
        method: "GET",
        query: {
          limit,
          offset,
        },
      }),
  });

  const table = useDataTable({
    columns,
    data: data?.brands ?? [],
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    rowCount: data?.count ?? 0,
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>Brands</Heading>
          <CreateBrand />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
});

export default BrandsPage;
