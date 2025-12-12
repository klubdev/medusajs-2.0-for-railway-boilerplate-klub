import { MedusaService } from "@medusajs/framework/utils"
import { InvoiceConfig } from "./models/invoice-config";
import { Invoice } from "./models/invoice";
import PdfPrinter from "pdfmake"
import { InferTypeOf, OrderDTO, OrderLineItemDTO, PaymentCollectionDTO } from "@medusajs/framework/types"

const fonts = {
  Courier: {
    normal: 'Courier',
    bold: 'Courier-Bold',
    italics: 'Courier-Oblique',
    bolditalics: 'Courier-BoldOblique'
  },
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
  Times: {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic'
  },
  Symbol: {
    normal: 'Symbol'
  },
  ZapfDingbats: {
    normal: 'ZapfDingbats'
  }
}


const printer = new PdfPrinter(fonts)

type GeneratePdfParams = {
  order: OrderDTO & {
    payment_collections: PaymentCollectionDTO;
  }
  items: OrderLineItemDTO[]
}

export interface InvoiceConfig {
  company_name: string
  company_logo: string
  company_address: string
  company_phone: string
  company_email: string
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

    // Generate new content
    const pdfContent = Object.keys(invoice.pdfContent).length ?
      invoice.pdfContent :
      await this.createInvoiceContent(params, invoice)

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

