import { Resend } from "resend";

// Email transaccional (recuperar contraseña) vía Resend — sin
// RESEND_API_KEY configurada, el resto de la app sigue funcionando igual,
// solo esta capa queda inactiva (mismo criterio que ANTHROPIC_API_KEY, ver
// apps/api/.env.example): se loguea el enlace en la consola del servidor
// en vez de fallar, útil también para probar el flujo en desarrollo sin
// cuenta de Resend.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend exige un dominio propio verificado para enviar a cualquier
// destinatario; sin eso, el remitente de sandbox (onboarding@resend.dev)
// solo entrega a la dirección de la cuenta de Resend — suficiente para
// probar, no para producción real con miles de usuarios. Configurable acá
// para no tener que tocar código cuando se verifique un dominio propio.
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "Evolving Mind <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY no configurada — no se envió el email. Enlace de recuperación:", resetUrl);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Recuperá tu contraseña — Evolving Mind",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #20242b;">
          <h2 style="margin-bottom: 4px;">Recuperá tu contraseña</h2>
          <p>Pediste restablecer tu contraseña en Evolving Mind. Si no fuiste vos, podés ignorar este email — tu contraseña actual sigue siendo válida.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="display:inline-block; background:#19D9FF; color:#06101F; padding:12px 22px; border-radius:10px; text-decoration:none; font-weight:bold;">
              Elegir nueva contraseña
            </a>
          </p>
          <p style="color:#6b7078; font-size:13px;">Este enlace vence en 1 hora. Si el botón no funciona, copiá y pegá esta URL en tu navegador:<br>${resetUrl}</p>
        </div>
      `,
    });
    if (error) {
      console.error("Resend devolvió un error al enviar el email de recuperación:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error enviando email de recuperación:", err);
    return false;
  }
}
