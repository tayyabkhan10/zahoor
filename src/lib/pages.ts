import { FREE_DELIVERY_QTY, STORE_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from "./config";

export type InfoPage = { title: string; sections: { heading?: string; body: string[] }[] };

export const INFO_PAGES: Record<string, InfoPage> = {
  faqs: {
    title: "FAQs",
    sections: [
      {
        heading: "How do I place an order?",
        body: ["Pick a product, choose your size and colour, then add it to your cart. You can check out as a guest or sign in to your account to check out faster and track every order."],
      },
      {
        heading: "Which payment methods do you accept?",
        body: ["Cash on delivery, card payment and online payment. The methods available are shown on each product page and again at checkout."],
      },
      {
        heading: "Can I change or cancel my order?",
        body: [`Message us on WhatsApp or call ${SUPPORT_PHONE} as soon as possible. Orders that have not been shipped can be changed or cancelled.`],
      },
    ],
  },
  "shipping-and-delivery": {
    title: "Shipping & Delivery",
    sections: [
      {
        body: [
          `We deliver across Pakistan. Delivery is free when you buy ${FREE_DELIVERY_QTY} or more items, and on products marked "Free delivery". Otherwise the delivery fee is shown on the product page and in your cart.`,
          "Most orders reach you within 3 to 5 working days. Remote areas can take a little longer. You can follow your order any time from the Track order page or from your account.",
        ],
      },
    ],
  },
  "exchange-and-returns": {
    title: "Exchange & Returns",
    sections: [
      {
        body: [
          "If something does not fit or is not what you expected, you can exchange it within the number of days shown on the product page. Items must be unused, unwashed and have all tags attached.",
          `To start an exchange, contact us on WhatsApp or write to ${SUPPORT_EMAIL} with your order number. Damaged or wrong items are always replaced.`,
          "Fragrances, innerwear and items marked \"No return or exchange\" cannot be exchanged.",
        ],
      },
    ],
  },
  payment: {
    title: "Payment",
    sections: [
      {
        body: [
          "Cash on delivery: pay the courier when your parcel arrives.",
          "Card and online payment: after you place the order we confirm it with you and share the secure payment details.",
          "All prices are in Pakistani rupees (PKR) and include applicable taxes.",
        ],
      },
    ],
  },
  "size-guide": {
    title: "Size Guide",
    sections: [
      {
        heading: "How to measure",
        body: ["Measure your chest at the fullest point, your waist at the narrowest point and your hips at the widest point, keeping the tape snug but not tight. If you are between two sizes, we suggest the larger one."],
      },
      {
        heading: "Quick reference (body measurements, inches)",
        body: [
          "XS: chest 32-33, waist 25-26",
          "S: chest 34-35, waist 27-28",
          "M: chest 36-38, waist 29-31",
          "L: chest 39-41, waist 32-34",
          "XL: chest 42-44, waist 35-37",
          "XXL: chest 45-47, waist 38-40",
        ],
      },
      {
        heading: "Pants & trousers (waist, inches)",
        body: ["28: waist 28", "30: waist 30", "32: waist 32", "34: waist 34", "36: waist 36"],
      },
    ],
  },
  "about-us": {
    title: `About ${STORE_NAME}`,
    sections: [
      {
        body: [
          `${STORE_NAME} is a Pakistani fashion label for the whole family: ready to wear, unstitched fabric, western wear and everyday essentials for Women, Men and Kids.`,
          "We believe good style should be honest and affordable. Real fashion, real prices.",
        ],
      },
    ],
  },
  "contact-us": {
    title: "Contact Us",
    sections: [
      {
        body: [
          `Phone / WhatsApp: ${SUPPORT_PHONE}`,
          `Email: ${SUPPORT_EMAIL}`,
          "Open every day, 9 AM to 9 PM (PKT).",
        ],
      },
    ],
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    sections: [
      {
        body: [
          `By placing an order with ${STORE_NAME} you agree to provide accurate delivery details and to accept the order when it arrives. Product colours may look slightly different on different screens.`,
          "Prices, offers and availability can change without notice. We may cancel an order if an item is out of stock or a price was listed in error, and we will tell you if that happens.",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    sections: [
      {
        body: [
          "We collect the details you give us (name, phone, address, email) only to process orders, deliver them and support you. We do not sell your personal information.",
          "Your password is stored in a hashed form and cannot be read by us. You can ask us to delete your account and data at any time.",
        ],
      },
    ],
  },
};