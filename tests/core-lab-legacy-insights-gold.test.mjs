import assert from'node:assert/strict'
import crypto from'node:crypto'
import fs from'node:fs'
import path from'node:path'
import test from'node:test'
import{calculateCoreMaterials}from'../src/utils/coreMaterialCalculator.js'
const root=path.resolve(import.meta.dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),review=read('tests/fixtures/core-lab-legacy-insights-gold.json'),data=read('src/data/coreLab.json'),profiles=read('src/data/coreMaterialCosts.json').profiles,legacy=data.heroes.filter(h=>review.legacyCharacterIds.includes(h.characterId)),pair=t=>[t.it_214001||0,t['0']||0],digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').toUpperCase()
test('public source has20 explicit steps and Boros cross-check0->1/9->10/19->20, not assumed cumulative values',()=>{assert.equal(review.semantics,'PER_DESTINATION_LEVEL_STEP_UI_CONFIRMED');assert.equal(review.representative.slug,'100001-sr');assert.equal(review.steps.length,20);assert.deepEqual(review.steps.map(x=>x.to),Array.from({length:20},(_,i)=>i+1));for(const x of review.steps){assert.equal(x.from,x.to-1);assert.ok(Number.isSafeInteger(x.insights)&&x.insights>=0);assert.ok(Number.isSafeInteger(x.gold)&&x.gold>=0)}assert.deepEqual(review.crossCheck.map(x=>x.to),[1,10,20]);for(const x of review.crossCheck){assert.equal(x.slug,'100184-ur');assert.equal(x.insights,review.steps[x.to-1].insights);assert.equal(x.gold,review.steps[x.to-1].gold)}})
test('all15 legacy characters20 steps match600 independently collected insights/gold values',()=>{assert.equal(legacy.length,15);for(const h of legacy){assert.notEqual(h.characterId,'100320-urplus');for(const l of h.levels){const expected=review.steps[l.lv-1];assert.equal(l.cost.filter(x=>x[0]==='it_214001').length,1);assert.equal(l.cost.filter(x=>x[0]==='0').length,1);assert.equal(l.cost.find(x=>x[0]==='it_214001')[1],expected.insights);assert.equal(l.cost.find(x=>x[0]==='0')[1],expected.gold)}}})
test('restoring exactly600 approved numbers reproduces entire prechange JSON, protecting seven other materials and Child',()=>{const clone=structuredClone(data);let count=0;for(const h of clone.heroes.filter(h=>review.legacyCharacterIds.includes(h.characterId)))for(const l of h.levels)for(const x of l.cost){if(x[0]==='it_214001'){x[1]=review.beforeSteps[l.lv-1].insights;count++}if(x[0]==='0'){x[1]=review.beforeSteps[l.lv-1].gold;count++}}assert.equal(count,600);assert.equal(digest(clone),review.beforeSemanticSha256)})
test('source cost plus omitted compCost reconciles all20 observed per-step totals exactly',()=>{for(const x of review.sourceComponentCosts){const sum=id=>[...x.cost,...x.compCost].filter(x=>x[0]===id).reduce((a,x)=>a+x[1],0);assert.equal(sum('it_214001'),review.steps[x.to-1].insights);assert.equal(sum('0'),review.steps[x.to-1].gold)}})
test('calculator20 separate steps and all231 ranges match source sums for all15 legacy characters without double counting',()=>{for(const h of legacy)for(let a=0;a<=20;a++)for(let b=a;b<=20;b++){const x=calculateCoreMaterials(h,a,b,profiles),slice=review.steps.filter(s=>s.to>a&&s.to<=b),expected=[slice.reduce((n,s)=>n+s.insights,0),slice.reduce((n,s)=>n+s.gold,0)];assert.equal(x.status,'VERIFIED');assert.deepEqual(pair(x.totals),expected,h.characterId+' '+a+'->'+b);assert.equal(x.steps.length,b-a)}})
test('explicit source totals0->20 and5->12 and same-level zero hold for all15 characters',()=>{for(const h of legacy){assert.deepEqual(pair(calculateCoreMaterials(h,0,20,profiles).totals),[34232,1799000]);assert.deepEqual(pair(calculateCoreMaterials(h,5,12,profiles).totals),[7212,336000]);for(let n=0;n<=20;n++)assert.deepEqual(calculateCoreMaterials(h,n,n,profiles).totals,{})}})
test('Child URplus continues its own previously verified override and is not a legacy-table target',()=>{assert.ok(!review.legacyCharacterIds.includes('100320-urplus'));const h=data.heroes.find(h=>h.characterId==='100320-urplus');assert.deepEqual(pair(calculateCoreMaterials(h,0,20,profiles).totals),[34232,1799000]);assert.deepEqual(pair(calculateCoreMaterials(h,5,12,profiles).totals),[7212,336000]);assert.equal(profiles.length,1);assert.equal(profiles[0].characterId,'100320-urplus')})
test('six source-verified material images retain exact owner PNG hashes and IDs without changing Core levels',()=>{assert.equal(review.materialImages.length,6);for(const x of review.materialImages){const item=profiles[0].items[x.id];assert.equal(item.icon,'/'+x.path.slice(7));assert.equal(item.iconStatus,'SOURCE_VERIFIED_VISUAL_MATCH');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,x.path))).digest('hex').toUpperCase(),x.sha256);assert.equal(x.identity,'SOURCE_VISUAL_MATCH');assert.equal(x.public_rights,'LICENSE_UNVERIFIED')}assert.equal(profiles[0].milestoneIconMappingStatus,'INCONCLUSIVE')})


test('Core Lab copy separates verified material images from pending milestone icons and effects', () => {
  const vi = read('src/locales/vi.json'), en = read('src/locales/en.json')
  assert.equal(vi.corelab.iconMappingPending, 'Đã xác minh và tích hợp 6 ảnh nguyên liệu Core. Biểu tượng theo mốc Core và một số hiệu ứng vẫn đang chờ xác minh.')
  assert.equal(en.corelab.iconMappingPending, 'Verified and integrated 6 Core material images. Core milestone icons and some effects are still pending verification.')
  assert.equal(profiles[0].quantityStatus, 'SOURCE_VERIFIED')
  assert.equal(profiles[0].milestoneIconMappingStatus, 'INCONCLUSIVE')
  assert.equal(review.materialImages.length, 6)
  for (const image of review.materialImages) {
    assert.equal(profiles[0].items[image.id].iconStatus, 'SOURCE_VERIFIED_VISUAL_MATCH')
    assert.equal(image.public_rights, 'LICENSE_UNVERIFIED')
  }
})