  private async createInvoiceContent(
    params: GeneratePdfParams,
    invoice: InferTypeOf<typeof Invoice>
  ): Promise<Record<string, any>> {
    // Get invoice configuration
    const invoiceConfigs = await this.listInvoiceConfigs()
    const config: Partial<InvoiceConfig> = invoiceConfigs[0] || {}

    // Create table for order items
    const itemsTable = [
      [
        { text: 'Variant Name', style: 'tableHeader' },
        { text: 'SKU', style: 'tableHeader' },
        { text: 'Quantity', style: 'tableHeader' },
        { text: 'Unit Price', style: 'tableHeader' },
        { text: 'Total', style: 'tableHeader' }
      ],
      ...(await Promise.all(params.items?.map(async item => [
        { text: item.variant_title || 'Unknown name', style: 'tableRow' },
        { text: item.variant_sku || 'Unknown SKU', style: 'tableRow' },
        { text: item.quantity.toString(), style: 'tableRow' },
        {
          text: await this.formatAmount(
            item.unit_price,
            params.order.currency_code
          ), style: 'tableRow'
        },
        {
          text: await this.formatAmount(
            Number(item.original_total),
            params.order.currency_code
          ), style: 'tableRow'
        }
      ])))
    ]

    const payment = params.order?.payment_collections[0];
    const invoiceId = `#${params.order.display_id.toString()}`
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const orderDate = new Date(params.order.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // return the PDF content structure
    return {
      pageSize: 'A4',
      pageMargins: [20, 60, 20, 60],
      header: {
        margin: [20, 20, 30, 20],
        columns: [
          /** Company Logo */
          {
            width: '*',
            stack: [
              ...(config.company_logo ? [
                {
                  image: await this.imageUrlToBase64(config.company_logo),
                  width: 80,
                  height: 40,
                  fit: [80, 40],

                }
              ] : [])
            ]
          },
          /** Invoice Title */
          {
            width: 'auto',
            stack: [
              {
                text: invoiceId,
                style: 'invoiceTitle',
                alignment: 'right'
              }
            ]
          }
        ]
      },
      content: [
        {
          margin: [0, 20, 0, 0],
          columns: [
            /** Company Details */
            {
              width: '*',
              stack: [
                config.company_name && {
                  text: config.company_name,
                  style: 'companyName',
                  margin: [0, 0, 0, 4]
                },
                config.company_address && {
                  text: config.company_address,
                  style: 'companyAddress',
                  margin: [0, 0, 0, 4]
                },
                config.company_phone && {
                  text: config.company_phone,
                  style: 'companyContact',
                  margin: [0, 0, 0, 4]
                },
                config.company_email && {
                  text: config.company_email,
                  style: 'companyContact',
                  margin: [0, 0, 0, 4]
                }
              ]
            },
            /** Invoice Details */
            {
              width: 'auto',
              table: {
                widths: [80, 120],
                body: [
                  [
                    { text: 'Order ID:', style: 'label' },
                    {
                      text: invoiceId,
                      style: 'value'
                    }
                  ],
                  [
                    { text: 'Invoice Date:', style: 'label' },
                    { text: invoiceDate, style: 'value' }
                  ],
                  [
                    { text: 'Order Date:', style: 'label' },
                    { text: orderDate, style: 'value' }
                  ],
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
                  text: 'Billing address',
                  style: 'sectionHeader',
                  margin: [0, 20, 0, 8]
                },
                {
                  text: params.order.billing_address ?
                    `${params.order.billing_address.first_name || ''} ${params.order.billing_address.last_name || ''}
                    ${params.order.billing_address.address_1 || ''}${params.order.billing_address.address_2 ? `\n${params.order.billing_address.address_2}` : ''}
                    ${params.order.billing_address.city || ''}, ${params.order.billing_address.province || ''} ${params.order.billing_address.postal_code || ''}
                    ${params.order.billing_address.country_code || ''}${params.order.billing_address.phone ? `\n${params.order.billing_address.phone}` : ''}` :
                    'No billing address provided',
                  style: 'addressText'
                }
              ]
            },
            {
              width: '*',
              stack: [
                {
                  text: 'Shipping address',
                  style: 'sectionHeader',
                  margin: [0, 20, 0, 8]
                },
                {
                  text: params.order.shipping_address ?
                    `${params.order.shipping_address.first_name || ''} ${params.order.shipping_address.last_name || ''}
                    ${params.order.shipping_address.address_1 || ''} ${params.order.shipping_address.address_2 ? `\n${params.order.shipping_address.address_2}` : ''}
                    ${params.order.shipping_address.city || ''}, ${params.order.shipping_address.province || ''} ${params.order.shipping_address.postal_code || ''}
                    ${params.order.shipping_address.country_code || ''}${params.order.shipping_address.phone ? `\n${params.order.shipping_address.phone}` : ''}` :
                    'No shipping address provided',
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
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: itemsTable
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return (rowIndex === 0) ? '#e5e7eb' : null;
            },
            hLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 0.5 : 0.3;
            },
            vLineWidth: function (i: number, node: any) {
              return 0.3;
            },
            hLineColor: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? '#e5e7eb' : '#e5e7eb';
            },
            vLineColor: function () {
              return '#e5e7eb';
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
                    { text: 'Subtotal (excl. shipping):', style: 'totalLabel' },
                    {
                      text: await this.formatAmount(
                        Number(params.order?.original_item_total || 0),
                        params.order.currency_code),
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Discount:', style: 'totalLabel' },
                    {
                      text: await this.formatAmount(
                        Number(params.order?.discount_total || 0),
                        params.order.currency_code),
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Shipping Costs:', style: 'totalLabel' },
                    {
                      text: await this.formatAmount(
                        Number(params.order?.shipping_total || 0),
                        params.order.currency_code),
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Taxes included in price:', style: 'totalLabel' },
                    {
                      text: await this.formatAmount(
                        Number(params.order?.tax_total || 0),
                        params.order.currency_code),
                      style: 'totalValue'
                    }
                  ],
                  [
                    { text: 'Total:', style: 'totalLabel' },
                    {
                      text: await this.formatAmount(
                        Number(params.order?.total || 0),
                        params.order.currency_code),
                      style: 'totalValue'
                    }
                  ]
                ]
              },
              layout: {
                fillColor: function (rowIndex: number) {
                  return null;
                },
                hLineWidth: function (i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? 0.5 : 0.3;
                },
                vLineWidth: function () {
                  return 0.3;
                },
                hLineColor: function (i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? '#e5e7eb' : '#e5e7eb';
                },
                vLineColor: function () {
                  return '#e5e7eb';
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
          text: '\n'
        },
        /** Payments */
        {
          columns: [
            {
              width: 'auto',
              margin: [0, 20, 0, 0],
              stack: [
                { text: 'Payment status', style: 'totalLabelLine', margin: [0, 0, 8, 4] },
                { text: 'Payment method', style: 'totalLabelLine', margin: [0, 0, 8, 4] },
                { text: 'Transaction date', style: 'totalLabelLine', margin: [0, 0, 8, 4] },
                { text: 'Total Paid:', style: 'totalLabelLine', margin: [0, 0, 8, 4] },
              ]
            },
            {
              width: 'auto',
              margin: [0, 20, 0, 0],
              stack: [
                {
                  text: payment?.status || 'no status',
                  style: 'totalValue',
                  margin: [0, 0, 0, 4]
                },
                {
                  text: payment?.payments[0]?.provider_id
                    ? await this.getPaymentInfo(
                      payment?.payments[0]?.provider_id
                    )
                    : "default payment system",
                  style: 'totalValue',
                  margin: [0, 0, 0, 4]
                },
                {
                  text: payment?.payments[0]?.created_at ?
                    new Date(payment?.payments[0]?.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'no transaction date',
                  style: 'totalValue',
                  margin: [0, 0, 0, 4]
                },
                {
                  text: await this.formatAmount(
                    Number(payment?.payments[0]?.amount || 0),
                    payment?.payments[0]?.currency_code),
                  style: 'totalValue',
                  margin: [0, 0, 0, 4]
                }
              ]
            }
          ]
        },
        /** Notes Section */
        ...(config.notes ? [
          {
            text: 'Notes',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            text: config.notes,
            style: 'notesText',
            margin: [0, 0, 0, 20]
          }
        ] : []),
        {
          text: 'Thank you for your purchases!',
          style: 'thankYouText',
          alignment: 'center',
          margin: [0, 30, 0, 0]
        },
        {
          text: 'For questions about this invoice, please contact us!',
          style: 'notesText',
          alignment: 'center',
          margin: [0, 10, 0, 0]
        }
      ],
      styles: {
        companyName: {
          fontSize: 11,
          italics: true,
          bold: true,
          lineHeight: 1.3,
          color: '#2B2E43'
        },
        companyAddress: {
          fontSize: 11,
          color: '#2B2E43',
          lineHeight: 1.3
        },
        companyContact: {
          fontSize: 11,
          bold: true,
          color: '#2B2E43',
          lineHeight: 1.3
        },
        invoiceTitle: {
          fontSize: 24,
          bold: true,
          color: '#2B2E43'
        },
        label: {
          fontSize: 10,
          color: 'B9BACE',
          margin: [0, 0, 8, 0]
        },
        value: {
          fontSize: 10,
          bold: true,
          color: '#2B2E43'
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: '#2B2E43',
          backgroundColor: '#e5e7eb',
          padding: [8, 12]
        },
        addressText: {
          fontSize: 10,
          color: '#2B2E43',
          lineHeight: 1.3
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: '#2B2E43',
          fillColor: '#e5e7eb'
        },
        tableRow: {
          fontSize: 9,
          color: '#2B2E43'
        },
        totalLabelLine: {
          fontSize: 10,
          bold: false,
          color: '#2B2E43'
        },
        totalLabel: {
          fontSize: 10,
          bold: true,
          color: '#2B2E43'
        },
        contentLabel: {
          fontSize: 10,
          bold: false,
          color: '#e5e7eb'
        },
        totalValue: {
          fontSize: 10,
          bold: true,
          color: '#2B2E43'
        },
        notesText: {
          fontSize: 10,
          color: '#2B2E43',
          italics: false,
          lineHeight: 1.2
        },
        smallText: {
          fontSize: 5,
          color: '#2B2E43',
          italics: false,
          lineHeight: 1
        },
        thankYouText: {
          fontSize: 12,
          color: '#2B2E43',
          italics: true
        }
      },
      defaultStyle: {
        font: 'Times'
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


  private async getPaymentInfo(type: string) {
    const items = {
      pp_stripe_stripe: "Credit card",
      "pp_stripe-klarna_stripe": "Klarna",
      "pp_stripe-paypal_stripe": "PayPal",
      "pp_stripe-ideal_stripe": "iDeal",
      "pp_stripe-bancontact_stripe": "Bancontact",
      pp_system_default: "Manual Payment",
    };

    return items[type] || "Default";
  }
}

export default InvoiceGeneratorService