<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { authState, hasRole } from '../services/authApi'
import { createForumPost, createForumTopic, deleteForumPost, deleteForumTopic, getCommunityCapabilities, getForumTopic, getForumTopics, isCommunityReadOnlyError } from '../services/communityApi'

const { t } = useI18n()
const topics = ref([])
const activeTopic = ref(null)
const title = ref('')
const topicContent = ref('')
const reply = ref('')
const showCreate = ref(false)
const loading = ref(false)
const error = ref('')
const communityReadOnly = ref(null)
const capabilityFailed = ref(false)
const posting = ref(false)
const draftPreserved = ref(false)
const canPost = computed(() => communityReadOnly.value === false)
const capabilityMessage = computed(() => t(communityReadOnly.value === true
  ? 'communityReadOnly.message'
  : capabilityFailed.value ? 'communityReadOnly.unavailable' : 'communityReadOnly.checking'))

const loadCapability = async () => {
  try { communityReadOnly.value = (await getCommunityCapabilities()).communityReadOnly }
  catch { communityReadOnly.value = null; capabilityFailed.value = true }
}
const handlePostError = exception => {
  if (isCommunityReadOnlyError(exception)) {
    communityReadOnly.value = true
    draftPreserved.value = true
    error.value = ''
  } else { error.value = exception.message }
}

const loadTopics = async () => {
  loading.value = true
  try { topics.value = await getForumTopics() }
  catch (exception) { error.value = exception.message }
  finally { loading.value = false }
}
const openTopic = async (id) => {
  error.value = ''
  try { activeTopic.value = await getForumTopic(id) }
  catch (exception) { error.value = exception.message }
}
const submitTopic = async () => {
  if (!canPost.value || posting.value) return
  posting.value = true
  try {
    activeTopic.value = await createForumTopic(title.value, topicContent.value)
    title.value = ''; topicContent.value = ''; showCreate.value = false
    await loadTopics()
  } catch (exception) { handlePostError(exception) }
  finally { posting.value = false }
}
const submitReply = async () => {
  if (!canPost.value || posting.value || !reply.value.trim()) return
  posting.value = true
  try {
    const post = await createForumPost(activeTopic.value.id, reply.value.trim())
    activeTopic.value.posts.push(post); reply.value = ''; await loadTopics()
  } catch (exception) { handlePostError(exception) }
  finally { posting.value = false }
}
const removePost = async (post) => {
  if (!globalThis.confirm('Xóa nội dung không hợp lệ này?')) return
  await deleteForumPost(post.id)
  activeTopic.value.posts = activeTopic.value.posts.filter(item => item.id !== post.id)
}
const removeTopic = async () => {
  if (!activeTopic.value || !globalThis.confirm('Xóa toàn bộ chủ đề không hợp lệ này?')) return
  try {
    await deleteForumTopic(activeTopic.value.id)
    activeTopic.value = null
    await loadTopics()
  } catch (exception) { error.value = exception.message }
}
const formatDate = (value) => new Date(value).toLocaleString('vi-VN')
onMounted(() => { loadTopics(); loadCapability() })
</script>

