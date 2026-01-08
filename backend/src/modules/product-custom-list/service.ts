
import { AbstractFileProviderService } from '@medusajs/framework/utils';
import { PgConnectionType } from "./utils/types"
import { inClause } from "./helpers"

type InjectedDependencies = {
    __pg_connection__: PgConnectionType,
}

export default class ProductCustomListService extends AbstractFileProviderService {
    protected pgConnection: PgConnectionType;

    constructor({ __pg_connection__ }: InjectedDependencies) {
        super()
        this.pgConnection = __pg_connection__
    }

    async getVariantsFilterValues(params?: {
        categoryIds?: string[] | string
        collectionIds?: string[] | string
    }): Promise<Record<string, string[]> | null> {
        const categoryIds = params?.categoryIds
            ? (Array.isArray(params.categoryIds) ? params.categoryIds : [params.categoryIds])
            : []

        const collectionIds = params?.collectionIds
            ? (Array.isArray(params.collectionIds) ? params.collectionIds : [params.collectionIds])
            : []

        const qb = this.pgConnection("product as p")
            .leftJoin("product_variant as pv", "pv.product_id", "p.id")
            .leftJoin("product_variant_option as pvo", "pvo.variant_id", "pv.id")
            .leftJoin("product_option_value as pov", "pvo.option_value_id", "pov.id")
            .leftJoin("product_option as po", "po.id", "pov.option_id")
            .where("p.status", "published")
            .whereNotNull("pov.value")
            .whereNull("pv.deleted_at")
            .andWhere("pov.value", "!=", "default")

        // collection filter
        if (collectionIds.length) {
            qb.whereIn("p.collection_id", collectionIds)
        }

        // category filter (pivot table)
        if (categoryIds.length) {
            qb.leftJoin("product_category_product as pcp", "pcp.product_id", "p.id")
                .whereIn("pcp.product_category_id", categoryIds)
        }

        const rows = await qb
            .select(this.pgConnection.raw(`po.title AS option_label, ARRAY_AGG(DISTINCT pov.value ORDER BY pov.value) FILTER (WHERE pov.value IS NOT NULL) AS option_values`))
            .groupBy("po.title")
            .havingRaw("po.title IS NOT NULL")
            .orderBy("po.title")

        if (!rows?.length) return null

        const result: Record<string, string[]> = {}
        for (const r of rows as any[]) {
            const label = r.option_label as string | null
            const values = (r.option_values ?? []) as (string | null)[]
            if (!label) continue

            result[label] = values
                .filter((v): v is string => !!v && v !== "default")
                .map((v) => v.trim())
        }

        return Object.keys(result).length ? result : null
    }

    async getProductMetadataFilterValues(
        fields: string[] = ["color", "package", "season", "year"],
        params?: {
            categoryIds?: string[] | string
            collectionIds?: string[] | string
        }
    ): Promise<Record<string, string[]> | null> {
        const safeFields = Array.from(new Set(fields.map((f) => f.trim()).filter(Boolean)))
            .filter((f) => /^[a-zA-Z0-9_-]+$/.test(f))

        if (safeFields.length === 0) return null

        const categoryIds = params?.categoryIds
            ? (Array.isArray(params.categoryIds) ? params.categoryIds : [params.categoryIds])
            : []

        const collectionIds = params?.collectionIds
            ? (Array.isArray(params.collectionIds) ? params.collectionIds : [params.collectionIds])
            : []

        const selects: string[] = []
        const bindings: any[] = []

        for (const f of safeFields) {
            const subParts: string[] = []
            const subBinds: any[] = []

            subParts.push(`SELECT DISTINCT p.metadata ->> ? FROM product p`)
            subBinds.push(f)

            if (categoryIds.length) {
                subParts.push(`JOIN product_category_product pcp ON pcp.product_id = p.id`)
            }

            subParts.push(`WHERE p.status = 'published' AND p.metadata ->> ? IS NOT NULL`)
            subBinds.push(f)

            if (collectionIds.length) {
                subParts.push(` AND p.collection_id IN ${inClause(collectionIds, subBinds)}`)
            }

            if (categoryIds.length) {
                subParts.push(` AND pcp.product_category_id IN ${inClause(categoryIds, subBinds)}`)
            }

            selects.push(`ARRAY(${subParts.join("\n")}) AS "${f}"`)
            bindings.push(...subBinds)
        }

        const rows = await this.pgConnection.select(this.pgConnection.raw(selects.join(",\n"), bindings))

        if (!rows?.length) return null

        const row = rows[0] as any

        const result: Record<string, string[]> = {}
        for (const f of safeFields) {
            const arr = row?.[f]
            result[f] = Array.isArray(arr)
                ? arr.filter(Boolean).map((v: string) => String(v).trim())
                : []
        }

        const hasAnyValues = Object.values(result).some((arr) => arr.length > 0)
        return hasAnyValues ? result : null
    }

    async getPriceRange(params?: {
        categoryIds?: string[] | string
        collectionIds?: string[] | string
        currencyCode?: string
    }): Promise<{ min: number; max: number } | null> {
        const categoryIds = params?.categoryIds
            ? (Array.isArray(params.categoryIds) ? params.categoryIds : [params.categoryIds])
            : []

        const collectionIds = params?.collectionIds
            ? (Array.isArray(params.collectionIds) ? params.collectionIds : [params.collectionIds])
            : []

        const qb = this.pgConnection("product as p")
            .leftJoin("product_variant as pv", "pv.product_id", "p.id")
            .leftJoin("product_variant_price_set as pvps", "pvps.variant_id", "pv.id")
            .leftJoin("price as pr", "pr.price_set_id", "pvps.price_set_id")
            .where("p.status", "published")
            .whereNull("pv.deleted_at")
            .whereNotNull("pr.amount")

        if (params?.currencyCode) {
            qb.andWhere("pr.currency_code", params.currencyCode)
        }

        if (collectionIds.length) {
            qb.whereIn("p.collection_id", collectionIds)
        }

        if (categoryIds.length) {
            qb.leftJoin("product_category_product as pcp", "pcp.product_id", "p.id")
                .whereIn("pcp.product_category_id", categoryIds)
        }

        const row = (await qb
            .min({ min: "pr.amount" })
            .max({ max: "pr.amount" })
            .first()) as { min: string | number | null; max: string | number | null } | undefined

        if (!row || row.min == null || row.max == null) return null

        return { min: Number(row.min), max: Number(row.max) }
    }

    async mapOptionTitlesToOptionIdValue(
        optionByTitle: Record<string, string | string[]>
    ): Promise<{ option_id: string; value: string }[]> {
        const titles = Object.keys(optionByTitle).filter(Boolean)
        const values = Object.values(optionByTitle).filter(Boolean).flat(1)


        if (!titles.length || !values.length) return []

        // fetch option ids by title
        const rows = await this.pgConnection("product_option as po")
            .leftJoin("product_option_value as pov", "pov.option_id", "po.id")
            .distinct(["po.id as option_id", "pov.value"])
            .whereIn("title", titles)
            .whereIn('pov.value', values)
            .whereNull("po.deleted_at")
            .whereNotNull("pov.value");

        return rows;
    }
}