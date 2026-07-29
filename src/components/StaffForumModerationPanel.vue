<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  deleteForumPost,
  deleteForumTopic,
  getForumTopic,
  getForumTopics,
} from '../services/communityApi'

const topics = ref([])
const activeTopic = ref(null)
const search = ref('')
const loadingTopics = ref(true)
const loadingTopic = ref(false)
const deletingId = ref('')
const error = ref('')
const notice = ref('')

const filteredTopics = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('vi')
  if (!keyword) return topics.value
  return topics.value.filter(topic => [topic.title, topic.author, topic.authorRole]
    .some(value => String(value || '').toLocaleLowerCase('vi').includes(keyword)))
})

const totalPosts = computed(() => topics.value
  .reduce((total, topic) => total + Number(topic.postCount || 0), 0))

const formatDate = value => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '—'

const openTopic = async id => {
  loadingTopic.value = true
  error.value = ''
  try {
    activeTopic.value = await getForumTopic(id)
  } catch (exception) {
    error.value = exception.message
  } finally {
    loadingTopic.value = false
  }
}

const loadTopics = async ({ keepSelection = true } = {}) => {
  loadingTopics.value = true
  error.value = ''
  try {
    const previousId = keepSelection ? activeTopic.value?.id : null
    topics.value = await getForumTopics()
    const nextTopic = topics.value.find(topic => topic.id === previousId) || topics.value[0]
    if (nextTopic) {
      await openTopic(nextTopic.id)
    } else {
      activeTopic.value = null
    }
  } catch (exception) {
    error.value = exception.message
  } finally {
    loadingTopics.value = false
  }
}

const removeTopic = async topic => {
  if (!globalThis.confirm(`Xóa toàn bộ chủ đề “${topic.title}”? Các phản hồi bên trong sẽ không còn hiển thị.`)) return

  deletingId.value = `topic-${topic.id}`
  error.value = ''
  notice.value = ''
  try {
    await deleteForumTopic(topic.id)
    notice.value = `Đã xóa chủ đề “${topic.title}”.`
    topics.value = topics.value.filter(item => item.id !== topic.id)
    activeTopic.value = null
    if (topics.value[0]) await openTopic(topics.value[0].id)
  } catch (exception) {
    error.value = exception.message
  } finally {
    deletingId.value = ''
  }
}

