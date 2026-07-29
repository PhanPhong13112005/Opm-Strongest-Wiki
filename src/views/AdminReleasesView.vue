<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { adminPortalNavigation } from '../data/portalNavigation'
import { authState, clearSession } from '../services/authApi'
import { createAdminRelease, deleteAdminRelease, getAdminReleases, updateAdminRelease } from '../services/adminApi'

const router = useRouter()
const entries = ref([])
const form = ref(null)
const editingId = ref(null)
const error = ref('')
const notice = ref('')
const loading = ref(true)
const saving = ref(false)

const empty = () => ({
  server: 'SEA',
  date: new Date().toISOString().slice(0, 10),
  characterId: '',
  bannerImage: '',
  isReturn: false,
  overrideNameVi: '',
  overrideNameEn: '',
  overrideTier: '',
  overrideFactionVi: '',
  overrideFactionEn: '',
  overrideTypeVi: '',
  overrideTypeEn: '',
  overrideRoleVi: '',
  overrideRoleEn: '',
  sortOrder: 1,
})

const serverCounts = computed(() => ({
  CN: entries.value.filter(item => item.server === 'CN').length,
  SEA: entries.value.filter(item => item.server === 'SEA').length,
}))
const load = async () => {
  loading.value = true
  error.value = ''
  try {
    entries.value = await getAdminReleases()
  } catch (exception) {
    error.value = exception.message
  } finally {
    loading.value = false
  }
}
const startCreate = () => {
  editingId.value = null
  form.value = empty()
}
const startEdit = item => {
  editingId.value = item.id
  form.value = { ...empty(), ...item }
  globalThis.scrollTo({ top: 0, behavior: 'smooth' })
}
const save = async () => {
  saving.value = true
  error.value = ''
  try {
    const result = editingId.value
      ? await updateAdminRelease(editingId.value, form.value)
      : await createAdminRelease(form.value)
    notice.value = `Đã lưu mốc #${result.id}.`
    form.value = null
    editingId.value = null
    await load()
  } catch (exception) {
    error.value = exception.message
  } finally {
    saving.value = false
  }
}
const remove = async item => {
  if (!globalThis.confirm(`Xóa mốc ${item.server} ngày ${item.date}?`)) return
  try {
    await deleteAdminRelease(item.id)
    notice.value = `Đã xóa mốc ${item.server} ngày ${item.date}.`
    await load()
  } catch (exception) {
    error.value = exception.message
  }
}
const logout = async () => {
  clearSession()
  await router.replace('/')
}

onMounted(load)
</script>

