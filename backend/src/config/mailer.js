import nodemailer from "nodemailer";

// Transporte SMTP para las notificaciones de pedidos. Con Gmail: SMTP_HOST=smtp.gmail.com,
// SMTP_PORT=465, SMTP_USER=tu-cuenta@gmail.com, SMTP_PASS=contraseña de aplicación
// (myaccount.google.com/apppasswords, no la contraseña normal de la cuenta).
export const mailerConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export const transporter = mailerConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT) !== 587, // 465 = SSL directo, 587 = STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;
