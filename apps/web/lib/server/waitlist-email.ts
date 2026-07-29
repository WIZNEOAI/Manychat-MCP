import { Resend } from "resend";

/**
 * Confirmation email for the Revenue Operator waitlist.
 * Palette mirrors the Operator Terminal tokens in app/globals.css and the
 * terminal chrome of components/waitlist-form.tsx, so the inbox and the landing
 * read as one surface. Inline styles only — mail clients discard <style> blocks
 * and every class with it — and tables for layout, because Outlook has no
 * flexbox or grid.
 */
const FROM = "Revenue Operator <noreply@wizneo.org>";
const APP_URL = process.env.PUBLIC_APP_URL ?? "https://manychat.wizneo.org";

const INK = "#0c0d0f";
const SURFACE = "#14161a";
const CHROME = "#16191e";
const TEXT = "#e8ecea";
const MUTED = "#8a938e";
const ACCENT = "#2de2c0";
const ACCENT_INK = "#04130f";
const BORDER = "rgba(232,236,234,0.10)";

const SANS = "'Geist','Avenir Next','Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,'JetBrains Mono','SFMono-Regular',Consolas,monospace";

/** The name is operator-supplied input; it must never reach the markup raw. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** One rail per line, echoing the `→` prefix the landing uses for output. */
const RAILS = [
  "Un solo server entre tus agentes y ManyChat.",
  "La política de mensajería de Meta, validada antes de enviar.",
] as const;

function railRow(text: string, last: boolean): string {
  const pad = last ? "0" : "11px";
  // Two cells, not a prefix character: keeps the wrapped second line aligned
  // with the first instead of sliding back under the arrow.
  return `<tr>
                  <td valign="top" width="20" style="width:20px;padding:0 0 ${pad};font-family:${MONO};font-size:14px;line-height:1.6;color:${ACCENT};">&rarr;</td>
                  <td valign="top" style="padding:0 0 ${pad};font-family:${SANS};font-size:14px;line-height:1.6;color:${TEXT};">${text}</td>
                </tr>`;
}

function buildHtml(name?: string): string {
  const greeting = name ? `Hola ${escapeHtml(name)},` : "Hola,";
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- Tells Apple Mail / iOS / Outlook the email is already dark, so they skip
     their own inversion pass and the palette survives forced dark mode. -->
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Estás en la lista</title>
</head>
<body style="margin:0;padding:0;background-color:${INK};color:${TEXT};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${INK};font-size:1px;line-height:1px;">Quedaste anotado. Te escribo en cuanto abramos acceso.&#8203;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK}" style="background-color:${INK};">
    <tr><td align="center" bgcolor="${INK}" style="padding:32px 12px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${SURFACE}" style="max-width:600px;background-color:${SURFACE};border:1px solid ${BORDER};border-radius:14px;">

        <!-- terminal chrome: same three dots + label as the landing form -->
        <tr><td bgcolor="${CHROME}" style="padding:13px 20px;background-color:${CHROME};border-bottom:1px solid ${BORDER};border-radius:14px 14px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="font-family:${MONO};font-size:13px;line-height:1;letter-spacing:0.14em;">
                <span style="color:${ACCENT};">&#9679;</span><span style="color:#6b7280;">&#9679;</span><span style="color:#3f4650;">&#9679;</span>
              </td>
              <td align="right" style="font-family:${MONO};font-size:10px;line-height:1;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">early access</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:34px 28px 8px;">
          <p style="margin:0 0 6px;font-family:${MONO};font-size:13px;line-height:1.5;color:${MUTED};">
            <span style="color:rgba(232,236,234,0.35);">$</span> operator waitlist --join
          </p>
          <p style="margin:0 0 22px;font-family:${MONO};font-size:13px;line-height:1.5;color:${ACCENT};">
            &rarr; ok &middot; registro confirmado
          </p>

          <h1 style="margin:0 0 20px;font-family:${SANS};font-size:32px;line-height:1.15;letter-spacing:-0.02em;font-weight:600;color:${TEXT};">Estás en la lista.</h1>

          <p style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:1.7;color:${TEXT};">${greeting}</p>
          <p style="margin:0 0 24px;font-family:${SANS};font-size:16px;line-height:1.7;color:${TEXT};">
            Revenue Operator conecta tus agentes a ManyChat y al resto de tu stack, con la política de mensajería de Meta codificada en el server — para que un agente no pueda mandar algo que te queme la cuenta.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CHROME}" style="background-color:${CHROME};border-left:2px solid ${ACCENT};border-radius:0 8px 8px 0;">
            <tr><td style="padding:16px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${RAILS.map((rail, i) => railRow(rail, i === RAILS.length - 1)).join("\n                ")}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 28px 34px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" bgcolor="${ACCENT}" style="border-radius:9px;">
              <a href="${APP_URL}/docs" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:15px;line-height:1;font-weight:600;color:${ACCENT_INK};text-decoration:none;border-radius:9px;">Ver la documentación &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:20px 0 0;font-family:${SANS};font-size:14px;line-height:1.7;color:${MUTED};">
            Te escribo en cuanto abramos acceso. Si querés adelantarte, respondé este correo contándome qué querés automatizar — leo todas.
          </p>
        </td></tr>

        <tr><td bgcolor="${CHROME}" style="padding:18px 28px 22px;background-color:${CHROME};border-top:1px solid ${BORDER};border-radius:0 0 14px 14px;">
          <p style="margin:0 0 8px;font-family:${SANS};font-size:13px;line-height:1.6;color:${TEXT};">
            Ulises Arellano &middot; <a href="https://wizneo.org" style="color:${ACCENT};text-decoration:none;">WIZNEO</a>
          </p>
          <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.65;color:${MUTED};">
            Recibís este correo porque te anotaste en la lista de espera de Revenue Operator.<br>
            Proyecto independiente. No afiliado a ManyChat.
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
    "$ operator waitlist --join",
    "→ ok · registro confirmado",
    "",
    "ESTÁS EN LA LISTA.",
    "",
    name ? `Hola ${name},` : "Hola,",
    "",
    "Revenue Operator conecta tus agentes a ManyChat y al resto de tu stack, con la política de mensajería de Meta codificada en el server — para que un agente no pueda mandar algo que te queme la cuenta.",
    "",
    ...RAILS.map((rail) => `→ ${rail}`),
    "",
    `Ver la documentación: ${APP_URL}/docs`,
    "",
    "Te escribo en cuanto abramos acceso. Si querés adelantarte, respondé este correo contándome qué querés automatizar — leo todas.",
    "",
    "—",
    "Ulises Arellano · WIZNEO · https://wizneo.org",
    "Recibís este correo porque te anotaste en la lista de espera de Revenue Operator.",
    "Proyecto independiente. No afiliado a ManyChat.",
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

/** Exported for preview/rendering scripts and tests. Not part of the send path. */
export const __emailInternals = { buildHtml, buildText, escapeHtml };
