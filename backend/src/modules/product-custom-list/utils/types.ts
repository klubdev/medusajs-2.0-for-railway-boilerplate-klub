import { ModulesSdkUtils } from "@medusajs/framework/utils"
import { FlagSettings } from "@medusajs/framework/feature-flags"

export type PgConnectionType = ReturnType<typeof ModulesSdkUtils.createPgConnection>;
export const IndexEngineFeatureFlag: FlagSettings = {
    key: "index_engine",
    default_val: false,
    env_key: "MEDUSA_FF_INDEX_ENGINE",
    description: "Enable Medusa to use the index engine in some part of the core",
}