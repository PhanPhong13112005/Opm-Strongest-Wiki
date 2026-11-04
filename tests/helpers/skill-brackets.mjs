export const isNumericSkillBracket = value => /^\d+(?:\.\d+)?%?$/.test(String(value).trim())
export const effectTerms = description => [...String(description || '').matchAll(/\[([^\]]+)\]/g)]
  .map(match => match[1].trim()).filter(term => !isNumericSkillBracket(term))
