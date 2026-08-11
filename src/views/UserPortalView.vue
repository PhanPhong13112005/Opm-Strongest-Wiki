<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { authState, clearSession, refreshSession, requestEmailVerification } from '../services/authApi'

const router = useRouter()
const verificationSending = ref(false)
const verificationNotice = ref('')
const verificationError = ref('')
const developmentVerificationUrl = ref('')

const navigation = [
  { to: '/account', index: '01', label: 'Tổng quan', hint: 'Trang cá nhân của bạn' },
  { to: '/forum', index: '02', label: 'Diễn đàn', hint: 'Trao đổi cùng cộng đồng' },
  { to: '/advisor', index: '03', label: 'Trợ lý AI', hint: 'Hỏi nhanh dữ liệu game' },
  { to: '/top-up', index: '04', label: 'Nạp thẻ', hint: 'Nạp Coupon vào tài khoản game' },
  { to: '/events', index: '05', label: 'Sự kiện', hint: 'Xem và bình luận' },
]

const modules = [
  {
    to: '/forum',
    number: '01',
    label: 'Cộng đồng',
    title: 'Tham gia diễn đàn',
    description: 'Hỏi đáp đội hình, chia sẻ chiến thuật và nhận góp ý từ những người chơi khác.',
    action: 'Mở diễn đàn',
    tone: 'cyan',
  },
  {
    to: '/advisor',
    number: '02',
    label: 'Hỗ trợ',
    title: 'Tư vấn bằng AI',
    description: 'Tìm nhanh nhân vật, kỹ năng, sự kiện và các dữ liệu đã có trong OPM Wiki.',
    action: 'Bắt đầu hỏi',
    tone: 'violet',
  },
  {
    to: '/top-up',
    number: '03',
    label: 'Cửa hàng',
    title: 'Nạp thẻ One Punch Man',
    description: 'Nhập UID, máy chủ và gửi yêu cầu nạp Coupon vào đúng tài khoản trong game.',
    action: 'Chọn gói Coupon',
    tone: 'green',
  },
  {
    to: '/events',
    number: '04',
    label: 'Nội dung',
    title: 'Khám phá sự kiện',
    description: 'Theo dõi sự kiện mới, xem phần thưởng và tham gia bình luận ngay trên từng sự kiện.',
    action: 'Xem sự kiện',
    tone: 'rose',
  },
]

const sendVerification = async () => {
  verificationSending.value = true
  verificationNotice.value = ''
  verificationError.value = ''
  developmentVerificationUrl.value = ''
  try {
    const result = await requestEmailVerification()
    verificationNotice.value = result.message || 'Đã gửi liên kết xác minh Gmail.'
    developmentVerificationUrl.value = result.verificationUrl || ''
    if (result.verified) await refreshSession()
  } catch (error) {
    verificationError.value = error?.message || 'Chưa thể gửi email xác minh. Vui lòng thử lại.'
  } finally {
    verificationSending.value = false
  }
}
const logout = async () => {
  clearSession()
  await router.replace('/')
}

onMounted(() => refreshSession().catch(() => {}))
</script>

