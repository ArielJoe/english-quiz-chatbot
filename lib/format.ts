/**
 * Label skill_tag untuk ditampilkan: underscore jadi spasi dan huruf awal
 * tiap kata kapital. "present_continuous" -> "Present Continuous".
 */
export function formatSkillTag(skillTag: string): string {
  return skillTag
    .replace(/_/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}
