import { query } from "./db";
import crypto from "crypto";

// passlib uses "adapted base64" (ab64): . instead of +, no padding
function ab64Decode(s: string): Buffer {
  // Replace . with + and add padding
  const std = s.replace(/\./g, "+");
  const pad = (4 - (std.length % 4)) % 4;
  return Buffer.from(std + "=".repeat(pad), "base64");
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // Format: $pbkdf2-sha512$600000$salt$hash (passlib ab64 encoding)
  const parts = hashedPassword.split("$");
  if (parts.length !== 5) return false;

  const iterations = parseInt(parts[2]);
  const salt = ab64Decode(parts[3]);
  const expectedHash = ab64Decode(parts[4]);

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
