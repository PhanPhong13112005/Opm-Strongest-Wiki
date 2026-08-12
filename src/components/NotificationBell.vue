<script setup>
import { computed, ref } from 'vue'
import { authState } from '../services/authApi'

const isOpen = ref(false)
const notifications = ref([
  { id: '1', title: 'Đơn Coupon đã duyệt', message: 'Đơn nạp 50.000đ (UID: 100342) của bạn đã được Admin xác nhận thành công.', isRead: false, createdAt: '2026-08-11T18:30:00Z', type: 'success' },
  { id: '2', title: 'Phản hồi Diễn đàn mới', message: 'Thành viên @pvp_master vừa trả lời bài viết thảo luận của bạn.', isRead: false, createdAt: '2026-08-11T17:15:00Z', type: 'info' },
  { id: '3', title: 'Sự kiện Banner mới', message: 'Sự kiện Rover UR+ & G5 UR+ chính thức ra mắt server SEA.', isRead: true, createdAt: '2026-08-10T12:00:00Z', type: 'event' },
])

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const markAllRead = () => {
  notifications.value.forEach(n => { n.isRead = true })
}

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

const dateStr = (iso) => new Date(iso).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div v-if="authState.session" class="notif-wrapper">
    <button type="button" class="btn-bell" title="Thông báo" @click="toggleOpen">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" stroke-width="2" fill="none" />
      </svg>
      <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount }}</span>
    </button>

    <!-- Notification Popover -->
    <div v-if="isOpen" class="notif-popover">
      <header class="notif-header">
        <div>
          <h3>Thông Báo</h3>
          <small v-if="unreadCount > 0">{{ unreadCount }} chưa đọc</small>
        </div>
        <button v-if="unreadCount > 0" type="button" class="btn-read-all" @click="markAllRead">
          Đánh dấu đã đọc
        </button>
      </header>

      <div class="notif-list">
        <article
          v-for="item in notifications"
          :key="item.id"
          class="notif-item"
          :class="{ 'notif-item--unread': !item.isRead }"
        >
          <div class="notif-content">
            <strong>{{ item.title }}</strong>
            <p>{{ item.message }}</p>
            <time>{{ dateStr(item.createdAt) }}</time>
          </div>
          <button type="button" class="btn-close-item" @click="removeNotification(item.id)">✕</button>
        </article>

        <div v-if="notifications.length === 0" class="notif-empty">
          Không có thông báo mới nào.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notif-wrapper { position: relative; display: inline-block; }
.btn-bell {
  cursor: pointer;
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, .1);
  background: rgba(15, 23, 42, .6);
  color: #cbd5e1;
  display: grid;
  place-items: center;
  transition: all .2s;
}
.btn-bell:hover { border-color: #ffc700; color: #ffc700; }
.btn-bell svg { width: 18px; height: 18px; }

.bell-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 999px;
  border: 2px solid #0f172a;
}

.notif-popover {
  position: absolute;
  top: 48px;
  right: 0;
  width: 320px;
  border: 1px solid rgba(255, 255, 255, .15);
  border-radius: 16px;
  background: #0f172a;
  box-shadow: 0 20px 50px rgba(0, 0, 0, .6);
  z-index: 100;
  overflow: hidden;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  background: rgba(15, 23, 42, .8);
}
.notif-header h3 { margin: 0; color: #f8fafc; font-size: 14px; font-weight: 900; }
.notif-header small { color: #ffc700; font-size: 11px; font-weight: 800; }
.btn-read-all { cursor: pointer; background: transparent; border: none; color: #38bdf8; font-size: 11px; font-weight: 800; }

.notif-list { max-height: 320px; overflow-y: auto; }
.notif-item {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, .05);
  transition: background .2s;
}
.notif-item:hover { background: rgba(255, 255, 255, .03); }
.notif-item--unread { background: rgba(56, 189, 248, .06); }
.notif-content strong { display: block; color: #f8fafc; font-size: 12.5px; font-weight: 850; }
.notif-content p { margin: 4px 0; color: #94a3b8; font-size: 11.5px; line-height: 1.4; }
.notif-content time { color: #64748b; font-size: 10px; }

.btn-close-item { cursor: pointer; border: none; background: transparent; color: #64748b; font-size: 11px; align-self: flex-start; }
.btn-close-item:hover { color: #fb7185; }

.notif-empty { padding: 24px; color: #64748b; font-size: 12px; text-align: center; }
</style>
