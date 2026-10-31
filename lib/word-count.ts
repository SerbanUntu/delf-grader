/**
 * Counts words the DELF way, where a word is any group of characters between two spaces, so "j'ai" and "rendez-vous" are one word each.
 * Groups without any letter or digit, such as a lone "?" or "-", are not counted.
 *
 * @param text The text to count.
 * @returns The number of words.
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((group) => /[\p{L}\p{N}]/u.test(group))
    .length;
}
