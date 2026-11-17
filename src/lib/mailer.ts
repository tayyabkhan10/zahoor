import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { CURRENCY, STORE_NAME } from "./config";
import { paymentLabel } from "./policy";
import { formatMoney } from "./pricing";

type MailOrder = {
  orderNumber: string;
  paymentMethod: string;
  customerName: string;
  phone: string;
  whatsapp: string | null;
  altPhone: string | null;
  email: string | null;
  address: string;
  city: string;
  notes: string | null;
  subtotalCents: number;
  deliveryCents: number;
  totalCents: number;
  createdAt: Date;
  items: { productName: string; colorName: string; sizeName: string; quantity: number; unitPriceCents: number; imageUrl: string | null }[];
};

let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.warn("[mail] SMTP_USER / SMTP_PASS not set. Order emails are skipped.");
    transporter = null;
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass: pass.replace(/\s+/g, "") }, // Gmail shows app passwords with spaces
  });
  return transporter;
}

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DARK = "#2a2d33";
const MUTED = "#6c7078";
const LINE = "#e3e5e8";
const SOFT = "#f4f5f6";

function itemRows(order: MailOrder) {
  return order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};width:64px;vertical-align:top;">
          ${
            item.imageUrl
              ? `<img src="${esc(item.imageUrl)}" width="56" height="56" alt="" style="display:block;border-radius:6px;object-fit:cover;background:${SOFT};" />`
              : ""
          }
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid ${LINE};vertical-align:top;">
          <div style="font-size:14px;font-weight:600;color:${DARK};">${esc(item.productName)}</div>
          <div style="font-size:12px;color:${MUTED};margin-top:3px;">${esc(item.colorName)}${item.sizeName ? ` &middot; Size ${esc(item.sizeName)}` : ""} &middot; Qty ${item.quantity}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};text-align:right;vertical-align:top;font-size:14px;font-weight:600;color:${DARK};white-space:nowrap;">
          ${formatMoney(item.unitPriceCents * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");
}

function totalsRows(order: MailOrder) {
  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:6px 0;font-size:${strong ? 16 : 14}px;color:${strong ? DARK : MUTED};${strong ? "font-weight:700;" : ""}">${label}</td>
      <td style="padding:6px 0;text-align:right;font-size:${strong ? 16 : 14}px;color:${DARK};${strong ? "font-weight:700;" : ""}">${value}</td>
    </tr>`;
  return (
    row("Subtotal", formatMoney(order.subtotalCents)) +
    row("Delivery", order.deliveryCents === 0 ? "Free" : formatMoney(order.deliveryCents)) +
    `<tr><td colspan="2" style="border-top:1px solid ${LINE};height:6px;"></td></tr>` +
    row(`Total (${paymentLabel(order.paymentMethod).toLowerCase()})`, formatMoney(order.totalCents), true)
  );
}

function layout(title: string, preheader: string, body: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${SOFT};font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr><td style="background:${DARK};padding:24px 32px;text-align:center;">
          <div style="font-family:Orbitron,Arial,sans-serif;font-size:22px;letter-spacing:4px;color:#ffffff;font-weight:700;">${STORE_NAME}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;color:${DARK};">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:20px 32px;background:${SOFT};text-align:center;font-size:12px;color:${MUTED};line-height:1.6;">
          &copy; ${new Date().getFullYear()} ${STORE_NAME}. All prices are in ${CURRENCY}.<br/>
          This is an automated message about your order.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function customerHtml(order: MailOrder) {
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
  const orderLink = siteUrl ? `${siteUrl}/order/${order.orderNumber}` : null;
  const steps = [
    "Our team calls or messages you to confirm your order.",
    "Your order is packed and dispatched to your address.",
    "Pay in cash when the parcel arrives.",
  ];
  const body = `
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">
      Hi ${esc(order.customerName.split(" ")[0] ?? order.customerName)}, thank you for shopping with ${STORE_NAME}. We have received your order and it is being processed.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT};border-radius:8px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <div style="font-size:11px;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Order number</div>
        <div style="font-size:20px;font-weight:700;color:${DARK};margin-top:4px;">${esc(order.orderNumber)}</div>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(order)}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">${totalsRows(order)}</table>

    <h2 style="margin:28px 0 8px;font-size:15px;color:${DARK};">Delivery details</h2>
    <p style="margin:0;font-size:14px;line-height:1.7;color:${MUTED};">
      ${esc(order.customerName)}<br/>
      ${esc(order.address)}, ${esc(order.city)}<br/>
      Phone: ${esc(order.phone)}
    </p>

    <h2 style="margin:28px 0 8px;font-size:15px;color:${DARK};">What happens next</h2>
    <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.8;color:${MUTED};">
      ${steps.map((step) => `<li>${step}</li>`).join("")}
    </ol>

    ${
      orderLink
        ? `<div style="text-align:center;margin-top:32px;"><a href="${esc(orderLink)}" style="display:inline-block;background:${DARK};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:6px;">View your order</a></div>`
        : ""
    }`;
  return layout("Your order is confirmed", `Order ${order.orderNumber} received. Total ${formatMoney(order.totalCents)}.`, body);
}

function adminHtml(order: MailOrder) {
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
  const detail = (label: string, value: string | null) =>
    value
      ? `<tr><td style="padding:5px 0;font-size:13px;color:${MUTED};width:110px;">${label}</td><td style="padding:5px 0;font-size:13px;color:${DARK};">${esc(value)}</td></tr>`
      : "";
  const body = `
    <p style="margin:0 0 20px;font-size:14px;color:${MUTED};">Order <strong style="color:${DARK};">${esc(order.orderNumber)}</strong> was just placed.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detail("Customer", order.customerName)}
      ${detail("Phone", order.phone)}
      ${detail("WhatsApp", order.whatsapp)}
      ${detail("Other number", order.altPhone)}
      ${detail("Email", order.email)}
      ${detail("City", order.city)}
      ${detail("Address", order.address)}
      ${detail("Notes", order.notes)}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">${itemRows(order)}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">${totalsRows(order)}</table>
    ${siteUrl ? `<div style="text-align:center;margin-top:28px;"><a href="${esc(siteUrl)}/admin" style="display:inline-block;background:${DARK};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:6px;">Open admin panel</a></div>` : ""}`;
  return layout("New order received", `New order ${order.orderNumber} - ${formatMoney(order.totalCents)}`, body);
}

/** Sends the confirmation to the customer (if they gave an email) and a copy to the store owner. Never throws. */
export async function sendOrderEmails(order: MailOrder) {
  const mail = getTransporter();
  if (!mail) return;

  const from = `"${STORE_NAME}" <${process.env.SMTP_USER}>`;
  const adminTo = process.env.ORDER_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  const jobs: Promise<unknown>[] = [];
  if (order.email) {
    jobs.push(
      mail.sendMail({
        from,
        to: order.email,
        subject: `Order confirmed ${order.orderNumber} | ${STORE_NAME}`,
        html: customerHtml(order),
      }),
    );
  }
  if (adminTo) {
    jobs.push(
      mail.sendMail({
        from,
        to: adminTo,
        replyTo: order.email ?? undefined,
        subject: `New order ${order.orderNumber} - ${formatMoney(order.totalCents)}`,
        html: adminHtml(order),
      }),
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === "rejected") console.error("[mail] failed to send", result.reason);
  }
}
