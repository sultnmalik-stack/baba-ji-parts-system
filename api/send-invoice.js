import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#000',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logo: {
    fontSize: 34,
    fontWeight: 900,
    lineHeight: 0.9,
  },
  company: {
    fontSize: 8,
    textAlign: 'right',
    lineHeight: 1.3,
    fontWeight: 700,
  },
  grid3: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  box: {
    flex: 1,
    border: '1px solid #000',
    padding: 5,
    minHeight: 48,
  },
  boxTitle: {
    fontSize: 8,
    fontWeight: 900,
    marginBottom: 3,
  },
  wide: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  th: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    padding: 3,
    fontSize: 7,
    fontWeight: 900,
    textAlign: 'center',
  },
  td: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    padding: 3,
    fontSize: 7,
    minHeight: 20,
  },
  bottom: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  terms: {
    flex: 1.3,
    border: '1px solid #000',
    padding: 5,
    fontSize: 6,
    lineHeight: 1.2,
  },
  totalsWrap: {
    flex: 1,
  },
  totals: {
    flexDirection: 'row',
    gap: 4,
  },
  totalBox: {
    flex: 1,
    border: '1px solid #000',
    textAlign: 'center',
  },
  totalTitle: {
    backgroundColor: '#eee',
    borderBottomWidth: 1,
    borderColor: '#000',
    padding: 3,
    fontSize: 7,
    fontWeight: 900,
    textAlign: 'center',
  },
  totalValue: {
    padding: 5,
    fontSize: 9,
    fontWeight: 900,
    textAlign: 'center',
  },
  sign: {
    marginTop: 18,
    fontSize: 8,
    fontWeight: 900,
    textAlign: 'center',
  },
})

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function InvoicePdf({ invoice, items }) {
  const safeItems = items || []

  const emptyRows = Array.from({
    length: Math.max(6 - safeItems.length, 0),
  })

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', orientation: 'landscape', style: styles.page },
      React.createElement(
        View,
        { style: styles.top },
        React.createElement(Text, { style: styles.logo }, 'BABA JI\nPARTS'),
        React.createElement(
          Text,
          { style: styles.company },
          `MELBOURNE AUTO WRECKING PTY LTD TRADING AS BABA JI PARTS
ACN 672 278 063   ABN 30 672 278 063
82 HORNE STREET, CAMPBELLFIELD, VIC, 3061
TEL: 03 9359 2061   MOB: 0430 099 873
sales@babajipartsmelb.com.au
www.babajipartsmelb.com.au
Bank details - BSB: 083004   Account number: 932633780`
        )
      ),

      React.createElement(
        View,
        { style: styles.grid3 },
        React.createElement(
          View,
          { style: styles.box },
          React.createElement(Text, { style: styles.boxTitle }, 'Customer'),
          React.createElement(
            Text,
            null,
            `${invoice.customer_name || ''}
${invoice.customer_phone || ''}
${invoice.customer_email || ''}
${invoice.customer_address || ''}`
          )
        ),
        React.createElement(
          View,
          { style: styles.box },
          React.createElement(Text, { style: styles.boxTitle }, 'Deliver To'),
          React.createElement(
            Text,
            null,
            `${invoice.delivery_address || 'Pickup / Delivery TBC'}

PLEASE NOTE THAT PRICES ARE SUBJECT TO CHANGE WITHOUT NOTICE.`
          )
        ),
        React.createElement(
          View,
          { style: styles.box },
          React.createElement(Text, { style: styles.boxTitle }, 'Invoice Info'),
          React.createElement(
            Text,
            null,
            `Inv No: ${invoice.invoice_number || ''}
Date: ${invoice.date || ''}
Time: ${invoice.time || ''}
Pay Type: ${invoice.payment_method || 'TBC'}
Status: ${invoice.payment_status || 'Unpaid'}`
          )
        )
      ),

      React.createElement(
        View,
        { style: styles.wide },
        React.createElement(
          View,
          { style: styles.box },
          React.createElement(Text, { style: styles.boxTitle }, 'Note'),
          React.createElement(Text, null, invoice.note || '')
        ),
        React.createElement(
          View,
          { style: styles.box },
          React.createElement(Text, { style: styles.boxTitle }, 'Payment'),
          React.createElement(
            Text,
            null,
            `Paid: ${money(invoice.amount_paid)}
Balance: ${money(invoice.balance_due)}`
          )
        )
      ),

      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.row },
          ['Line No', 'Location', 'Part Number', 'Description', 'Ordered', 'B.O.', 'Supplied', 'Unit List', 'Unit Net', 'GST Code', 'Total'].map((h, i) =>
            React.createElement(
              Text,
              {
                key: h,
                style: [
                  styles.th,
                  {
                    width:
                      i === 3
                        ? '24%'
                        : i === 0
                          ? '6%'
                          : i >= 4 && i <= 6
                            ? '7%'
                            : '8%',
                    borderRightWidth: i === 10 ? 0 : 1,
                  },
                ],
              },
              h
            )
          )
        ),

        safeItems.map((item, index) =>
          React.createElement(
            View,
            { key: index, style: styles.row },
            [
              index + 1,
              item.location || '',
              item.part_number || '',
              item.description || '',
              item.quantity || 1,
              item.qty_bo || 0,
              item.qty_supplied || 1,
              money(item.unit_price),
              money(item.unit_price),
              item.gst_code || 'GST',
              money(item.total),
            ].map((cell, i) =>
              React.createElement(
                Text,
                {
                  key: i,
                  style: [
                    styles.td,
                    {
                      width:
                        i === 3
                          ? '24%'
                          : i === 0
                            ? '6%'
                            : i >= 4 && i <= 6
                              ? '7%'
                              : '8%',
                      borderRightWidth: i === 10 ? 0 : 1,
                    },
                  ],
                },
                String(cell)
              )
            )
          )
        ),

        emptyRows.map((_, rowIndex) =>
          React.createElement(
            View,
            { key: `empty-${rowIndex}`, style: styles.row },
            Array.from({ length: 11 }).map((_, i) =>
              React.createElement(Text, {
                key: i,
                style: [
                  styles.td,
                  {
                    width:
                      i === 3
                        ? '24%'
                        : i === 0
                          ? '6%'
                          : i >= 4 && i <= 6
                            ? '7%'
                            : '8%',
                    borderRightWidth: i === 10 ? 0 : 1,
                  },
                ],
              })
            )
          )
        )
      ),

      React.createElement(
        View,
        { style: styles.bottom },
        React.createElement(
          Text,
          { style: styles.terms },
          'Please Note: No return on electrical parts. No return on special orders. Engines and gearboxes must be checked before fitting. No labour claims accepted. Parts must be inspected before installation. Deposits may be non-refundable. Warranty applies only where expressly stated on invoice.'
        ),
        React.createElement(
          View,
          { style: styles.totalsWrap },
          React.createElement(
            View,
            { style: styles.totals },
            [
              ['Sub-Total', invoice.subtotal],
              ['Freight', invoice.freight],
              ['Rounding', invoice.rounding],
              ['GST', invoice.gst],
              ['TOTAL', invoice.total],
            ].map(([label, value]) =>
              React.createElement(
                View,
                { key: label, style: styles.totalBox },
                React.createElement(Text, { style: styles.totalTitle }, label),
                React.createElement(Text, { style: styles.totalValue }, money(value))
              )
            )
          ),
          React.createElement(
            Text,
            { style: styles.sign },
            'Please sign here ____________________________________________'
          )
        )
      )
    )
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { to, subject, message, invoiceNumber, invoice, items } = req.body

    if (!to) {
      return res.status(400).json({ error: 'Customer email is required' })
    }

    const invoicePayload = {
      ...(invoice || {}),
      invoice_number: invoiceNumber || invoice?.invoice_number || '',
    }

    const pdfBuffer = await pdf(
      React.createElement(InvoicePdf, {
        invoice: invoicePayload,
        items: items || [],
      })
    ).toBuffer()

    const { data, error } = await resend.emails.send({
      from: 'Baba Ji Parts <onboarding@resend.dev>',
      to: [to],
      subject: subject || `Invoice ${invoiceNumber || ''}`,
      text: message || '',
      attachments: [
        {
          filename: `${invoiceNumber || 'invoice'}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    })

    if (error) {
      return res.status(400).json({ error })
    }

    return res.status(200).json({
      success: true,
      attached: true,
      pdfLength: pdfBuffer.length,
      data,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}