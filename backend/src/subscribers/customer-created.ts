import { INotificationModuleService, ICustomerModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

export default async function customerCreatedHandler({
    event: { data },
    container,
}: SubscriberArgs<any>) {
    const notificationModuleService: INotificationModuleService = container.resolve(
        Modules.NOTIFICATION,
    )

    const customerId = data.id
    const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
    const customer = await customerModuleService.retrieveCustomer(customerId)

    try {
        await notificationModuleService.createNotifications({
            to: customer?.email,
            channel: 'email',
            template: 'customer-created',
            data: {
                emailOptions: {
                    replyTo: 'development@kreatifklub.com',
                    subject: "New customer created at Bon Beau Joli!"
                },
                customer: customer,
                preview: 'Welcome to the Bon Beau Joli family...'
            }
        })
    } catch (error) {
        console.error(error)
    }
}

export const config: SubscriberConfig = {
    event: "customer.created",
}