import { hashPassword, verifyPassword } from "./password";

// El PIN de "Mi Palabra" reutiliza el mismo hashing (scrypt) que la
// contraseña de la cuenta — es un secreto corto pero igual de sensible (da
// acceso a los compromisos y la firma), así que no tiene sentido guardarlo
// con menos cuidado.
export function hashPin(pin: string): string {
  return hashPassword(pin);
}

export function verifyPin(pin: string, stored: string): boolean {
  return verifyPassword(pin, stored);
}

// 4 a 8 dígitos numéricos: suficiente para que no sea trivial de adivinar a
// ojo, sin pedirle a una persona que recuerde un PIN largo para algo que va
// a abrir seguido.
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}
