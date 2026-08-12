<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { adminPortalNavigation } from '../data/portalNavigation'
import { authState, clearSession } from '../services/authApi'
import { createAdminEvent, deleteAdminEvent, getAdminEvents, updateAdminEvent } from '../services/adminApi'

const router = useRouter()
const events = ref([])
const form = ref(null)
const error = ref('')
const notice = ref('')
const loading = ref(true)
const saving = ref(false)

const empty = () => ({
  id: '',
  titleVi: '',
  titleEn: '',
  descriptionVi: '',
  descriptionEn: '',
  category: 'main',
  imageUrl: '',
  detailImagesText: '',
  sectionsJson: '[]',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    events.value = await getAdminEvents()
  } catch (exception) {
    error.value = exception.message
  } finally {
    loading.value = false
  }
}

const edit = item => {
  form.value = { ...item, detailImagesText: (item.detailImages || []).join('\n') }
  globalThis.scrollTo({ top: 0, behavior: 'smooth' })
}
const create = () => { form.value = empty() }
const payload = () => ({
  ...form.value,
  detailImages: form.value.detailImagesText.split('\n').map(value => value.trim()).filter(Boolean),
  detailImagesText: undefined,
})
const save = async () => {
  saving.value = true
  error.value = ''
  try {
    const exists = events.value.some(item => item.id === form.value.id)
    const result = exists ? await updateAdminEvent(payload()) : await createAdminEvent(payload())
    notice.value = `Đã lưu ${result.titleVi}.`
    form.value = null
    await load()
  } catch (exception) {
    error.value = exception.message
  } finally {
    saving.value = false
  }
}
const remove = async item => {
  if (!globalThis.confirm(`Xóa sự kiện “${item.titleVi}”? Bình luận liên quan cũng sẽ bị xóa.`)) return
  try {
    await deleteAdminEvent(item.id)
    notice.value = 'Đã xóa sự kiện.'
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
    title="Quản lý sự kiện"
    description="Cập nhật lịch hoạt động, nội dung song ngữ, hình ảnh và cấu trúc hiển thị của sự kiện."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="adminPortalNavigation"
    @logout="logout"
  >
    <section class="workspace-toolbar">
      <div>
        <span>Thư viện sự kiện</span>
        <h2>{{ events.length }} sự kiện đang được quản lý</h2>
        <p>Nội dung đã lưu sẽ xuất hiện trong khu vực sự kiện công khai.</p>
      </div>
      <button type="button" class="primary-action" @click="create">+ Thêm sự kiện</button>
    </section>

    <p v-if="notice" class="workspace-message workspace-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="workspace-message workspace-message--error" role="alert">{{ error }}</p>

    <form v-if="form" class="editor-panel" @submit.prevent="save">
      <header>
        <div><span>Trình biên tập</span><h2>{{ events.some(item => item.id === form.id) ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới' }}</h2></div>
        <button type="button" @click="form = null">Đóng</button>
      </header>
      <div class="field-grid">
        <label class="admin-field"><span>ID</span><input v-model="form.id" required maxlength="100" /></label>
        <label class="admin-field"><span>Loại</span><select v-model="form.category"><option>main</option><option>other</option><option>banner</option></select></label>
        <label class="admin-field"><span>Bắt đầu</span><input v-model="form.startDate" type="date" required /></label>
        <label class="admin-field"><span>Kết thúc</span><input v-model="form.endDate" type="date" required /></label>
        <label class="admin-field field-span-2"><span>Tiêu đề VI</span><input v-model="form.titleVi" required /></label>
        <label class="admin-field field-span-2"><span>Tiêu đề EN</span><input v-model="form.titleEn" required /></label>
        <label class="admin-field field-span-2"><span>Mô tả VI</span><textarea v-model="form.descriptionVi" rows="3" /></label>
        <label class="admin-field field-span-2"><span>Mô tả EN</span><textarea v-model="form.descriptionEn" rows="3" /></label>
        <label class="admin-field field-span-2"><span>Ảnh chính</span><input v-model="form.imageUrl" /></label>
        <label class="admin-field field-span-2"><span>Ảnh chi tiết, mỗi dòng một đường dẫn</span><textarea v-model="form.detailImagesText" rows="3" /></label>
        <label class="admin-field field-span-4"><span>Sections JSON</span><textarea v-model="form.sectionsJson" rows="5" class="code-input" /></label>
      </div>
      <footer>
        <button type="button" class="secondary-action" @click="form = null">Hủy</button>
        <button :disabled="saving" class="primary-action">{{ saving ? 'Đang lưu…' : 'Lưu sự kiện' }}</button>
      </footer>
    </form>

    <section class="content-panel">
      <header><span>Danh sách nội dung</span><strong>{{ loading ? 'Đang đồng bộ…' : `${events.length} mục` }}</strong></header>
      <div v-if="loading" class="empty-state">Đang tải dữ liệu sự kiện…</div>
      <article v-for="item in events" v-else :key="item.id" class="content-row">
        <img :src="item.imageUrl" :alt="item.titleVi" />
        <div>
          <strong>{{ item.titleVi }}</strong>
          <p>{{ item.id }} · {{ item.startDate }} → {{ item.endDate }}</p>
          <span>{{ item.category }}</span>
        </div>
        <div class="row-actions">
          <button type="button" @click="edit(item)">Sửa</button>
          <button type="button" class="danger" @click="remove(item)">Xóa</button>
        </div>
      </article>
      <div v-if="!loading && events.length === 0" class="empty-state">Chưa có sự kiện.</div>
    </section>
  </RolePortalShell>
</template>

<style scoped>
.workspace-toolbar, .editor-panel, .content-panel { border: 1px solid rgba(120, 152, 181, .16); border-radius: 17px; background: rgba(8, 14, 23, .94); }
.workspace-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; border-color: rgba(178, 129, 255, .22); background: linear-gradient(135deg, rgba(178, 129, 255, .08), rgba(8, 14, 23, .94) 55%); padding: 21px 22px; }
.workspace-toolbar span, .editor-panel header span, .content-panel > header span { color: #c49bff; font-size: 9px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.workspace-toolbar h2, .editor-panel h2 { margin: 5px 0 0; color: #f2f7fb; font-size: 20px; font-weight: 920; }
.workspace-toolbar p { margin: 6px 0 0; color: #718598; font-size: 11px; }
.primary-action { flex: 0 0 auto; border-radius: 10px; background: #ffb84d; padding: 10px 15px; color: #080c12; font-size: 11px; font-weight: 900; }
.primary-action:disabled { cursor: wait; opacity: .55; }
.workspace-message { margin: 14px 0 0; border: 1px solid; border-radius: 11px; padding: 12px 14px; font-size: 12px; }
.workspace-message--success { border-color: rgba(85, 224, 181, .25); background: rgba(85, 224, 181, .08); color: #8cebcf; }
.workspace-message--error { border-color: rgba(255, 103, 103, .25); background: rgba(255, 103, 103, .08); color: #ffaaa0; }
.editor-panel { margin-top: 14px; overflow: hidden; }
.editor-panel > header, .content-panel > header { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid rgba(120, 152, 181, .11); padding: 18px 20px; }
.editor-panel > header button { color: #8194a6; font-size: 11px; font-weight: 800; }
.field-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; padding: 20px; }
.field-span-2 { grid-column: span 2; }
.field-span-4 { grid-column: span 4; }
.admin-field span { display: block; margin-bottom: 7px; color: #788da0; font-size: 9px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
.admin-field input, .admin-field textarea, .admin-field select { width: 100%; border: 1px solid rgba(120, 152, 181, .18); border-radius: 10px; background: rgba(0, 0, 0, .24); padding: 10px 11px; color: #e4edf4; font-size: 12px; outline: none; }
.admin-field textarea { resize: vertical; line-height: 1.55; }
.admin-field input:focus, .admin-field textarea:focus, .admin-field select:focus { border-color: rgba(255, 184, 77, .5); }
.code-input { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace; }
.editor-panel footer { display: flex; justify-content: flex-end; gap: 9px; border-top: 1px solid rgba(120, 152, 181, .1); padding: 15px 20px; }
.secondary-action, .row-actions button { border: 1px solid rgba(120, 152, 181, .2); border-radius: 9px; padding: 9px 12px; color: #b7c5d0; font-size: 10px; font-weight: 850; }
.content-panel { margin-top: 14px; overflow: hidden; }
.content-panel > header strong { color: #708497; font-size: 10px; }
.content-row { display: grid; grid-template-columns: 104px minmax(0, 1fr) auto; align-items: center; gap: 16px; border-bottom: 1px solid rgba(120, 152, 181, .08); padding: 15px 20px; }
.content-row:last-child { border-bottom: 0; }
.content-row > img { width: 104px; height: 68px; border: 1px solid rgba(120, 152, 181, .13); border-radius: 10px; background: rgba(0, 0, 0, .2); object-fit: contain; }
.content-row > div { min-width: 0; }
.content-row strong { display: block; overflow: hidden; color: #e3ecf3; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.content-row p { overflow: hidden; margin: 5px 0; color: #63788b; font: 10px ui-monospace, monospace; text-overflow: ellipsis; white-space: nowrap; }
.content-row span { color: #b691ed; font-size: 9px; font-weight: 850; text-transform: uppercase; }
.row-actions { display: flex; gap: 7px; }
.row-actions .danger { border-color: rgba(255, 103, 103, .24); color: #ff9c91; }
.empty-state { display: grid; min-height: 140px; place-items: center; padding: 25px; color: #6f8395; font-size: 12px; }
@media (max-width: 760px) {
  .workspace-toolbar { align-items: flex-start; flex-direction: column; padding: 17px; }
  .workspace-toolbar .primary-action { width: 100%; }
  .field-grid { grid-template-columns: 1fr 1fr; padding: 16px; }
  .field-span-4 { grid-column: span 2; }
  .content-row { grid-template-columns: 76px minmax(0, 1fr); padding: 14px 16px; }
  .content-row > img { width: 76px; height: 58px; }
  .row-actions { grid-column: 2; }
}
@media (max-width: 480px) {
  .field-grid { grid-template-columns: 1fr; }
  .field-span-2, .field-span-4 { grid-column: span 1; }
}
</style>