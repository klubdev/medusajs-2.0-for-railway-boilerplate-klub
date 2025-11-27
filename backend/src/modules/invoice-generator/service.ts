import { MedusaService } from "@medusajs/framework/utils"
import { InvoiceConfig } from "./models/invoice-config";
import { Invoice } from "./models/invoice";
// @ts-ignore - pdfmake doesn't have type definitions
import PdfPrinter from "pdfmake"
import { InferTypeOf, OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types"

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
}

const printer = new PdfPrinter(fonts)

type GeneratePdfParams = {
  order: OrderDTO
  items: OrderLineItemDTO[]
}

export interface InvoiceConfig {
  company_name: string
  company_logo: string
  company_address: string
  company_phone: string
  company_email: string
  company_kvk?: string
  company_vat?: string
  notes?: string
}

class InvoiceGeneratorService extends MedusaService({
  InvoiceConfig,
  Invoice
}) {
  async generatePdf(params: GeneratePdfParams & {
    invoice_id: string
  }): Promise<Buffer> {
    const invoice = await this.retrieveInvoice(params.invoice_id)

    // Always regenerate content to ensure latest layout is used
    const pdfContent = await this.createInvoiceContent(params, invoice)

    await this.updateInvoices({
      id: invoice.id,
      pdfContent
    })

    // get PDF as a Buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const pdfDoc = printer.createPdfKitDocument(pdfContent as any)

      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      pdfDoc.on('error', err => reject(err));

      pdfDoc.end(); // Finalize PDF stream
    });
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const day = d.getDate()
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  }

  private async createInvoiceContent(
    params: GeneratePdfParams,
    invoice: InferTypeOf<typeof Invoice>
  ): Promise<Record<string, any>> {
    // Get invoice configuration
    const invoiceConfigs = await this.listInvoiceConfigs()
    const config: Partial<InvoiceConfig> = invoiceConfigs[0] || {}

    // Format invoice number as #80 instead of INV-000065
    const invoiceId = `#${invoice.display_id}`
    const invoiceDate = this.formatDate(invoice.created_at)
    const orderDate = this.formatDate(params.order.created_at)

    // Create table for order items with SKU and Description
    const itemsTable = [
      [
        { text: 'Item Name', style: 'tableHeader' },
        { text: 'Description', style: 'tableHeader' },
        { text: 'SKU', style: 'tableHeader' },
        { text: 'Quantity', style: 'tableHeader' },
        { text: 'Unit Price', style: 'tableHeader' },
        { text: 'Total', style: 'tableHeader' }
      ],
      ...(await Promise.all(params.items.map(async item => {
        // Safely access variant data (may not be typed in OrderLineItemDTO)
        const itemAny = item as any
        const variant = itemAny.variant
        const product = variant?.product
        const sku = variant?.sku || itemAny.variant_sku || item.variant_id || 'N/A'
        const description = item.title || 'Unknown Item'
        const itemName = product?.title || item.title || 'Unknown Item'
        
        return [
          { text: itemName, style: 'tableRow' },
          { text: description, style: 'tableRow' },
          { text: sku, style: 'tableRow' },
          { text: item.quantity.toString(), style: 'tableRow' },
          {
            text: await this.formatAmount(
              item.unit_price,
              params.order.currency_code
            ), style: 'tableRow'
          },
          {
            text: await this.formatAmount(
              Number(item.total),
              params.order.currency_code
            ), style: 'tableRow'
          }
        ]
      })))
    ]

    // Get payment information (may not be available on OrderDTO)
    const orderAny = params.order as any
    const paymentCollections = orderAny.payment_collections || []
    // Get first payment from first collection, or use collection itself
    const paymentCollection = paymentCollections[0] || {}
    const payments = paymentCollection.payments || []
    const payment = payments[0] || paymentCollection
    const paymentStatus = payment.status || paymentCollection.status || 'Captured'
    const paymentMethod = payment.provider_id || paymentCollection.payment_providers?.[0]?.id || 'N/A'
    const transactionDate = payment.created_at ? this.formatDate(payment.created_at) : (paymentCollection.created_at ? this.formatDate(paymentCollection.created_at) : orderDate)

    // Build company address with KvK and VAT
    const companyDetailsStack: any[] = []
    if (config.company_address) {
      companyDetailsStack.push({
        text: config.company_address,
        style: 'companyAddress',
        margin: [0, 0, 0, 4]
      })
    }
    if (config.company_kvk) {
      companyDetailsStack.push({
        text: `KvK (Chamber of Commerce) Number: ${config.company_kvk}`,
        style: 'companyContact',
        margin: [0, 0, 0, 4]
      })
    }
    if (config.company_vat) {
      companyDetailsStack.push({
        text: `VAT Number: ${config.company_vat}`,
        style: 'companyContact',
        margin: [0, 0, 0, 0]
      })
    }

    // Build billing address with email
    const billingAddress = params.order.billing_address
    const billingText = billingAddress
      ? `${billingAddress.first_name || ''} ${billingAddress.last_name || ''}${params.order.email ? `\n${params.order.email}` : ''}\n${billingAddress.address_1 || ''}${billingAddress.address_2 ? `\n${billingAddress.address_2}` : ''}\n${billingAddress.city || ''}, ${billingAddress.province || ''} ${billingAddress.postal_code || ''}\n${billingAddress.country_code || ''}${billingAddress.phone ? `\n${billingAddress.phone}` : ''}`
      : 'No billing address provided'

    // Build shipping address with company name
    const shippingAddress = params.order.shipping_address
    const shippingCompany = (shippingAddress as any)?.company || ''
    const shippingText = shippingAddress
      ? `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}${shippingCompany ? `\n${shippingCompany}` : ''}\n${shippingAddress.address_1 || ''}${shippingAddress.address_2 ? `\n${shippingAddress.address_2}` : ''}\n${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.postal_code || ''}\n${shippingAddress.country_code || ''}${shippingAddress.phone ? `\n${shippingAddress.phone}` : ''}`
      : 'No shipping address provided'

    // return the PDF content structure
    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          /** Company Logo and Name */
          {
            width: '*',
            stack: [
              ...(config.company_logo ? [
                {
                  image: await this.imageUrlToBase64(config.company_logo),
                  width: 100,
                  height: 50,
                  fit: [100, 50],
                  margin: [0, 0, 0, 10]
                }
              ] : []),
              {
                text: config.company_name || 'Your Company Name',
                style: 'companyName',
                margin: [0, 0, 0, 0]
              }
            ]
          },
          /** Invoice Number */
          {
            width: 'auto',
            stack: [
              {
                text: invoiceId,
                style: 'invoiceNumber',
                alignment: 'right',
                margin: [0, 0, 0, 0]
              }
            ]
          }
        ]
      },
      content: [
        /** Company Details */
        {
          margin: [0, 20, 0, 0],
          stack: [
            ...companyDetailsStack
          ]
        },
        {
          text: '\n'
        },
        /** Invoice and Order Details */
        {
          columns: [
            {
              width: '*',
              text: ''
            },
            {
              width: 'auto',
              table: {
                widths: [100, 150],
                body: [
                  [
                    { text: 'Invoice Number:', style: 'label' },
                    { text: invoiceId, style: 'value' }
                  ],
                  [
                    { text: 'Invoice Date:', style: 'label' },
                    { text: invoiceDate, style: 'value' }
                  ],
                  [
                    { text: 'Order Date:', style: 'label' },
                    { text: orderDate, style: 'value' }
                  ]
                ]
              },
              layout: 'noBorders',
              margin: [0, 0, 0, 20]
            }
          ]
        },
        {
          text: '\n'
        },
        /** Billing and Shipping Addresses */
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: 'Bill To',
                  style: 'sectionHeader',
                  margin: [0, 0, 0, 8]
                },
                {
                  text: billingText,
                  style: 'addressText'
                }
              ]
            },
            {
              width: '*',
              stack: [
                {
                  text: 'Ship To',
                  style: 'sectionHeader',
                  margin: [0, 0, 0, 8]
                },
                {
                  text: shippingText,
                  style: 'addressText'
                }
              ]
            }
          ]
        },
        {
          text: '\n\n'
        },
        /** Items Table */
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 'auto', 'auto', 'auto', 'auto'],
            body: itemsTable
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return (rowIndex === 0) ? '#f8f9fa' : null;
            },
            hLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3;
            },
            vLineWidth: function (i: number, node: any) {
              return 0.3;
            },
            hLineColor: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? '#cbd5e0' : '#e2e8f0';
            },
            vLineColor: function () {
              return '#e2e8f0';
            },
            paddingLeft: function () {
              return 8;
            },
            paddingRight: function () {
              return 8;
            },
            paddingTop: function () {
              return 6;
            },
            paddingBottom: function () {
              return 6;
            }
          }
        },
        {
          text: '\n'
        },
        /** Totals Section */
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                widths: ['auto', 'auto'],
                body: [
                  [
                    { text: 'Subtotal:', style: 'totalLabel' },
                    {
                      text: await this.formatAmount(
                        Number(params.order.subtotal),
                        params.order.currency_code),
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Shipping:', style: 'totalLabel' },
                    {
                      text: await this.formatAmount(
                        Number(params.order.shipping_methods?.[0]?.total || 0),
                        params.order.currency_code),
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: `Tax (${Math.round((Number(params.order.tax_total) / Number(params.order.subtotal)) * 100)}% VAT):`, style: 'totalLabel' },
                    {
                      text: await this.formatAmount(
                        Number(params.order.tax_total),
                        params.order.currency_code),
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Total:', style: 'totalLabelBold' },
                    {
                      text: await this.formatAmount(
                        Number(params.order.total),
                        params.order.currency_code),
                      style: 'totalValueBold'
                    }
                  ]
                ]
              },
              layout: {
                fillColor: function (rowIndex: number) {
                  return null;
                },
                hLineWidth: function (i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3;
                },
                vLineWidth: function () {
                  return 0.3;
                },
                hLineColor: function (i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? '#cbd5e0' : '#e2e8f0';
                },
                vLineColor: function () {
                  return '#e2e8f0';
                },
                paddingLeft: function () {
                  return 8;
                },
                paddingRight: function () {
                  return 8;
                },
                paddingTop: function () {
                  return 6;
                },
                paddingBottom: function () {
                  return 6;
                }
              }
            }
          ]
        },
        {
          text: '\n\n'
        },
        /** Payment Information */
        {
          table: {
            widths: ['auto', '*'],
            body: [
              [
                { text: 'Payment Status:', style: 'paymentLabel' },
                { text: paymentStatus, style: 'paymentValue' }
              ],
              [
                { text: 'Payment Method:', style: 'paymentLabel' },
                { text: paymentMethod, style: 'paymentValue' }
              ],
              [
                { text: 'Transaction Date:', style: 'paymentLabel' },
                { text: transactionDate, style: 'paymentValue' }
              ],
              [
                { text: 'Total Paid:', style: 'paymentLabel' },
                {
                  text: await this.formatAmount(
                    Number(params.order.total),
                    params.order.currency_code),
                  style: 'paymentValue'
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },
        {
          text: '\n\n'
        },
        /** Footer */
        {
          text: 'Thank you for your business!',
          style: 'thankYouText',
          alignment: 'center',
          margin: [0, 20, 0, 10]
        },
        {
          text: 'For questions about this invoice, please contact us.',
          style: 'footerText',
          alignment: 'center',
          margin: [0, 0, 0, 0]
        }
      ],
      styles: {
        companyName: {
          fontSize: 18,
          bold: true,
          color: '#000000',
          margin: [0, 0, 0, 5]
        },
        companyAddress: {
          fontSize: 10,
          color: '#000000',
          lineHeight: 1.4
        },
        companyContact: {
          fontSize: 10,
          color: '#000000',
          lineHeight: 1.4
        },
        invoiceNumber: {
          fontSize: 20,
          bold: true,
          color: '#000000'
        },
        label: {
          fontSize: 10,
          color: '#666666',
          margin: [0, 0, 8, 0]
        },
        value: {
          fontSize: 10,
          bold: true,
          color: '#000000'
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          color: '#000000',
          margin: [0, 0, 0, 0]
        },
        addressText: {
          fontSize: 10,
          color: '#000000',
          lineHeight: 1.4
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: '#000000',
          fillColor: '#f5f5f5'
        },
        tableRow: {
          fontSize: 9,
          color: '#000000'
        },
        totalLabel: {
          fontSize: 10,
          color: '#000000'
        },
        totalValue: {
          fontSize: 10,
          color: '#000000'
        },
        totalLabelBold: {
          fontSize: 10,
          bold: true,
          color: '#000000'
        },
        totalValueBold: {
          fontSize: 10,
          bold: true,
          color: '#000000'
        },
        paymentLabel: {
          fontSize: 10,
          color: '#666666'
        },
        paymentValue: {
          fontSize: 10,
          color: '#000000'
        },
        thankYouText: {
          fontSize: 12,
          color: '#28a745',
          italics: true
        },
        footerText: {
          fontSize: 9,
          color: '#666666'
        }
      },
      defaultStyle: {
        font: 'Helvetica'
      }
    }
  }

  private async formatAmount(amount: number, currency: string): Promise<string> {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  private async imageUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = response.headers.get("content-type") || "image/png"

    return `data:${mimeType};base64,${base64}`
  }
}

export default InvoiceGeneratorService