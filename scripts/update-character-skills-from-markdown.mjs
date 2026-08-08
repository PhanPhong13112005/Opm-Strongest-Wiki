import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const sourcePath = path.join(root, 'docs', 'DANH_SACH_KY_NANG_NHAN_VAT_EN.md')
const catalogPath = path.join(root, 'src', 'data', 'characters_en.json')

const markdown = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n')
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))

const decodeEntities = value => value
  .replaceAll('&gt;', '>')
  .replaceAll('&lt;', '<')
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replace(/\*\*(.*?)\*\*/g, '$1')

const placeholder = /^(information not provided|effect currently unknown|unknown|not available|no (?:skill )?description)\b/i
const normalize = value => value
  .toLowerCase()
  .replace(/ultra[- ]ultimate/g, 'ultimate')
  .replace(/extreme /g, '')
  .replace(/5★ /g, '')
  .replace(/awaken \d /g, '')
  .replace(/[^a-z0-9]/g, '')

const entries = []
for (const block of markdown.split(/(?=^### )/m)) {
  const id = block.match(/^- \*\*ID:\*\* `([^`]+)`/m)?.[1]
  if (!id) continue

  const rows = []
  for (const line of block.split('\n')) {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*\*\*(.*?)\*\*\s*\|\s*(.*?)\s*\|$/)
    if (!match) continue
    rows.push({
      index: Number(match[1]),
      type: match[2].trim(),
      name: match[3].trim(),
      desc: decodeEntities(match[4].trim()),
    })
  }
  entries.push({ id, rows })
}

const entryById = new Map()
for (const entry of entries) {
  if (entryById.has(entry.id)) throw new Error(`Duplicate Markdown character ID: ${entry.id}`)
  entryById.set(entry.id, entry)
}

if (entries.length !== catalog.length) {
  throw new Error(`Character count mismatch: Markdown=${entries.length}, JSON=${catalog.length}`)
}

const specialRowMaps = {
  // The Markdown separates Basic and Advanced Core effects; the app presents them in one Awakening card.
  '100184-ur': [[0], [1], [2], [3], [4], [5], [6, 7], [8], [9]],
  '100045-ur': [[0], [1], [2], [3], [4], [5], [6, 7], [8], [9]],
  // The final Markdown row is a standalone Trait, not Awaken 3, and is intentionally outside the 9-skill schema.
  '100094-ur': [[0], [1], [2], [3], [4], [5], [6], [7], [8]],
}

let updated = 0
let unchanged = 0
let skippedPlaceholders = 0

for (const character of catalog) {
  const entry = entryById.get(character.id)
  if (!entry) throw new Error(`Markdown is missing character ID: ${character.id}`)

  const rowMap = specialRowMaps[character.id] || character.skills.map((_, index) => [index])
  if (rowMap.length !== character.skills.length) {
    throw new Error(`Skill mapping mismatch for ${character.id}: map=${rowMap.length}, JSON=${character.skills.length}`)
  }
  if (!specialRowMaps[character.id] && entry.rows.length !== character.skills.length) {
    throw new Error(`Skill count mismatch for ${character.id}: Markdown=${entry.rows.length}, JSON=${character.skills.length}`)
  }

  character.skills.forEach((skill, skillIndex) => {
    const sourceRows = rowMap[skillIndex].map(rowIndex => entry.rows[rowIndex])
    if (sourceRows.some(row => !row)) throw new Error(`Missing mapped row for ${character.id} skill ${skillIndex + 1}`)

    if (sourceRows.length === 1) {
      const [row] = sourceRows
      const sameName = normalize(row.name) === normalize(skill.name)
      const sameType = normalize(row.type) === normalize(skill.type)
      if (!sameName && !sameType) {
        throw new Error(`Skill identity mismatch for ${character.id} #${skillIndex + 1}: ${row.type}/${row.name} != ${skill.type}/${skill.name}`)
      }
    }

    if (sourceRows.some(row => placeholder.test(row.desc))) {
      skippedPlaceholders++
      return
    }

    const nextDescription = sourceRows.length === 1
      ? sourceRows[0].desc
      : sourceRows.map((row, index) => `${index === 0 ? 'Basic Core' : 'Advanced Core'}: ${row.desc}`).join(' ')

    if (skill.desc === nextDescription) {
      unchanged++
      return
    }
    skill.desc = nextDescription
    updated++
  })
}

const catalogIds = new Set(catalog.map(character => character.id))
for (const entry of entries) {
  if (!catalogIds.has(entry.id)) throw new Error(`JSON is missing Markdown character ID: ${entry.id}`)
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ characters: catalog.length, updated, unchanged, skippedPlaceholders }, null, 2))
