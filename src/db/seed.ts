import "dotenv/config";
import { db } from "./index";
import { admins } from "./schema";
import { hashPassword } from "../lib/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  const passwordHash = await hashPassword(password);

  await db
    .insert(admins)
    .values({ email, passwordHash })
    .onConflictDoUpdate({ target: admins.email, set: { passwordHash } });

  console.log(`Admin ready: ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