<template>
  <main class="min-h-screen px-4 py-14 sm:px-6 sm:py-20">
    <div class="mx-auto max-w-7xl">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p class="text-xs font-black uppercase tracking-[0.24em] text-opm-gold">Cộng đồng</p><h1 class="mt-2 text-4xl font-black text-white">Diễn đàn OPM</h1><p class="mt-2 text-gray-400">Chào {{ authState.session?.displayName }}, cùng trao đổi và tư vấn chiến thuật.</p></div>
        <button v-if="canPost" data-testid="new-topic" class="rounded-xl bg-opm-gold px-5 py-3 text-sm font-black text-black" @click="showCreate = !showCreate">+ Chủ đề mới</button>
      </header>
      <p v-if="!canPost" data-testid="community-status" role="status" class="mb-5 rounded-xl border border-opm-gold/30 bg-opm-gold/5 p-4 text-sm text-gray-300">{{ capabilityMessage }}</p>
      <p v-if="draftPreserved" data-testid="community-draft-preserved" class="mb-5 text-sm text-gray-300">{{ t('communityReadOnly.draftPreserved') }}</p>
      <p v-if="error" class="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">{{ error }}</p>
      <form v-if="showCreate" v-show="canPost" data-testid="create-topic-form" class="mb-7 rounded-2xl border border-opm-gold/30 bg-[#0b0d13] p-5" @submit.prevent="submitTopic">
        <fieldset :disabled="!canPost || posting" class="space-y-4">
        <input v-model="title" minlength="3" maxlength="160" required placeholder="Tiêu đề chủ đề" class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-opm-gold" />
        <textarea v-model="topicContent" minlength="3" maxlength="5000" rows="4" required placeholder="Nội dung cần trao đổi…" class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-opm-gold" />
        <div class="flex justify-end"><button class="rounded-xl bg-opm-gold px-5 py-2 font-black text-black">Đăng chủ đề</button></div>
        </fieldset>
      </form>
      <div class="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside class="rounded-2xl border border-white/10 bg-[#0b0d13] p-3">
          <p v-if="loading" class="p-5 text-center text-gray-500">Đang tải…</p>
          <button v-for="topic in topics" :key="topic.id" class="mb-2 w-full rounded-xl border p-4 text-left transition" :class="activeTopic?.id === topic.id ? 'border-opm-gold/50 bg-opm-gold/10' : 'border-white/5 bg-black/20 hover:border-white/20'" @click="openTopic(topic.id)">
            <strong class="block text-white">{{ topic.title }}</strong>
            <span class="mt-1 block text-xs text-gray-500">{{ topic.author }} · {{ topic.postCount }} phản hồi</span>
          </button>
          <p v-if="!loading && topics.length === 0" class="p-6 text-center text-sm text-gray-500">Chưa có chủ đề.</p>
        </aside>
        <section class="min-h-[480px] rounded-2xl border border-white/10 bg-[#0b0d13] p-5 sm:p-7">
          <div v-if="!activeTopic" class="flex min-h-[400px] items-center justify-center text-center text-gray-500">Chọn một chủ đề để xem cuộc trò chuyện.</div>
          <template v-else>
            <div class="flex items-start justify-between gap-4"><h2 class="text-2xl font-black text-white">{{ activeTopic.title }}</h2><button v-if="hasRole('Staff', 'Admin')" class="shrink-0 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-bold text-red-400" @click="removeTopic">Xóa chủ đề</button></div>
            <p class="mt-1 text-xs text-gray-500">{{ activeTopic.author }} · {{ formatDate(activeTopic.createdAt) }}</p>
            <p class="mt-5 whitespace-pre-line rounded-xl border border-white/5 bg-black/20 p-4 leading-7 text-gray-300">{{ activeTopic.content }}</p>
            <div class="mt-6 space-y-3">
              <article v-for="post in activeTopic.posts" :key="post.id" class="rounded-xl border border-white/5 bg-black/20 p-4">
                <div class="flex justify-between gap-3"><span class="text-sm font-black text-white">{{ post.author }} <small class="ml-1 text-gray-600">{{ post.authorRole }}</small></span><button v-if="hasRole('Staff', 'Admin')" class="text-xs font-bold text-red-400" @click="removePost(post)">Xóa</button></div>
                <p class="mt-2 whitespace-pre-line text-sm leading-6 text-gray-300">{{ post.content }}</p><time class="mt-2 block text-[11px] text-gray-600">{{ formatDate(post.createdAt) }}</time>
              </article>
            </div>
            <form v-show="canPost" data-testid="reply-form" class="mt-6" @submit.prevent="submitReply"><fieldset :disabled="!canPost || posting"><textarea v-model="reply" maxlength="3000" rows="3" required placeholder="Nhập phản hồi…" class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-opm-gold" /><div class="mt-3 flex justify-end"><button class="rounded-xl bg-opm-gold px-5 py-2 font-black text-black">Gửi</button></div></fieldset></form>
          </template>
        </section>
      </div>
    </div>
  </main>
</template>
