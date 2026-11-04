import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { resolveSkillNumericView, numericSkillDescription, numericIndependentDescription, getSkillUpgradeStates } from '../src/utils/skillNumericView.js'
const read = file => JSON.parse(fs.readFileSync(new URL('../'+file, import.meta.url)))
const metadata = read('src/data/characterPresentation.json')['100320-urplus'].skillNumericViews

test('one awakened source skill exposes three changing numeric states, energy independently', () => {
  for (const language of ['vi','en']) {
    const character=read(`public/character-details/${language}/100320-urplus.json`)
    const awakening=character.skills.filter(skill=>skill.type==='Awakening')
    assert.equal(awakening.length,1)
    const before=structuredClone(awakening[0])
    const view=resolveSkillNumericView(awakening[0],metadata,language)
    assert.deepEqual(view.values,['92%','95%','98%'])
    assert.deepEqual(view.stageLabels,['A1','A2','A3'])
    for (const [index,value] of view.values.entries()) {
      const displayed=numericSkillDescription(view,index)
      assert.match(displayed,new RegExp(value))
      for (const other of view.values.filter(token=>token!==value)) assert.ok(!displayed.includes(other))
      assert.ok(!displayed.includes('3 [4]'))
      assert.ok(!displayed.includes('3 → 4'))
      assert.doesNotMatch(displayed,/A[123]|Awaken [123]|Thức tỉnh [123]|★/)
    }
    assert.equal(view.independentEffects.length,1)
    assert.match(view.independentEffects[0].description,/3 → 4/)
    assert.equal(view.independentEffects[0].stageMapping,'owner-confirmed')
    assert.deepEqual(view.independentEffects[0].stageValues,['3','3','4'])
    for (const [index,energy] of ['3','3','4'].entries()) {
      assert.equal(numericIndependentDescription(view.independentEffects[0],index),language==='vi'
        ? `Mỗi lượt nhận ${energy} điểm Năng Lượng.` : `Gain ${energy} energy points per turn.`)
    }
    assert.equal(view.unlockConditionsStatus,'INCONCLUSIVE')
    assert.deepEqual(awakening[0],before)
    assert.match(awakening[0].desc,/92% \[95%\] \[98%\]/)
    assert.match(awakening[0].desc,/3 \[4\]/)
  }
})

test('numeric presentation is opt-in, and does not change other skills/characters', () => {
  const character=read('public/character-details/vi/100320-urplus.json')
  for(const skill of character.skills.filter(skill=>skill.type!=='Awakening')) assert.equal(resolveSkillNumericView(skill,metadata),null)
  const reference=read('public/character-details/vi/homeless-emperor-urplus.json')
  for(const skill of reference.skills) assert.equal(resolveSkillNumericView(skill),null)
  const generic={type:'Awakening',desc:'1% [2%] [3%] Damage Reduction.'}
  const view=resolveSkillNumericView(generic,[{skillType:'Awakening',sequence:'1% [2%] [3%]'}],'en')
  assert.equal(numericSkillDescription(view,2),'3% Damage Reduction.')
  assert.equal(view.stageLabels,null)
})

test('unmatched or ambiguous source lines fail closed, never invent effects or stage mappings', () => {
  const skill=read('public/character-details/vi/100320-urplus.json').skills.find(skill=>skill.type==='Awakening')
  assert.equal(resolveSkillNumericView({...skill,desc:skill.desc.replace('95%','96%')},metadata),null)
  assert.equal(resolveSkillNumericView({...skill,desc:skill.desc.replace('3 [4]','3 [5]')},metadata),null)
  assert.equal(resolveSkillNumericView({...skill,desc:skill.desc+' '+skill.desc},metadata),null)
  assert.equal(resolveSkillNumericView(skill,metadata,'unsupported-language'),null)
  const view=resolveSkillNumericView(skill,metadata)
  assert.equal(numericSkillDescription(view,-1),'')
  assert.equal(numericSkillDescription(view,3),'')
  assert.equal(numericSkillDescription(view,1.5),'')
  for(const mutation of ['unapproved','wrong-value','missing-stage','wrong-energy']) {
    const copy=structuredClone(metadata)
    if(mutation==='unapproved')copy[0].stageMapping.status='publisher-confirmed'
    if(mutation==='wrong-value')copy[0].stageMapping.states[1].value='94%'
    if(mutation==='missing-stage')copy[0].stageMapping.states.pop()
    if(mutation==='wrong-energy')copy[0].independentEffects[0].stageValues=['3','5','4']
    assert.equal(resolveSkillNumericView(skill,copy),null,mutation)
  }
  assert.equal(numericIndependentDescription(view.independentEffects[0],-1),'')
  assert.equal(numericIndependentDescription(view.independentEffects[0],3),'')
  assert.equal(numericIndependentDescription({description:'3 → 4'},0),'3 → 4')
})

