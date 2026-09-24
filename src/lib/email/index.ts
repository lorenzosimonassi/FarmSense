import nodemailer from "nodemailer"

const port = Number(process.env.SMTP_PORT ?? 1025)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port,
  secure: port === 465,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
})

type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "FarmSense <nao-responda@farmsense.local>",
    to,
    subject,
    html,
    text,
  })
}
