<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  clearAdminSession,
  createAdminCharacter,
  deleteAdminCharacter,
  deleteAdminKeepsake,
  getAdminCharacters,
  updateAdminCharacter,
  updateAdminKeepsake,
} from '../services/adminApi'

const router = useRouter()
const characters = ref([])
const search = ref('')
const page = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const editingId = ref('')
const showForm = ref(false)

const emptyStats = () => ({ atk: 0, hp: 0, def: 0, spd: 0 })
const emptyCharacter = () => ({
  id: '', nameVi: '', nameEn: '', imageUrl: '', tier: '',
  typeVi: '', typeEn: '', factionVi: '', factionEn: '',
  rolesVi: '', rolesEn: '', duyenVi: '', duyenEn: '', bioVi: '', bioEn: '',
  keepsakeIcon: '', traitsVi: '', traitsEn: '', bondListVi: '', bondListEn: '',
  classLevel: '', releaseSea: '', releaseChina: '',
  baseStats: emptyStats(), pvpStats: emptyStats(),
})
const form = ref(emptyCharacter())
const isEditing = computed(() => Boolean(editingId.value))

const splitList = (value) => value
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)

const toPayload = () => ({
  ...form.value,
  rolesVi: splitList(form.value.rolesVi),
  rolesEn: splitList(form.value.rolesEn),
  traitsVi: splitList(form.value.traitsVi),
  traitsEn: splitList(form.value.traitsEn),
  keepsakeIcon: form.value.keepsakeIcon.trim() || null,
  releaseSea: form.value.releaseSea || null,
  releaseChina: form.value.releaseChina || null,
  baseStats: Object.fromEntries(Object.entries(form.value.baseStats).map(([key, value]) => [key, Number(value) || 0])),
  pvpStats: Object.fromEntries(Object.entries(form.value.pvpStats).map(([key, value]) => [key, Number(value) || 0])),
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await getAdminCharacters({ search: search.value, page: page.value, pageSize: 20 })
    characters.value = result.items
    totalPages.value = result.totalPages
    totalCount.value = result.totalCount
  } catch (exception) {
    if (exception.status === 401) return logout()
    error.value = exception.message
  } finally {
    loading.value = false
  }
}

const startCreate = () => {
  editingId.value = ''
  form.value = emptyCharacter()
  showForm.value = true
  notice.value = ''
}

const startEdit = (character) => {
  editingId.value = character.id
  form.value = {
    ...emptyCharacter(),
    ...character,
    rolesVi: (character.rolesVi || []).join(', '),
    rolesEn: (character.rolesEn || []).join(', '),
    traitsVi: (character.traitsVi || []).join(', '),
    traitsEn: (character.traitsEn || []).join(', '),
    keepsakeIcon: character.keepsakeIcon || '',
    releaseSea: character.releaseSea || '',
    releaseChina: character.releaseChina || '',
    baseStats: { ...emptyStats(), ...(character.baseStats || {}) },
    pvpStats: { ...emptyStats(), ...(character.pvpStats || {}) },
  }
  showForm.value = true
  notice.value = ''
  globalThis.scrollTo({ top: 0, behavior: 'smooth' })
}

const save = async () => {
  saving.value = true
  error.value = ''
  try {
    const payload = toPayload()
    const result = isEditing.value
      ? await updateAdminCharacter(payload)
      : await createAdminCharacter(payload)
    notice.value = `Đã lưu ${result.nameVi}.`
    showForm.value = false
    await load()
  } catch (exception) {
    if (exception.status === 401) return logout()
    error.value = exception.message
  } finally {
    saving.value = false
  }
}

const removeCharacter = async (character) => {
  if (!globalThis.confirm(`Xóa nhân vật “${character.nameVi}”? Kỹ năng và hiệu ứng liên quan cũng sẽ bị xóa.`)) return
  try {
    await deleteAdminCharacter(character.id)
    notice.value = `Đã xóa ${character.nameVi}.`
    await load()
  } catch (exception) {
    error.value = exception.message
  }
}

const saveKeepsake = async () => {
  if (!isEditing.value || !form.value.keepsakeIcon.trim()) return
  saving.value = true
  try {
    await updateAdminKeepsake(editingId.value, form.value.keepsakeIcon.trim())
    notice.value = 'Đã cập nhật Kỷ vật.'
    await load()
  } catch (exception) {
    error.value = exception.message
  } finally {
    saving.value = false
  }
}

