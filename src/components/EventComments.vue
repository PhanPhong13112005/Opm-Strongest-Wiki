<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { authState, hasRole, hasValidSession } from '../services/authApi'
import { createEventComment, deleteEventComment, getEventComments } from '../services/communityApi'

const props = defineProps({ eventId: { type: String, required: true } })
const comments = ref([])
const content = ref('')
const loading = ref(false)
const submitting = ref(false)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try { comments.value = await getEventComments(props.eventId) }
  catch (exception) { error.value = exception.message }
  finally { loading.value = false }
}

const submit = async () => {
  if (!content.value.trim()) return
  submitting.value = true
  error.value = ''
  try {
    comments.value.push(await createEventComment(props.eventId, content.value.trim()))
    content.value = ''
  } catch (exception) { error.value = exception.message }
  finally { submitting.value = false }
}

const remove = async (comment) => {
  if (!globalThis.confirm('Xóa bình luận này vì vi phạm nội dung?')) return
  try {
    await deleteEventComment(comment.id)
    comments.value = comments.value.filter(item => item.id !== comment.id)
  } catch (exception) { error.value = exception.message }
}

const formatDate = (value) => new Date(value).toLocaleString('vi-VN')
watch(() => props.eventId, load)
onMounted(load)
</script>

<template>
  <section class="mt-14 rounded-2xl border border-white/10 bg-[#0b0d13]/90 p-5 sm:p-7">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.2em] text-opm-gold">Cộng đồng</p>
        <h2 class="mt-1 text-2xl font-black text-white">Bình luận sự kiện</h2>
      </div>
      <span class="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-gray-400">{{ comments.length }} bình luận</span>
    </div>

    <form v-if="hasValidSession() && authState.session?.userId && !String(authState.session.userId).startsWith('admin:')" class="mb-6" @submit.prevent="submit">
      <textarea v-model="content" maxlength="1000" rows="3" required placeholder="Chia sẻ nhận xét về sự kiện…" class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-opm-gold" />
      <div class="mt-3 flex justify-end">
        <button :disabled="submitting" class="rounded-xl bg-opm-gold px-5 py-2 text-sm font-black text-black disabled:opacity-50">{{ submitting ? 'Đang gửi…' : 'Gửi bình luận' }}</button>
      </div>
    </form>
    <div v-else class="mb-6 rounded-xl border border-opm-gold/20 bg-opm-gold/5 p-4 text-sm text-gray-300">
      <RouterLink :to="{ path: '/login', query: { redirect: `/events/${eventId}` } }" class="font-black text-opm-gold hover:underline">Đăng nhập</RouterLink>
      bằng tài khoản cộng đồng để bình luận.
    </div>

    <p v-if="error" role="alert" class="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{{ error }}</p>
    <p v-if="loading" class="py-8 text-center text-gray-500">Đang tải bình luận…</p>
    <p v-else-if="comments.length === 0" class="py-8 text-center text-gray-500">Chưa có bình luận nào. Hãy là người đầu tiên trao đổi.</p>
    <div v-else class="space-y-3">
      <article v-for="comment in comments" :key="comment.id" class="rounded-xl border border-white/5 bg-black/20 p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <strong class="text-white">{{ comment.displayName }}</strong>
              <span class="rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-400">{{ comment.role }}</span>
            </div>
            <time class="text-xs text-gray-600">{{ formatDate(comment.createdAt) }}</time>
          </div>
          <button v-if="hasRole('Staff', 'Admin')" class="text-xs font-bold text-red-400 hover:text-red-300" @click="remove(comment)">Xóa</button>
        </div>
        <p class="mt-3 whitespace-pre-line text-sm leading-6 text-gray-300">{{ comment.content }}</p>
      </article>
    </div>
  </section>
</template>