const removePost = async post => {
  if (!globalThis.confirm(`Xóa phản hồi của ${post.author}?`)) return

  deletingId.value = `post-${post.id}`
  error.value = ''
  notice.value = ''
  try {
    await deleteForumPost(post.id)
    activeTopic.value.posts = activeTopic.value.posts.filter(item => item.id !== post.id)
    const summary = topics.value.find(topic => topic.id === activeTopic.value.id)
    if (summary) summary.postCount = Math.max(0, Number(summary.postCount || 0) - 1)
    notice.value = `Đã xóa phản hồi của ${post.author}.`
  } catch (exception) {
    error.value = exception.message
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => loadTopics({ keepSelection: false }))
</script>

<template>
  <section class="forum-moderation">
    <header class="forum-moderation__header">
      <div>
        <span>Kiểm duyệt diễn đàn</span>
        <h2>Chủ đề và phản hồi</h2>
        <p>Đọc hội thoại trong ngữ cảnh trước khi xóa nội dung vi phạm.</p>
      </div>
      <button type="button" class="forum-refresh" :disabled="loadingTopics" @click="loadTopics()">
        {{ loadingTopics ? 'Đang tải…' : 'Làm mới' }}
      </button>
    </header>

    <div class="forum-moderation__metrics">
      <div><span>Chủ đề</span><strong>{{ topics.length }}</strong></div>
      <div><span>Phản hồi</span><strong>{{ totalPosts }}</strong></div>
      <label class="forum-search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M16 16l4 4" />
        </svg>
        <input v-model="search" type="search" placeholder="Tìm tiêu đề hoặc tác giả…" />
      </label>
    </div>

    <p v-if="notice" class="forum-message forum-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="forum-message forum-message--error" role="alert">{{ error }}</p>

    <div class="forum-workspace">
      <aside class="topic-queue" aria-label="Danh sách chủ đề cần kiểm duyệt">
        <div v-if="loadingTopics" class="forum-empty">Đang tải chủ đề…</div>
        <button
          v-for="topic in filteredTopics"
          v-else
          :key="topic.id"
          type="button"
          class="topic-card"
          :class="{ 'topic-card--active': activeTopic?.id === topic.id }"
          :aria-pressed="activeTopic?.id === topic.id"
          @click="openTopic(topic.id)"
        >
          <span>{{ topic.isLocked ? 'ĐÃ KHÓA' : `#${topic.id}` }}</span>
          <strong>{{ topic.title }}</strong>
          <small>{{ topic.author }} · {{ topic.postCount }} phản hồi</small>
        </button>
        <div v-if="!loadingTopics && filteredTopics.length === 0" class="forum-empty">
          {{ search ? 'Không tìm thấy chủ đề phù hợp.' : 'Chưa có chủ đề diễn đàn.' }}
        </div>
      </aside>

      <section class="conversation" aria-live="polite">
        <div v-if="loadingTopic" class="forum-empty">Đang tải hội thoại…</div>
        <div v-else-if="!activeTopic" class="forum-empty forum-empty--large">
          <strong>Chọn một chủ đề</strong>
          <span>Nội dung và phản hồi sẽ xuất hiện tại đây.</span>
        </div>
        <template v-else>
          <header class="conversation__header">
            <div>
              <span>CHỦ ĐỀ #{{ activeTopic.id }}</span>
              <h3>{{ activeTopic.title }}</h3>
              <p>{{ activeTopic.author }} · {{ formatDate(activeTopic.createdAt || activeTopic.updatedAt) }}</p>
            </div>
            <button
              type="button"
              class="moderation-delete"
              :disabled="deletingId === `topic-${activeTopic.id}`"
              @click="removeTopic(activeTopic)"
            >
              {{ deletingId === `topic-${activeTopic.id}` ? 'Đang xóa…' : 'Xóa chủ đề' }}
            </button>
          </header>

          <article class="topic-content">
            <span>Nội dung mở đầu</span>
            <p>{{ activeTopic.content }}</p>
          </article>

          <div class="reply-heading">
            <span>Phản hồi</span>
            <strong>{{ activeTopic.posts?.length || 0 }}</strong>
          </div>

          <div v-if="activeTopic.posts?.length" class="reply-list">
            <article v-for="post in activeTopic.posts" :key="post.id" class="reply-card">
              <header>
                <div>
                  <strong>{{ post.author }}</strong>
                  <span>{{ post.authorRole }}</span>
                </div>
                <time>{{ formatDate(post.createdAt) }}</time>
              </header>
              <p>{{ post.content }}</p>
              <button
                type="button"
                :disabled="deletingId === `post-${post.id}`"
                :aria-label="`Xóa phản hồi của ${post.author}`"
                @click="removePost(post)"
              >
                {{ deletingId === `post-${post.id}` ? 'Đang xóa…' : 'Xóa phản hồi' }}
              </button>
            </article>
          </div>
          <div v-else class="forum-empty">Chủ đề chưa có phản hồi.</div>
        </template>
      </section>
    </div>
  </section>
</template>

<style scoped>
.forum-moderation {
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid rgba(85, 224, 181, .16);
  border-radius: 17px;
  background: rgba(8, 14, 23, .94);
}

.forum-moderation__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid rgba(120, 152, 181, .1);
  padding: 20px 22px;
}

.forum-moderation__header span,
.conversation__header > div > span,
.topic-content > span,
.reply-heading > span {
  color: #55e0b5;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .13em;
  text-transform: uppercase;
}

.forum-moderation__header h2 {
  margin: 4px 0 0;
  color: #eff7fb;
  font-size: 20px;
  font-weight: 920;
}

.forum-moderation__header p {
  margin: 6px 0 0;
  color: #6d8193;
  font-size: 11px;
}

.forum-refresh {
  flex: 0 0 auto;
  border: 1px solid rgba(85, 224, 181, .28);
  border-radius: 10px;
  padding: 9px 13px;
  color: #7ce7c6;
  font-size: 10px;
  font-weight: 850;
}

.forum-refresh:hover:not(:disabled) { background: rgba(85, 224, 181, .07); }
.forum-refresh:disabled { cursor: wait; opacity: .55; }

.forum-moderation__metrics {
  display: grid;
  grid-template-columns: 120px 120px minmax(240px, 1fr);
  gap: 1px;
  border-bottom: 1px solid rgba(120, 152, 181, .1);
  background: rgba(120, 152, 181, .08);
}

.forum-moderation__metrics > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #09111b;
  padding: 13px 16px;
}

