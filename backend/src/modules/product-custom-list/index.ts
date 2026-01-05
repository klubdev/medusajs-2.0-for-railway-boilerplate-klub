import ProductCustomListService from "./service"
import { Module } from "@medusajs/framework/utils"

export const STORE_PRODUCT_CUSTOM_LIST_SERVICE = "productCustomListService"

export default Module(STORE_PRODUCT_CUSTOM_LIST_SERVICE, {
    service: ProductCustomListService,
})