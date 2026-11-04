import { getSkillDescriptionForDisplay } from './skillPresentation.js'

const verifiedMapping = mapping => !!mapping && ['owner-confirmed', 'source-verified'].includes(mapping.status) && !!mapping.url && (mapping.status !== 'source-verified' || mapping.sourceKind === 'community-published-game-data')
const verifiedEffect = status => ['owner-confirmed', 'source-verified'].includes(status)
const stateLabel = (state, language) => typeof state.label === 'string' ? state.label : state.label?.[language]

// Presentation-only numerical states of ONE source skill. A numeric sequence
// does not establish stars, awakening stages or a mapping to another effect.
export const resolveSkillNumericView = (skill, views = [], language = 'vi') => {
  const source = String(skill?.desc || '')
  const view = views.find(candidate => candidate.skillType === skill?.type && source.includes(candidate.sequence))
  if (!view || !/^\d+(?:[.,]\d+)?%?(?: \[\d+(?:[.,]\d+)?%?\])+$/.test(view.sequence)) return null
  const values = view.sequence.match(/\d+(?:[.,]\d+)?%?/g)
  if (!values || values.length < 2 || source.split(view.sequence).length !== 2) return null
  const mapping = view.stageMapping
  if (mapping && (!verifiedMapping(mapping)
    || !Array.isArray(mapping.states) || mapping.states.length !== values.length
    || mapping.states.some((state, index) => state.value !== values[index] || !state.label || !state.sourceSkillId))) return null
  let description = source
  const independentEffects = []
  for (const effect of view.independentEffects || []) {
    const text = effect.sourceText?.[language]
    // Fail closed if the API/local source no longer matches approved evidence.
    if (!text || description.split(text).length !== 2) return null
    if (verifiedEffect(effect.stageMapping)) {
      if (!mapping || !Array.isArray(effect.stageValues) || effect.stageValues.length !== values.length
        || !effect.stageValues.every(value => /^\d+(?:[.,]\d+)?%?$/.test(value))
        || !effect.sourceSequence || text.split(effect.sourceSequence).length !== 2) return null
      const sourceValues = effect.sourceSequence.match(/\d+(?:[.,]\d+)?%?/g)
      const mappedValues = effect.stageValues.filter((value, index, all) => index === 0 || value !== all[index - 1])
      if (JSON.stringify(sourceValues) !== JSON.stringify(mappedValues)) return null
    }
    description = description.replace(text, '').trim()
    independentEffects.push({
      label: effect.label?.[language] || '',
      description: getSkillDescriptionForDisplay({ ...skill, desc: text }),
      stageMapping: effect.stageMapping,
      sourceDescription: text,
      sourceSequence: effect.sourceSequence,
      stageValues: verifiedEffect(effect.stageMapping) ? effect.stageValues : null,
    })
  }
  return { values, sourceSequence: view.sequence, description, independentEffects,
    stageLabels: mapping?.states.map(state => stateLabel(state, language)) || null,
    unlockConditionsStatus: mapping?.unlockConditionsStatus || null }
}

export const numericSkillDescription = (view, index) => {
  if (!view || !Number.isInteger(index) || !view.values[index]) return ''
  return view.description.replace(view.sourceSequence, view.values[index])
}

export const numericIndependentDescription = (effect, index) => {
  if (!effect?.stageValues) return effect?.description || ''
  if (!Number.isInteger(index) || !effect.stageValues[index]) return ''
  return effect.sourceDescription.replace(effect.sourceSequence, effect.stageValues[index])
}

// Expand accepted presentation states into the existing generic skill cards.
// Raw character skills remain untouched; a bracket sequence alone is not a
// stage mapping. Other characters retain their original objects and layout.
export const getSkillUpgradeStates = (skills = [], views = [], language = 'vi') => skills.flatMap(skill => {
  const sourceStates = views.find(view => view.presentation === 'source-stage-cards' && view.skillType === skill.type)
  if (sourceStates) {
    const mapping = sourceStates.stageMapping
    if (!verifiedMapping(mapping) || sourceStates.sourceText?.[language] !== skill.desc
      || !Array.isArray(mapping.states) || mapping.states.length < 2
      || mapping.states.some(state => !state.sourceSkillId || !stateLabel(state, language) || !state.pendingDescription?.[language])) return [skill]
    return mapping.states.map(state => ({ ...skill,
      name: `${skill.name} — ${stateLabel(state, language)}`,
      desc: skill.desc + '\n\n' + state.pendingDescription[language],
      sourceSkillId: state.sourceSkillId, presentationSource: mapping.status,
      pendingStageDetails: true,
    }))
  }
  const definition = views.find(view => view.presentation === 'upgrade-cards'
    && view.skillType === skill.type && String(skill.desc || '').includes(view.sequence))
  if (!definition) return [skill]
  const view = resolveSkillNumericView(skill, [definition], language)
  if (!view?.stageLabels || view.independentEffects.some(effect => !effect.stageValues)) return [skill]
  return view.values.map((value, index) => {
    let desc = skill.desc.replace(view.sourceSequence, value)
    for (const effect of view.independentEffects) desc = desc.replace(effect.sourceDescription, numericIndependentDescription(effect, index))
    return { ...skill, name: `${skill.name} — ${view.stageLabels[index]}`, desc,
      presentationSource: definition.stageMapping.status,
      ...(definition.stageMapping.status === 'source-verified' ? { sourceSkillId: definition.stageMapping.states[index].sourceSkillId, pendingUnlock: true } : {}),
    }
  })
})
