const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))
export const effectAnchorId = term => 'effect-' + String(term).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
export const formatAnnotatedSkill = (description, effects = [], language = 'vi') => String(description || '').replace(/\[([^\]]+)\]/g, (match, term) => {
  if (/^\d+(?:[.,]\d+)?%?$/.test(term.trim())) return match
  const effect = effects.find(e => e.term.replace(/^\[|\]$/g, '').toLowerCase() === term.toLowerCase())
  const title = effect?.desc || (language === 'en' ? 'Effect definition awaits source verification.' : 'Chú thích hiệu ứng đang chờ nguồn xác minh.')
  const action = `event.preventDefault(); event.stopPropagation(); window.scrollToEffectDetail?.(${JSON.stringify(term)})`
  return `<button type="button" data-effect-term="${escapeHtml(term)}" title="${escapeHtml(title)}" aria-controls="${effectAnchorId(term)}" class="text-[color:var(--theme-color)] font-bold hover:text-white border-b border-dashed" onclick="${escapeHtml(action)}">[${escapeHtml(term)}]</button>`
})