const removeKeepsake = async () => {
  if (!isEditing.value || !globalThis.confirm('Gỡ Kỷ vật khỏi nhân vật này?')) return
  saving.value = true
  try {
    await deleteAdminKeepsake(editingId.value)
    form.value.keepsakeIcon = ''
    notice.value = 'Đã gỡ Kỷ vật.'
    await load()
  } catch (exception) {
    error.value = exception.message
  } finally {
    saving.value = false
  }
}

const submitSearch = () => {
  page.value = 1
  load()
}

const changePage = (nextPage) => {
  page.value = Math.min(Math.max(nextPage, 1), totalPages.value)
  load()
}

const logout = async () => {
  clearAdminSession()
  await router.replace('/admin/login')
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen px-4 pb-16 pt-24 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.24em] text-opm-gold">OPM Wiki Admin</p>
          <h1 class="mt-2 text-3xl font-black text-white sm:text-4xl">Nhân vật & Kỷ vật</h1>
          <p class="mt-2 text-sm text-gray-400">{{ totalCount }} nhân vật trong PostgreSQL</p>
        </div>
        <div class="flex gap-3">
          <button class="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 hover:bg-white/5" @click="logout">Đăng xuất</button>
          <button class="rounded-xl bg-opm-gold px-4 py-2 text-sm font-black text-black hover:brightness-110" @click="startCreate">+ Thêm nhân vật</button>
        </div>
      </header>

      <p v-if="notice" class="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{{ notice }}</p>
      <p v-if="error" role="alert" class="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{{ error }}</p>

      <section v-if="showForm" class="glass-card mb-8 rounded-2xl border border-opm-gold/30 p-5 sm:p-7">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-black text-white">{{ isEditing ? `Sửa ${editingId}` : 'Thêm nhân vật' }}</h2>
          <button class="text-sm text-gray-400 hover:text-white" @click="showForm = false">Đóng</button>
        </div>

        <form class="space-y-7" @submit.prevent="save">
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label class="admin-field"><span>ID</span><input v-model="form.id" :readonly="isEditing" required /></label>
            <label class="admin-field"><span>Bậc</span><input v-model="form.tier" required placeholder="UR+ / UR / SSR+" /></label>
            <label class="admin-field"><span>Tên tiếng Việt</span><input v-model="form.nameVi" required /></label>
            <label class="admin-field"><span>Tên tiếng Anh</span><input v-model="form.nameEn" required /></label>
            <label class="admin-field"><span>Hệ tiếng Việt</span><input v-model="form.typeVi" required /></label>
            <label class="admin-field"><span>Hệ tiếng Anh</span><input v-model="form.typeEn" required /></label>
            <label class="admin-field"><span>Phe tiếng Việt</span><input v-model="form.factionVi" required /></label>
            <label class="admin-field"><span>Phe tiếng Anh</span><input v-model="form.factionEn" required /></label>
            <label class="admin-field lg:col-span-2"><span>Ảnh nhân vật</span><input v-model="form.imageUrl" placeholder="/Characters/..." /></label>
            <label class="admin-field lg:col-span-2"><span>Ảnh Kỷ vật</span><input v-model="form.keepsakeIcon" placeholder="/Keepsake/.../Keepsake.png" /></label>
            <label class="admin-field"><span>Class level</span><input v-model="form.classLevel" /></label>
            <label class="admin-field"><span>Ngày SEA</span><input v-model="form.releaseSea" type="date" /></label>
            <label class="admin-field"><span>Ngày Trung Quốc</span><input v-model="form.releaseChina" type="date" /></label>
            <label class="admin-field"><span>Vai trò VI, cách nhau dấu phẩy</span><input v-model="form.rolesVi" /></label>
            <label class="admin-field"><span>Roles EN, cách nhau dấu phẩy</span><input v-model="form.rolesEn" /></label>
            <label class="admin-field"><span>Đặc tính VI</span><input v-model="form.traitsVi" /></label>
            <label class="admin-field"><span>Traits EN</span><input v-model="form.traitsEn" /></label>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <div v-for="group in ['baseStats', 'pvpStats']" :key="group" class="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 class="mb-4 text-sm font-black uppercase tracking-wider text-opm-gold">{{ group === 'baseStats' ? 'Chỉ số cơ bản' : 'Chỉ số PVP' }}</h3>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label v-for="stat in ['atk', 'hp', 'def', 'spd']" :key="stat" class="admin-field"><span>{{ stat }}</span><input v-model.number="form[group][stat]" type="number" min="0" /></label>
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="admin-field"><span>Duyên VI</span><textarea v-model="form.duyenVi" rows="3" /></label>
            <label class="admin-field"><span>Duyên EN</span><textarea v-model="form.duyenEn" rows="3" /></label>
            <label class="admin-field"><span>Tiểu sử VI</span><textarea v-model="form.bioVi" rows="4" /></label>
            <label class="admin-field"><span>Tiểu sử EN</span><textarea v-model="form.bioEn" rows="4" /></label>
            <label class="admin-field"><span>Danh sách liên kết VI</span><textarea v-model="form.bondListVi" rows="3" /></label>
            <label class="admin-field"><span>Danh sách liên kết EN</span><textarea v-model="form.bondListEn" rows="3" /></label>
          </div>

          <div class="flex flex-wrap justify-end gap-3">
            <button v-if="isEditing && form.keepsakeIcon" type="button" class="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10" @click="removeKeepsake">Gỡ Kỷ vật</button>
            <button v-if="isEditing && form.keepsakeIcon" type="button" class="rounded-xl border border-opm-gold/40 px-4 py-2 text-sm font-bold text-opm-gold hover:bg-opm-gold/10" @click="saveKeepsake">Lưu riêng Kỷ vật</button>
            <button type="submit" :disabled="saving" class="rounded-xl bg-opm-gold px-6 py-2 font-black text-black disabled:opacity-50">{{ saving ? 'Đang lưu…' : 'Lưu nhân vật' }}</button>
          </div>
        </form>
      </section>

      <section class="glass-card overflow-hidden rounded-2xl border border-white/10">
        <form class="flex gap-3 border-b border-white/10 p-4" @submit.prevent="submitSearch">
          <input v-model="search" class="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-opm-gold" placeholder="Tìm theo ID hoặc tên nhân vật…" />
          <button class="rounded-xl border border-white/10 px-5 text-sm font-black text-white hover:bg-white/5">Tìm</button>
        </form>

        <div v-if="loading" class="p-10 text-center text-gray-400">Đang tải dữ liệu…</div>
        <div v-else-if="characters.length === 0" class="p-10 text-center text-gray-400">Không tìm thấy nhân vật.</div>
        <div v-else class="divide-y divide-white/5">
          <article v-for="character in characters" :key="character.id" class="flex flex-col gap-4 p-4 transition hover:bg-white/[0.03] sm:flex-row sm:items-center">
            <img :src="character.keepsakeIcon || character.imageUrl" :alt="character.nameVi" class="h-16 w-16 rounded-xl border border-white/10 bg-black/30 object-contain" />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate font-black text-white">{{ character.nameVi }}</h2>
                <span class="rounded border border-opm-gold/30 px-2 py-0.5 text-xs font-bold text-opm-gold">{{ character.tier }}</span>
                <span v-if="character.keepsakeIcon" class="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">Có Kỷ vật</span>
              </div>
              <p class="mt-1 truncate text-sm text-gray-400">{{ character.id }} · {{ character.nameEn }} · {{ character.factionVi }} · {{ character.typeVi }}</p>
            </div>
            <div class="flex gap-2">
              <button class="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/5" @click="startEdit(character)">Sửa</button>
              <button class="rounded-lg border border-red-500/20 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10" @click="removeCharacter(character)">Xóa</button>
            </div>
          </article>
        </div>

        <footer class="flex items-center justify-between border-t border-white/10 p-4 text-sm text-gray-400">
          <button :disabled="page <= 1" class="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30" @click="changePage(page - 1)">Trang trước</button>
          <span>Trang {{ page }} / {{ totalPages }}</span>
          <button :disabled="page >= totalPages" class="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30" @click="changePage(page + 1)">Trang sau</button>
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
.admin-field span {
  @apply mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-400;
}

.admin-field input,
.admin-field textarea {
  @apply w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-opm-gold;
}

.admin-field input:read-only {
  @apply cursor-not-allowed opacity-60;
}
</style>
