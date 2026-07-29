const resendEndpoint = 'https://api.resend.com/emails'

const configuredAppUrl = () => String(process.env.PUBLIC_APP_URL || '').trim().replace(/\/+$/, '')

const requestOrigin = (request) => {
  const forwardedProto = String(request.headers?.['x-forwarded-proto'] || '').split(',')[0].trim()
  const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = String(request.headers?.['x-forwarded-host'] || request.headers?.host || '').split(',')[0].trim()
  return host ? `${protocol}://${host}` : ''
}

export const buildPasswordResetUrl = (request, token) => {
  const configuredOrigin = configuredAppUrl()
  if (process.env.NODE_ENV === 'production' && !configuredOrigin) {
    throw new Error('PUBLIC_APP_URL is not configured.')
  }
  const origin = configuredOrigin || requestOrigin(request)
  if (!origin) throw new Error('PUBLIC_APP_URL is not configured.')
  return `${origin}/reset-password?token=${encodeURIComponent(token)}`
}

export const isPasswordResetEmailConfigured = () => Boolean(
  String(process.env.EMAIL__RESENDAPIKEY || '').trim() &&
  String(process.env.EMAIL__FROM || '').trim(),
)

export const sendPasswordResetEmail = async ({ email, resetUrl, idempotencyKey, lifetimeMinutes = 15 }) => {
  const apiKey = String(process.env.EMAIL__RESENDAPIKEY || '').trim()
  const from = String(process.env.EMAIL__FROM || '').trim()
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Password reset email is not configured.')
    }
    return { delivered: false }
  }

  const response = await fetch(resendEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'User-Agent': 'opmwiki-password-reset/1.0',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Đặt lại mật khẩu OPM Strongest Wiki',
      text: [
        'Bạn vừa yêu cầu đặt lại mật khẩu OPM Strongest Wiki.',
        `Mở liên kết sau trong vòng ${lifetimeMinutes} phút: ${resetUrl}`,
        'Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.',
      ].join('\n\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a">
          <h2>Đặt lại mật khẩu</h2>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu OPM Strongest Wiki.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#42c9f5;color:#061019;text-decoration:none;font-weight:700">Đặt lại mật khẩu</a></p>
          <p>Liên kết có hiệu lực trong ${lifetimeMinutes} phút và chỉ dùng được một lần.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
        </div>`,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Resend returned ${response.status}: ${detail.slice(0, 300)}`)
  }
  return { delivered: true }
}
