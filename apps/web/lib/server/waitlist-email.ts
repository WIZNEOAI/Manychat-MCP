import { Resend } from "resend";

/**
 * Confirmation email for the Revenue Operator waitlist.
 * Palette mirrors the Operator Terminal tokens in app/globals.css so the email
 * and the landing read as one surface. Inline styles only — mail clients
 * discard <style> blocks and every class with it.
 */
const FROM = "Revenue Operator <noreply@wizneo.org>";
const APP_URL = process.env.PUBLIC_APP_URL ?? "https://manychat.wizneo.org";

const INK = "#0c0d0f";
const SURFACE = "#14161a";
const TEXT = "#e8ecea";
const MUTED = "#8a938e";
const ACCENT = "#2de2c0";
const BORDER = "rgba(232,236,234,0.10)";

function buildHtml(name?: string): string {
  const greeting = name ? `Hola ${name},` : "Hola,";
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${SURFACE};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
        <tr><td style="padding:14px 24px;border-bottom:1px solid ${BORDER};">
          <span style="font-family:ui-monospace,'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">revenue operator</span>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          <p style="margin:0 0 20px;font-family:ui-monospace,'JetBrains Mono',monospace;font-size:13px;color:${ACCENT};">&gt; waitlist --join &nbsp;<span style="color:${MUTED};">ok</span></p>
          <h1 style="margin:0 0 16px;font-family:'Geist','Segoe UI',sans-serif;font-size:26px;line-height:1.25;font-weight:600;color:${TEXT};">Estás en la lista.</h1>
          <p style="margin:0 0 16px;font-family:'Geist','Segoe UI',sans-serif;font-size:15px;line-height:1.65;color:${TEXT};">${greeting}</p>
          <p style="margin:0 0 16px;font-family:'Geist','Segoe UI',sans-serif;font-size:15px;line-height:1.65;color:${TEXT};">
            Revenue Operator conecta tus agentes a ManyChat y al resto de tu stack, con la política de mensajería de Meta codificada en el server — para que un agente no pueda mandar algo que te queme la cuenta.
          </p>
          <p style="margin:0 0 24px;font-family:'Geist','Segoe UI',sans-serif;font-size:15px;line-height:1.65;color:${MUTED};">
            Te escribo en cuanto abramos acceso. Si querés adelantarte, respondé este correo contándome qué querés automatizar — leo todas.
          </p>
          <a href="${APP_URL}/docs" style="display:inline-block;background:${ACCENT};color:${INK};font-family:'Geist','Segoe UI',sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px;">Ver la documentación</a>
        </td></tr>
        <tr><td style="padding:18px 24px;border-top:1px solid ${BORDER};">
          <p style="margin:0;font-family:'Geist','Segoe UI',sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
            Ulises Arellano · <a href="https://wizneo.org" style="color:${MUTED};text-decoration:underline;">WIZNEO</a><br>
            No afiliado a ManyChat.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(name?: string): string {
  return [
    name ? `Hola ${name},` : "Hola,",
    "",
    "Estás en la lista de Revenue Operator.",
    "",
    "Revenue Operator conecta tus agentes a ManyChat y al resto de tu stack, con la política de mensajería de Meta codificada en el server — para que un agente no pueda mandar algo que te queme la cuenta.",
    "",
    "Te escribo en cuanto abramos acceso. Si querés adelantarte, respondé este correo contándome qué querés automatizar.",
    "",
    `Documentación: ${APP_URL}/docs`,
    "",
    "Ulises Arellano · WIZNEO",
    "No afiliado a ManyChat.",
  ].join("\n");
}

/** Never throws: a failed confirmation must not lose the captured lead. */
export async function sendWaitlistConfirmation(
  to: string,
  name?: string,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_WIZNEO_API_KEY ?? process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "missing_api_key" };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Estás en la lista — Revenue Operator",
      html: buildHtml(name),
      text: buildText(name),
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "unknown" };
  }
}