<template>
  <RolePortalShell
    role="admin"
    role-label="Khu vực quản trị viên"
    title="Lịch ra mắt nhân vật"
    description="Điều phối banner CN/SEA, lịch phát hành và các đợt nhân vật trở lại trên trang chủ."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="adminPortalNavigation"
    @logout="logout"
  >
    <section class="release-summary">
      <div>
        <span>Kế hoạch phát hành</span>
        <h2>{{ entries.length }} mốc đang được hiển thị</h2>
        <p>Dữ liệu tại đây điều khiển trực tiếp banner lịch ra mắt công khai.</p>
      </div>
      <dl>
        <div><dt>CN</dt><dd>{{ serverCounts.CN }}</dd></div>
        <div><dt>SEA</dt><dd>{{ serverCounts.SEA }}</dd></div>
      </dl>
      <button type="button" class="primary-action" @click="startCreate">+ Thêm mốc</button>
    </section>

    <p v-if="notice" class="workspace-message workspace-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="workspace-message workspace-message--error" role="alert">{{ error }}</p>

    <form v-if="form" class="editor-panel" @submit.prevent="save">
      <header>
        <div><span>Trình biên tập</span><h2>{{ editingId ? `Chỉnh sửa mốc #${editingId}` : 'Tạo mốc ra mắt mới' }}</h2></div>
        <button type="button" @click="form = null">Đóng</button>
      </header>
      <div class="field-grid">
        <label class="admin-field"><span>Máy chủ</span><select v-model="form.server"><option>CN</option><option>SEA</option></select></label>
        <label class="admin-field"><span>Ngày</span><input v-model="form.date" type="date" required /></label>
        <label class="admin-field"><span>ID nhân vật</span><input v-model="form.characterId" required placeholder="100313-urplus / unknown" /></label>
        <label class="admin-field"><span>Thứ tự</span><input v-model.number="form.sortOrder" type="number" min="0" max="100" /></label>
        <label class="admin-field field-span-3"><span>Ảnh banner</span><input v-model="form.bannerImage" placeholder="/Characters/Full_Background/..." /></label>
        <label class="return-toggle"><input v-model="form.isReturn" type="checkbox" /><span>Nhân vật trở lại</span></label>
        <label class="admin-field"><span>Tên ghi đè VI</span><input v-model="form.overrideNameVi" /></label>
        <label class="admin-field"><span>Tên ghi đè EN</span><input v-model="form.overrideNameEn" /></label>
        <label class="admin-field"><span>Bậc ghi đè</span><input v-model="form.overrideTier" /></label>
        <label class="admin-field"><span>Vai trò VI</span><input v-model="form.overrideRoleVi" /></label>
        <label class="admin-field"><span>Vai trò EN</span><input v-model="form.overrideRoleEn" /></label>
        <label class="admin-field"><span>Phe VI</span><input v-model="form.overrideFactionVi" /></label>
        <label class="admin-field"><span>Phe EN</span><input v-model="form.overrideFactionEn" /></label>
        <label class="admin-field"><span>Hệ VI</span><input v-model="form.overrideTypeVi" /></label>
        <label class="admin-field"><span>Hệ EN</span><input v-model="form.overrideTypeEn" /></label>
      </div>
      <footer>
        <button type="button" class="secondary-action" @click="form = null">Hủy</button>
        <button :disabled="saving" class="primary-action">{{ saving ? 'Đang lưu…' : 'Lưu mốc lịch' }}</button>
      </footer>
    </form>

    <section class="release-list">
      <header><span>Dòng thời gian</span><strong>{{ loading ? 'Đang đồng bộ…' : `${entries.length} mốc` }}</strong></header>
      <div v-if="loading" class="empty-state">Đang tải lịch ra mắt…</div>
      <article v-for="item in entries" v-else :key="item.id" class="release-row">
        <div class="release-date">
          <strong>{{ item.server }}</strong>
          <time>{{ item.date }}</time>
        </div>
        <img :src="item.bannerImage" :alt="item.characterId" />
        <div class="release-copy">
          <div><strong>{{ item.overrideNameVi || item.overrideName || item.characterId }}</strong><span :class="{ returning: item.isReturn }">{{ item.isReturn ? 'TRỞ LẠI' : 'RA MẮT' }}</span></div>
          <p>{{ item.characterId }} · thứ tự {{ item.sortOrder }}</p>
        </div>
        <div class="row-actions">
          <button type="button" @click="startEdit(item)">Sửa</button>
          <button type="button" class="danger" @click="remove(item)">Xóa</button>
        </div>
      </article>
      <div v-if="!loading && entries.length === 0" class="empty-state">Chưa có mốc ra mắt.</div>
    </section>
  </RolePortalShell>
</template>