test('Child awakening mapping records owner acceptance of community evidence, not publisher confirmation or unlock conditions', () => {
  const mapping=metadata[0].stageMapping
  assert.equal(mapping.status,'owner-confirmed')
  assert.equal(mapping.sourceKind,'community-published-game-data')
  assert.equal(mapping.url,'https://opm-ts-wiki.vercel.app/en/character-info/100320-urplus')
  assert.deepEqual(mapping.states.map(state=>state.sourceSkillId),['sk_core016a1','sk_core016a2','sk_core016a3'])
  assert.equal(mapping.unlockConditionsStatus,'INCONCLUSIVE')
  assert.ok(mapping.states.every(state=>!state.unlockCondition && !state.stars))
  const source=fs.readFileSync(new URL('../docs/sources/child-emperor-urplus-awakening.md',import.meta.url),'utf8')
  assert.match(source,/not an independent publisher confirmation/)
  assert.match(source,/Unlock prerequisites remain INCONCLUSIVE/)
})

test('accepted awakening states reuse existing generic cards without altering canonical skills', () => {
  for (const language of ['vi', 'en']) {
    const character = read(`public/character-details/${language}/100320-urplus.json`)
    const before = structuredClone(character.skills)
    const skills = getSkillUpgradeStates(character.skills, metadata, language)
    const raw = character.skills.find(skill => skill.type === 'Awakening')
    const cards = skills.filter(skill => skill.type === 'Awakening')
    assert.equal(cards.length, 3)
    for (const [index, value] of ['92%', '95%', '98%'].entries()) {
      assert.equal(cards[index].name, `${raw.name} — A${index + 1}`)
      const expected = raw.desc.replace('92% [95%] [98%]', value).replace('3 [4]', index === 2 ? '4' : '3')
      assert.equal(cards[index].desc, expected)
      assert.equal(cards[index].icon, raw.icon)
      assert.equal(cards[index].presentationSource, 'owner-confirmed')
      assert.equal(resolveSkillNumericView(cards[index], metadata, language), null)
    }
    assert.deepEqual(character.skills, before)
    for (const skill of character.skills.filter(skill => skill.type !== 'Awakening')) assert.ok(skills.includes(skill))
    const bad = structuredClone(metadata)
    bad[0].stageMapping.status = 'unverified'
    assert.deepEqual(getSkillUpgradeStates(character.skills, bad, language), character.skills)
    for (const id of ['homeless-emperor-urplus','100314-urplus','blacksperm-urplus','100316-urplus']) {
      const reference = read(`public/character-details/${language}/${id}.json`)
      assert.deepEqual(getSkillUpgradeStates(reference.skills, [], language), reference.skills)
    }
  }
  const detail = fs.readFileSync(new URL('../src/views/DetailView.vue', import.meta.url), 'utf8')
  assert.match(detail, /presentedSkills.value.filter/)
  assert.doesNotMatch(detail, /100320-urplus/)
})

test('unused numerical component remains generic, missing Core icons use honest text-only fallback', () => {
  const component=fs.readFileSync(new URL('../src/components/SkillNumericProgression.vue',import.meta.url),'utf8')
  assert.match(component,/role="tablist"/)
  assert.match(component,/role="tab"/)
  assert.match(component,/role="tabpanel"/)
  assert.match(component,/:aria-selected/)
  assert.match(component,/min-h-\[44px\]/)
  assert.match(component,/ArrowRight/)
  assert.match(component,/ArrowLeft/)
  assert.match(component,/font-sans/)
  assert.match(component,/text-xs font-bold tracking-widest uppercase/)
  assert.match(component,/from-\[color:var\(--theme-color\)\] to-yellow-600 text-black/)
  assert.match(component,/bg-\[#12131a\] text-gray-400 border-gray-800/)
  assert.match(component,/text-sm text-gray-300 leading-relaxed whitespace-pre-line/)
  assert.doesNotMatch(component,/font-family:|@font-face|fonts\.googleapis/)
  assert.doesNotMatch(component,/100320-urplus|92%|95%|98%/)
  const core=fs.readFileSync(new URL('../src/views/CoreLabView.vue',import.meta.url),'utf8')
  assert.doesNotMatch(core,/>\?<\/span>/)
  assert.match(core,/data-material-image-status/)
  assert.match(core,/'col-span-2': res.id === '0'/)
})
