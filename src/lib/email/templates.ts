function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

type LayoutInput = {
  title: string
  intro: string
  buttonLabel: string
  url: string
  footer: string
}

function emailLayout({ title, intro, buttonLabel, url, footer }: LayoutInput) {
  const safeUrl = escapeHtml(url)

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f7f8f5;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#14170f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e1e4d6;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#173226;padding:24px 32px;">
                <span style="color:#f7f8f5;font-size:20px;font-weight:700;letter-spacing:-0.02em;">FarmSense</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${title}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#565d51;">${intro}</p>
                <a href="${safeUrl}" style="display:inline-block;background:#173226;color:#f7f8f5;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px;">
                  ${buttonLabel}
                </a>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#565d51;">
                  O link expira em 1 hora. Se o botão não funcionar, copie e cole este endereço no navegador:<br />
                  <a href="${safeUrl}" style="color:#2f5642;word-break:break-all;">${safeUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e1e4d6;font-size:12px;color:#8a8f7c;">${footer}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function firstName(name: string) {
  return escapeHtml(name.split(" ")[0] ?? name)
}

export function verifyEmailTemplate({ name, url }: { name: string; url: string }) {
  const html = emailLayout({
    title: "Confirme seu e-mail",
    intro: `Olá, ${firstName(name)}! Falta pouco para você começar a usar o FarmSense. Clique no botão abaixo para confirmar seu endereço de e-mail.`,
    buttonLabel: "Confirmar e-mail",
    url,
    footer: "Se você não criou uma conta no FarmSense, pode ignorar este e-mail.",
  })

  const text = `Olá, ${name}!\n\nConfirme seu e-mail no FarmSense acessando o link abaixo (expira em 1 hora):\n${url}\n\nSe você não criou uma conta, ignore este e-mail.`

  return { subject: "Confirme seu e-mail no FarmSense", html, text }
}

export function resetPasswordTemplate({ name, url }: { name: string; url: string }) {
  const html = emailLayout({
    title: "Redefina sua senha",
    intro: `Olá, ${firstName(name)}! Recebemos um pedido para redefinir a senha da sua conta no FarmSense. Clique no botão abaixo para escolher uma nova senha.`,
    buttonLabel: "Redefinir senha",
    url,
    footer: "Se você não pediu para redefinir sua senha, ignore este e-mail. Sua senha atual continua valendo.",
  })

  const text = `Olá, ${name}!\n\nPara redefinir sua senha no FarmSense, acesse o link abaixo (expira em 1 hora):\n${url}\n\nSe você não pediu isso, ignore este e-mail.`

  return { subject: "Redefina sua senha no FarmSense", html, text }
}