.forum-moderation__metrics > div span {
  color: #63788b;
  font-size: 8px;
  font-weight: 850;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.forum-moderation__metrics > div strong { color: #7ce7c6; font-size: 17px; font-weight: 950; }

.forum-search {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #09111b;
  padding: 9px 14px;
}

.forum-search svg { width: 16px; flex: 0 0 16px; fill: none; stroke: #63788b; stroke-width: 1.7; }
.forum-search input { width: 100%; min-width: 0; background: transparent; color: #dce7ef; font-size: 11px; outline: none; }
.forum-search input::placeholder { color: #526779; }

.forum-message { margin: 12px 14px 0; border: 1px solid; border-radius: 10px; padding: 11px 13px; font-size: 11px; }
.forum-message--success { border-color: rgba(85, 224, 181, .24); background: rgba(85, 224, 181, .07); color: #84e9ca; }
.forum-message--error { border-color: rgba(255, 103, 103, .24); background: rgba(255, 103, 103, .07); color: #ff9f96; }

.forum-workspace { display: grid; grid-template-columns: minmax(250px, 340px) minmax(0, 1fr); min-height: 520px; }
.topic-queue { overflow-y: auto; border-right: 1px solid rgba(120, 152, 181, .1); background: rgba(4, 9, 15, .38); padding: 10px; }
.topic-card { display: grid; width: 100%; gap: 6px; margin-bottom: 7px; border: 1px solid rgba(120, 152, 181, .11); border-radius: 11px; background: rgba(9, 17, 27, .8); padding: 13px; text-align: left; }
.topic-card:hover { border-color: rgba(85, 224, 181, .25); }
.topic-card--active { border-color: rgba(85, 224, 181, .34); background: linear-gradient(135deg, rgba(85, 224, 181, .1), rgba(9, 17, 27, .92)); }
.topic-card > span { color: #4db997; font: 800 8px ui-monospace, monospace; letter-spacing: .1em; }
.topic-card > strong { overflow: hidden; color: #dbe6ed; font-size: 12px; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; }
.topic-card > small { overflow: hidden; color: #607486; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }

.conversation { min-width: 0; padding: 20px; }
.conversation__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
.conversation__header > div { min-width: 0; }
.conversation__header h3 { margin: 6px 0 0; color: #edf5fa; font-size: 20px; font-weight: 920; line-height: 1.25; }
.conversation__header p { margin: 6px 0 0; color: #65798b; font-size: 10px; }
.moderation-delete { flex: 0 0 auto; border: 1px solid rgba(255, 103, 103, .25); border-radius: 9px; padding: 9px 11px; color: #ff9c92; font-size: 9px; font-weight: 850; }
.moderation-delete:hover:not(:disabled) { background: rgba(255, 103, 103, .07); }
.moderation-delete:disabled, .reply-card > button:disabled { cursor: wait; opacity: .55; }

.topic-content { margin-top: 18px; border: 1px solid rgba(85, 224, 181, .1); border-radius: 12px; background: rgba(85, 224, 181, .035); padding: 15px; }
.topic-content p { margin: 8px 0 0; color: #aebdc9; font-size: 12px; line-height: 1.7; white-space: pre-line; }
.reply-heading { display: flex; align-items: center; justify-content: space-between; margin: 21px 2px 9px; }
.reply-heading strong { display: grid; min-width: 24px; height: 24px; place-items: center; border-radius: 8px; background: rgba(85, 224, 181, .08); color: #72ddbc; font-size: 10px; }
.reply-list { display: grid; gap: 8px; }
.reply-card { border: 1px solid rgba(120, 152, 181, .1); border-radius: 11px; background: rgba(4, 9, 15, .32); padding: 13px 14px; }
.reply-card header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.reply-card header > div { display: flex; align-items: center; gap: 7px; min-width: 0; }
.reply-card header strong { overflow: hidden; color: #dce7ee; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.reply-card header span { border-radius: 999px; background: rgba(85, 224, 181, .07); padding: 3px 6px; color: #67caaa; font-size: 7px; font-weight: 850; text-transform: uppercase; }
.reply-card time { flex: 0 0 auto; color: #566b7d; font-size: 8px; }
.reply-card p { margin: 9px 0 0; color: #9badba; font-size: 11px; line-height: 1.6; white-space: pre-line; }
.reply-card > button { display: block; margin: 10px 0 0 auto; color: #ff8d84; font-size: 8px; font-weight: 850; }
.forum-empty { display: grid; min-height: 110px; place-content: center; gap: 5px; padding: 20px; color: #607486; text-align: center; font-size: 11px; }
.forum-empty--large { min-height: 420px; }
.forum-empty strong { color: #9aabba; font-size: 13px; }
.forum-empty span { color: #5c7183; font-size: 10px; }

@media (max-width: 860px) {
  .forum-workspace { grid-template-columns: 1fr; }
  .topic-queue { display: flex; gap: 8px; overflow-x: auto; border-right: 0; border-bottom: 1px solid rgba(120, 152, 181, .1); }
  .topic-card { width: 230px; flex: 0 0 230px; margin-bottom: 0; }
  .forum-empty { min-width: 100%; }
}

@media (max-width: 620px) {
  .forum-moderation__header { align-items: flex-start; padding: 17px; }
  .forum-moderation__header p { max-width: 245px; }
  .forum-moderation__metrics { grid-template-columns: 1fr 1fr; }
  .forum-search { grid-column: span 2; min-height: 46px; }
  .conversation { padding: 16px; }
  .conversation__header { flex-direction: column; }
  .moderation-delete { align-self: flex-end; }
  .forum-workspace { min-height: 0; }
  .forum-empty--large { min-height: 280px; }
}
</style>
