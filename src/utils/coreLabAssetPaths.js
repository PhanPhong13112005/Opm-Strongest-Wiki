export const coreLabFolderBySuffix = Object.freeze({
  '307': 'Psykos_V2',
  '196': 'Child_Emperor_V2',
  '184': 'Boros',
  '078': 'Drive_Knight',
  '159': 'Geryuganshoop',
  '108': 'Bomb',
  '045': 'Child_Emperor',
  '003': 'SeaKing',
  '109': 'Psykos',
  '013': 'Zombie_Man',
  '029': 'Amai',
  '092': 'Bakuzan',
  '083': 'Genus',
  '001': 'Genos',
  '008': 'Mosquito_Girl',
})

export const getCoreLabItemIcon = (itemId, hero, items = {}) => {
  if (!hero) return ''
  const folder = coreLabFolderBySuffix[hero.iconSuffix]
  if (!folder) return items[itemId]?.icon || ''

  if (itemId === '0') return '/Core_Skill/Items/gold.png'

  if (itemId.startsWith('it_215')) {
    return `/Core_Skill/${folder}/${itemId.replace('it_', 'Item_')}.png`
  }

  if (itemId.startsWith('it_214')) {
    return `/Core_Skill/Items/${itemId.replace('it_', 'Item_')}.png`
  }

  return items[itemId]?.icon || ''
}

export const getCoreLabMilestoneIcon = (milestoneIconPath, hero) => {
  if (!milestoneIconPath || !hero) return ''
  const match = milestoneIconPath.match(/\/([^/]+)\.webp$/)
  if (!match) return milestoneIconPath

  // V2 heroes can deliberately reuse a base hero's Core Skill art. The raw
  // milestone basename is the authoritative asset ID, while hero.iconSuffix
  // remains authoritative for portraits and hero-specific upgrade items.
  const assetSuffix = match[1].match(/^(\d+)_/)?.[1]
  const folder = coreLabFolderBySuffix[assetSuffix] || coreLabFolderBySuffix[hero.iconSuffix]
  return folder ? `/Core_Skill/${folder}/${match[1]}.png` : milestoneIconPath
}

export const getCoreLabHeroPortrait = (hero) => {
  if (!hero) return ''
  const folder = coreLabFolderBySuffix[hero.iconSuffix]
  return folder ? `/Core_Skill/${folder}/${hero.iconSuffix}_c.png` : hero.portrait || ''
}
