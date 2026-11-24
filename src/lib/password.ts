// Parol qoidalari: kamida 8 belgi, kamida bitta harf va bitta raqam, ko'pi bilan 72 belgi (bcrypt chegarasi).
export function isStrongPassword(p: string): boolean {
  return p.length >= 8 && p.length <= 72 && /\p{L}/u.test(p) && /\d/.test(p);
}
