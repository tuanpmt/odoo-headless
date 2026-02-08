import { query } from "./db";
import crypto from "crypto";

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // Format: $pbkdf2-sha512$25000$salt$hash
  const parts = hashedPassword.split("$");
  if (parts.length !== 5) return false;

  const iterations = parseInt(parts[2]);
  const salt = Buffer.from(parts[3], "base64");
  const expectedHash = Buffer.from(parts[4], "base64");

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      plainPassword,
      salt,
      iterations,
      expectedHash.length,
      "sha512",
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(crypto.timingSafeEqual(derivedKey, expectedHash));
      }
    );
  });
}

export async function authenticateUser(login: string, password: string) {
  const users = await query(
    `SELECT u.id, u.login, u.password, p.name, p.email
     FROM res_users u
     JOIN res_partner p ON u.partner_id = p.id
     WHERE u.login = $1 AND u.active = true`,
    [login]
  );

  if (users.length === 0) return null;

  const user = users[0];
  if (!user.password) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email, login: user.login };
}
