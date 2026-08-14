import { buffGearSourceAssets } from './slots.js'

const sourceAssetById = Object.freeze(Object.fromEntries(
  buffGearSourceAssets.map(asset => [asset.id, asset]),
))

// Verified against the reference Buff Gear page and source artwork.
const compatibilityAssetIds = Object.freeze({
  faction: Object.freeze({
    Hero: 'equipcard_1_1',
    Monster: 'equipcard_1_2',
  }),
  type: Object.freeze({
    Duelist: 'equipcard_2_1',
    Grappler: 'equipcard_2_2',
    'Hi-Tech': 'equipcard_2_3',
    Esper: 'equipcard_2_4',
  }),
  level: Object.freeze({
    Class_S: 'equipcard_3_1',
    A: 'equipcard_3_2',
    B: 'equipcard_3_3',
    C: 'equipcard_3_4',
    Dragon: 'equipcard_3_5',
    Demon: 'equipcard_3_6',
    Tiger: 'equipcard_3_7',
    Special: 'equipcard_3_8',
  }),
})

export const getBuffGearCompatibilityVisual = (axisId, compatibility) => {
  const assetId = compatibilityAssetIds[axisId]?.[compatibility]
  return assetId ? sourceAssetById[assetId] : null
}

export const buffGearMaterialVisuals = Object.freeze([
  Object.freeze({ id: 'crystalS', asset: sourceAssetById.Item_213002 }),
  Object.freeze({ id: 'crystalCore', asset: sourceAssetById.Item_213003 }),
])