<style scoped>
.release-summary, .editor-panel, .release-list { border: 1px solid rgba(120, 152, 181, .16); border-radius: 17px; background: rgba(8, 14, 23, .94); }
.release-summary { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 22px; border-color: rgba(85, 216, 255, .2); background: linear-gradient(135deg, rgba(85, 216, 255, .075), rgba(8, 14, 23, .94) 55%); padding: 21px 22px; }
.release-summary > div > span, .editor-panel header span, .release-list > header span { color: #55d8ff; font-size: 9px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.release-summary h2, .editor-panel h2 { margin: 5px 0 0; color: #f2f7fb; font-size: 20px; font-weight: 920; }
.release-summary p { margin: 6px 0 0; color: #718598; font-size: 11px; }
.release-summary dl { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; overflow: hidden; border: 1px solid rgba(85, 216, 255, .14); border-radius: 11px; background: rgba(85, 216, 255, .1); }
.release-summary dl div { min-width: 68px; background: #09121c; padding: 9px 13px; text-align: center; }
.release-summary dt { color: #657a8c; font-size: 8px; font-weight: 900; }
.release-summary dd { margin: 3px 0 0; color: #72dcfa; font-size: 17px; font-weight: 950; }
.primary-action { flex: 0 0 auto; border-radius: 10px; background: #ffb84d; padding: 10px 15px; color: #080c12; font-size: 11px; font-weight: 900; }
.primary-action:disabled { cursor: wait; opacity: .55; }
.workspace-message { margin: 14px 0 0; border: 1px solid; border-radius: 11px; padding: 12px 14px; font-size: 12px; }
.workspace-message--success { border-color: rgba(85, 224, 181, .25); background: rgba(85, 224, 181, .08); color: #8cebcf; }
.workspace-message--error { border-color: rgba(255, 103, 103, .25); background: rgba(255, 103, 103, .08); color: #ffaaa0; }
.editor-panel { margin-top: 14px; overflow: hidden; }
.editor-panel > header, .release-list > header { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid rgba(120, 152, 181, .11); padding: 18px 20px; }
.editor-panel > header button { color: #8194a6; font-size: 11px; font-weight: 800; }
.field-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; padding: 20px; }
.field-span-3 { grid-column: span 3; }
.admin-field span { display: block; margin-bottom: 7px; color: #788da0; font-size: 9px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
.admin-field input, .admin-field select { width: 100%; border: 1px solid rgba(120, 152, 181, .18); border-radius: 10px; background: rgba(0, 0, 0, .24); padding: 10px 11px; color: #e4edf4; font-size: 12px; outline: none; }
.admin-field input:focus, .admin-field select:focus { border-color: rgba(255, 184, 77, .5); }
.return-toggle { display: flex; align-items: center; gap: 10px; align-self: end; min-height: 39px; border: 1px solid rgba(120, 152, 181, .18); border-radius: 10px; padding: 0 12px; color: #aebdca; font-size: 11px; font-weight: 800; }
.return-toggle input { accent-color: #ffb84d; }
.editor-panel footer { display: flex; justify-content: flex-end; gap: 9px; border-top: 1px solid rgba(120, 152, 181, .1); padding: 15px 20px; }
.secondary-action, .row-actions button { border: 1px solid rgba(120, 152, 181, .2); border-radius: 9px; padding: 9px 12px; color: #b7c5d0; font-size: 10px; font-weight: 850; }
.release-list { margin-top: 14px; overflow: hidden; }
.release-list > header strong { color: #708497; font-size: 10px; }
.release-row { display: grid; grid-template-columns: 108px 104px minmax(0, 1fr) auto; align-items: center; gap: 16px; border-bottom: 1px solid rgba(120, 152, 181, .08); padding: 15px 20px; }
.release-row:last-child { border-bottom: 0; }
.release-date { display: grid; gap: 5px; }
.release-date strong { color: #62dcff; font-size: 12px; font-weight: 950; }
.release-date time { color: #73889a; font: 10px ui-monospace, monospace; }
.release-row > img { width: 104px; height: 64px; border: 1px solid rgba(120, 152, 181, .13); border-radius: 10px; background: rgba(0, 0, 0, .2); object-fit: contain; }
.release-copy { min-width: 0; }
.release-copy > div { display: flex; align-items: center; gap: 8px; min-width: 0; }
.release-copy strong { overflow: hidden; color: #e3ecf3; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.release-copy span { flex: 0 0 auto; border-radius: 999px; background: rgba(85, 216, 255, .09); padding: 4px 7px; color: #6dddfa; font-size: 8px; font-weight: 900; }
.release-copy span.returning { background: rgba(255, 103, 103, .09); color: #ff9c91; }
.release-copy p { overflow: hidden; margin: 6px 0 0; color: #63788b; font: 10px ui-monospace, monospace; text-overflow: ellipsis; white-space: nowrap; }
.row-actions { display: flex; gap: 7px; }
.row-actions .danger { border-color: rgba(255, 103, 103, .24); color: #ff9c91; }
.empty-state { display: grid; min-height: 140px; place-items: center; padding: 25px; color: #6f8395; font-size: 12px; }
@media (max-width: 760px) {
  .release-summary { grid-template-columns: 1fr auto; padding: 17px; }
  .release-summary dl { grid-row: 2; grid-column: 1; width: fit-content; }
  .release-summary .primary-action { grid-row: 2; grid-column: 2; }
  .field-grid { grid-template-columns: 1fr 1fr; padding: 16px; }
  .field-span-3 { grid-column: span 2; }
  .release-row { grid-template-columns: 76px minmax(0, 1fr); gap: 12px; padding: 14px 16px; }
  .release-row > img { display: none; }
  .row-actions { grid-column: 2; }
}
@media (max-width: 480px) {
  .release-summary { display: flex; align-items: stretch; flex-direction: column; }
  .release-summary dl { width: 100%; }
  .release-summary dl div { width: 50%; }
  .field-grid { grid-template-columns: 1fr; }
  .field-span-3 { grid-column: span 1; }
}
</style>