<template>
  <RolePortalShell
    role="user"
    role-label="Khu vực thành viên"
    title="Trang cá nhân"
    description="Mọi tính năng dành cho tài khoản của bạn được sắp xếp rõ ràng tại đây."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="navigation"
    @logout="logout"
  >
    <section class="user-welcome">
      <div class="user-welcome__copy">
        <p>Xin chào, {{ authState.session?.displayName || 'bạn' }}</p>
        <h2>Bạn muốn làm gì hôm nay?</h2>
        <span>Chọn một tiện ích bên dưới để bắt đầu. Mỗi khu vực đều lưu tiến trình theo tài khoản hiện tại.</span>
      </div>
      <div class="balance-card">
        <div>
          <span>Số dư hiện tại</span>
          <strong>{{ Number(authState.session?.balance || 0).toLocaleString('vi-VN') }}<small>đ</small></strong>
        </div>
        <RouterLink to="/top-up">Nạp thêm <span>→</span></RouterLink>
      </div>
    </section>

    <section class="verification-panel" aria-labelledby="verification-title">
      <div class="verification-panel__heading">
        <div>
          <span>BẢO MẬT TÀI KHOẢN</span>
          <h2 id="verification-title">Xác minh liên hệ</h2>
        </div>
        <p>Xác minh Gmail hoặc số điện thoại để được bình chọn tối đa 8 nhân vật mỗi phẩm trong tháng.</p>
      </div>
      <div class="verification-grid">
        <article class="verification-method" :class="{ 'is-verified': authState.session?.emailVerified }">
          <div class="verification-method__icon" aria-hidden="true">@</div>
          <div class="verification-method__copy">
            <span>Gmail</span>
            <strong>{{ authState.session?.emailVerified ? 'Đã xác minh' : 'Chưa xác minh' }}</strong>
            <small>{{ authState.session?.emailVerified ? 'Tài khoản đã được mở giới hạn bình chọn.' : 'Nhận liên kết dùng một lần qua Gmail.' }}</small>
          </div>
          <button
            v-if="!authState.session?.emailVerified"
            type="button"
            :disabled="verificationSending"
            @click="sendVerification"
          >
            {{ verificationSending ? 'Đang gửi...' : 'Gửi email xác minh' }}
          </button>
          <span v-else class="verification-method__badge">✓ Đã xác minh</span>
        </article>

        <article class="verification-method verification-method--disabled" :class="{ 'is-verified': authState.session?.phoneVerified }">
          <div class="verification-method__icon" aria-hidden="true">#</div>
          <div class="verification-method__copy">
            <span>Số điện thoại</span>
            <strong>{{ authState.session?.phoneVerified ? 'Đã xác minh' : 'Chưa khả dụng' }}</strong>
            <small>{{ authState.session?.phoneVerified ? 'Số điện thoại đã được xác minh.' : 'Chưa có nhà cung cấp SMS OTP; hệ thống không tự đánh dấu xác minh.' }}</small>
          </div>
          <span class="verification-method__badge">{{ authState.session?.phoneVerified ? '✓ Đã xác minh' : 'Sắp có' }}</span>
        </article>
      </div>
      <p v-if="verificationNotice" class="verification-feedback verification-feedback--success" role="status">{{ verificationNotice }}</p>
      <p v-if="verificationError" class="verification-feedback verification-feedback--error" role="alert">{{ verificationError }}</p>
      <a v-if="developmentVerificationUrl" class="verification-development-link" :href="developmentVerificationUrl">Mở liên kết xác minh trong môi trường phát triển</a>
    </section>
    <div class="portal-section-heading">
      <div>
        <span>Tiện ích của bạn</span>
        <h2>Truy cập nhanh</h2>
      </div>
      <p>4 tính năng đang hoạt động</p>
    </div>

    <section class="user-module-grid">
      <RouterLink
        v-for="module in modules"
        :key="module.to"
        :to="module.to"
        class="user-module"
        :class="`user-module--${module.tone}`"
      >
        <div class="user-module__top">
          <span>{{ module.label }}</span>
          <b>{{ module.number }}</b>
        </div>
        <h3>{{ module.title }}</h3>
        <p>{{ module.description }}</p>
        <div class="user-module__action">
          <strong>{{ module.action }}</strong>
          <span aria-hidden="true">↗</span>
        </div>
      </RouterLink>
    </section>

    <section class="user-help">
      <div class="user-help__icon" aria-hidden="true">i</div>
      <div>
        <strong>Lưu ý bảo mật</strong>
        <p>Không chia sẻ mật khẩu, mã OTP hoặc mã giao dịch trong diễn đàn và phần bình luận sự kiện.</p>
      </div>
      <RouterLink to="/privacy">Xem chính sách</RouterLink>
    </section>
  </RolePortalShell>
