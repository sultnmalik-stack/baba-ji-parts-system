import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { to, subject, message, invoiceNumber, pdfBase64 } = req.body

    if (!to) {
      return res.status(400).json({ error: 'Customer email is required' })
    }

    const payload = {
      from: 'Baba Ji Parts <onboarding@resend.dev>',
      to: [to],
      subject: subject || `Invoice ${invoiceNumber || ''}`,
      text: message,
    }

    if (pdfBase64) {
      payload.attachments = [
        {
          filename: `${invoiceNumber || 'invoice'}.pdf`,
          content: pdfBase64,
        },
      ]
    }

    const { data, error } = await resend.emails.send(payload)

    if (error) {
      return res.status(400).json({ error })
    }

    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}