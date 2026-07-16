// Русская плюрализация: 1 просмотр, 2 просмотра, 5 просмотров.
// forms — [для 1, для 2–4, для 5–0], как в примере выше.
export function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export const VIEW_FORMS: [string, string, string] = ["просмотр", "просмотра", "просмотров"];