</template>

<style scoped>
.user-welcome {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 18px;
  border: 1px solid rgba(100, 145, 180, .16);
  border-radius: 18px;
  background: linear-gradient(120deg, rgba(12, 24, 38, .92), rgba(8, 15, 24, .88));
  padding: 25px;
}

.user-welcome__copy { align-self: center; }
.user-welcome__copy > p { margin: 0 0 8px; color: #55d8ff; font-size: 12px; font-weight: 850; }
.user-welcome__copy h2 { margin: 0; color: #f4f8fc; font-size: clamp(24px, 3vw, 34px); font-weight: 950; letter-spacing: -.035em; }
.user-welcome__copy span { display: block; max-width: 620px; margin-top: 10px; color: #7f93a7; font-size: 13px; line-height: 1.65; }

.balance-card { display: flex; align-items: center; justify-content: space-between; gap: 15px; border: 1px solid rgba(85, 216, 255, .2); border-radius: 14px; background: rgba(85, 216, 255, .055); padding: 18px; }
.balance-card span { color: #7890a5; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; }
.balance-card strong { display: block; margin-top: 5px; color: #fff; font-size: 25px; font-weight: 950; }
.balance-card strong small { margin-left: 3px; color: #55d8ff; font-size: 14px; }
.balance-card a { flex: 0 0 auto; border-radius: 9px; background: #55d8ff; padding: 10px 12px; color: #04111a; font-size: 11px; font-weight: 900; }
.balance-card a span { margin-left: 4px; color: inherit; font-size: inherit; }

.verification-panel{margin-top:16px;border:1px solid rgba(85,216,255,.18);border-radius:18px;background:linear-gradient(135deg,rgba(9,27,42,.92),rgba(8,15,24,.94));padding:22px}
.verification-panel__heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:15px}.verification-panel__heading span{color:#55d8ff;font-size:9px;font-weight:900;letter-spacing:.14em}.verification-panel__heading h2{margin:4px 0 0;color:#f1f7fc;font-size:20px}.verification-panel__heading p{max-width:510px;margin:0;color:#7890a5;font-size:11px;line-height:1.6}
.verification-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.verification-method{display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid rgba(125,158,185,.16);border-radius:14px;background:rgba(3,12,20,.42);padding:15px}.verification-method.is-verified{border-color:rgba(83,225,169,.3);background:rgba(83,225,169,.045)}.verification-method--disabled{opacity:.72}.verification-method__icon{display:grid;width:44px;height:44px;place-items:center;border-radius:11px;background:rgba(85,216,255,.1);color:#55d8ff;font:900 17px ui-monospace,monospace}.verification-method.is-verified .verification-method__icon{background:rgba(83,225,169,.11);color:#53e1a9}.verification-method__copy span{display:block;color:#71889b;font-size:9px;font-weight:850;letter-spacing:.09em;text-transform:uppercase}.verification-method__copy strong{display:block;margin-top:3px;color:#edf6fc;font-size:14px}.verification-method__copy small{display:block;margin-top:3px;color:#6f8496;font-size:10px;line-height:1.45}.verification-method button{border:0;border-radius:9px;background:#55d8ff;padding:10px 12px;color:#031019;font-size:10px;font-weight:900;cursor:pointer}.verification-method button:disabled{cursor:wait;opacity:.55}.verification-method__badge{color:#53e1a9;font-size:10px;font-weight:900}.verification-method--disabled:not(.is-verified) .verification-method__badge{color:#8093a4}
.verification-feedback{margin:12px 0 0;border-radius:9px;padding:10px 12px;font-size:11px;line-height:1.5}.verification-feedback--success{background:rgba(83,225,169,.08);color:#79e8bd}.verification-feedback--error{background:rgba(255,107,126,.08);color:#ff8998}.verification-development-link{display:inline-flex;margin-top:10px;color:#55d8ff;font-size:11px;font-weight:850;text-decoration:underline}
.portal-section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin: 28px 2px 13px; }
.portal-section-heading span { color: #55d8ff; font-size: 10px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
.portal-section-heading h2 { margin: 4px 0 0; color: #edf5fc; font-size: 20px; font-weight: 900; }
.portal-section-heading p { margin: 0; color: #617587; font-size: 11px; }

.user-module-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.user-module { --module-color: 85, 216, 255; position: relative; display: flex; min-height: 238px; overflow: hidden; flex-direction: column; border: 1px solid rgba(var(--module-color), .18); border-radius: 16px; background: linear-gradient(145deg, rgba(var(--module-color), .06), rgba(7, 13, 21, .94) 58%); padding: 23px; transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
.user-module::after { content: ""; position: absolute; right: -65px; top: -75px; width: 180px; height: 180px; border: 1px solid rgba(var(--module-color), .1); border-radius: 50%; box-shadow: 0 0 70px rgba(var(--module-color), .08); }
.user-module--violet { --module-color: 173, 126, 255; }
.user-module--gold { --module-color: 255, 190, 77; }
.user-module--green { --module-color: 85, 224, 181; }
.user-module--rose { --module-color: 255, 102, 125; }
.user-module:hover { transform: translateY(-3px); border-color: rgba(var(--module-color), .42); box-shadow: 0 18px 45px rgba(0, 0, 0, .18); }
.user-module__top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; }
.user-module__top span { border-radius: 999px; background: rgba(var(--module-color), .1); padding: 6px 9px; color: rgb(var(--module-color)); font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.user-module__top b { color: rgba(var(--module-color), .28); font: 950 28px ui-monospace, SFMono-Regular, Consolas, monospace; }
.user-module h3 { position: relative; z-index: 1; margin: 25px 0 0; color: #f1f7fc; font-size: 22px; font-weight: 920; letter-spacing: -.02em; }
.user-module > p { position: relative; z-index: 1; max-width: 460px; margin: 9px 0 22px; color: #788da1; font-size: 12px; line-height: 1.65; }
.user-module__action { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; margin-top: auto; border-top: 1px solid rgba(var(--module-color), .13); padding-top: 14px; color: rgb(var(--module-color)); }
.user-module__action strong { font-size: 11px; font-weight: 900; }
.user-module__action span { font-size: 18px; }

.user-help { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; align-items: center; gap: 13px; margin-top: 16px; border: 1px solid rgba(93, 224, 184, .15); border-radius: 14px; background: rgba(93, 224, 184, .035); padding: 15px 17px; }
.user-help__icon { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 10px; background: rgba(93, 224, 184, .1); color: #5de0b8; font: 900 15px ui-monospace, monospace; }
.user-help strong { color: #c7d5df; font-size: 12px; }
.user-help p { margin: 3px 0 0; color: #6d8295; font-size: 10px; line-height: 1.5; }
.user-help a { color: #5de0b8; font-size: 10px; font-weight: 850; }

@media (max-width: 850px) {
  .verification-panel__heading { align-items: flex-start; flex-direction: column; gap: 8px; }
  .verification-grid { grid-template-columns: 1fr; }
  .user-welcome { grid-template-columns: 1fr; }
  .user-module-grid { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .verification-panel { padding: 16px; }
  .verification-method { grid-template-columns: 38px minmax(0, 1fr); }
  .verification-method__icon { width: 38px; height: 38px; }
  .verification-method button, .verification-method__badge { grid-column: 2; justify-self: start; }
  .user-welcome { padding: 19px; }
  .balance-card { align-items: flex-start; flex-direction: column; }
  .portal-section-heading p { display: none; }
  .user-module { min-height: 220px; padding: 19px; }
  .user-help { grid-template-columns: 38px minmax(0, 1fr); }
  .user-help a { grid-column: 2; }
}
</style>
