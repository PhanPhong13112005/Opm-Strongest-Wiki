<script setup>
import { onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authState, clearSession, refreshSession } from '../services/authApi'

const router = useRouter()
const logout = async () => { clearSession(); await router.replace('/') }
onMounted(() => refreshSession().catch(() => {}))
const modules = [
  { to: '/forum', code: 'COM-01', title: 'Phòng cộng đồng', desc: 'Trao đổi đội hình, chiến thuật và kinh nghiệm với người chơi khác.', status: 'LIVE' },
  { to: '/advisor', code: 'AUX-02', title: 'Trợ lý dữ liệu', desc: 'Truy vấn nhanh nhân vật, sự kiện và thông tin đang lưu trong Wiki.', status: 'AI' },
  { to: '/top-up', code: 'CRD-03', title: 'Trung tâm tín dụng', desc: 'Gửi yêu cầu nạp và theo dõi toàn bộ tiến trình xác minh.', status: 'SECURE' },
  { to: '/events', code: 'EVT-04', title: 'Tín hiệu sự kiện', desc: 'Khám phá sự kiện đang diễn ra và tham gia bình luận.', status: 'UPDATED' },
]
</script>

<template>
  <main class="px-4 py-10 sm:px-7 lg:py-14">
    <div class="mx-auto max-w-6xl">
      <section class="account-command">
        <div>
          <p class="command-kicker">USER COMMAND NODE / {{ authState.session?.role }}</p>
          <h1>Chào mừng trở lại,<br><span>{{ authState.session?.displayName }}</span></h1>
          <p class="command-desc">Mọi công cụ cộng đồng của bạn được tập hợp trong một bảng điều khiển duy nhất.</p>
        </div>
        <div class="credit-readout">
          <small>AVAILABLE CREDIT</small>
          <strong>{{ Number(authState.session?.balance || 0).toLocaleString('vi-VN') }}</strong>
          <span>VND // VERIFIED BALANCE</span>
        </div>
        <button class="command-logout" @click="logout">KẾT THÚC PHIÊN ↗</button>
      </section>

      <div class="command-section-label"><span>01</span><p>ACTIVE MODULES</p><i /></div>
      <section class="module-grid">
        <RouterLink v-for="(module, index) in modules" :key="module.to" :to="module.to" class="module-tile">
          <div class="module-tile__top"><span>{{ module.code }}</span><b>{{ module.status }}</b></div>
          <div class="module-symbol">{{ String(index + 1).padStart(2, '0') }}</div>
          <h2>{{ module.title }}</h2>
          <p>{{ module.desc }}</p>
          <div class="module-open">OPEN MODULE <span>↗</span></div>
        </RouterLink>
      </section>

      <section class="account-footnote">
        <span>SESSION PROTECTED</span>
        <p>Tài khoản chỉ được lưu trong tab hiện tại. Không chia sẻ mã giao dịch, mật khẩu hoặc OTP trong diễn đàn.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.account-command{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:30px;overflow:hidden;border:1px solid rgba(91,222,255,.16);background:linear-gradient(120deg,rgba(11,31,50,.94),rgba(7,16,28,.86));padding:40px;clip-path:polygon(0 0,97% 0,100% 18%,100% 100%,0 100%)}.account-command::after{content:"USER//NODE";position:absolute;right:-12px;bottom:-20px;color:rgba(91,222,255,.04);font:950 68px ui-monospace,monospace}.command-kicker{color:#5bdeff!important;font:800 9px ui-monospace,monospace;letter-spacing:.18em}.account-command h1{position:relative;z-index:1;margin-top:13px;color:#eaf5ff;font-size:clamp(32px,5vw,58px);font-weight:950;line-height:1;letter-spacing:-.05em}.account-command h1 span{color:#5bdeff}.command-desc{max-width:560px;margin-top:18px;color:#8399ad;font-size:13px;line-height:1.7}.credit-readout{position:relative;z-index:1;align-self:center;min-width:245px;border-left:2px solid #ff6a57;background:rgba(3,10,18,.58);padding:23px 25px}.credit-readout small,.credit-readout span{display:block;color:#60768b;font:700 8px ui-monospace,monospace;letter-spacing:.15em}.credit-readout strong{display:block;margin:8px 0;color:#fff;font:950 32px ui-monospace,monospace}.command-logout{position:absolute;right:18px;top:16px;z-index:2;color:#60778c;font:700 8px ui-monospace,monospace;letter-spacing:.13em}.command-logout:hover{color:#ff7a67}.command-section-label{display:flex;align-items:center;gap:12px;margin:32px 0 13px}.command-section-label span{color:#5bdeff;font:900 9px ui-monospace,monospace}.command-section-label p{color:#71879c;font:800 9px ui-monospace,monospace;letter-spacing:.18em}.command-section-label i{height:1px;flex:1;background:rgba(91,222,255,.1)}.module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.module-tile{position:relative;min-height:245px;overflow:hidden;border:1px solid rgba(107,151,188,.15);background:rgba(7,16,28,.76);padding:25px;transition:.25s}.module-tile::before{content:"";position:absolute;left:0;top:0;height:2px;width:0;background:#5bdeff;transition:.25s}.module-tile:hover{transform:translateY(-3px);border-color:rgba(91,222,255,.38);background:rgba(9,24,39,.92)}.module-tile:hover::before{width:100%}.module-tile__top{display:flex;justify-content:space-between;color:#536c82;font:700 8px ui-monospace,monospace;letter-spacing:.14em}.module-tile__top b{color:#53e6c2}.module-symbol{position:absolute;right:24px;top:40px;color:rgba(91,222,255,.1);font:950 70px ui-monospace,monospace}.module-tile h2{position:relative;margin-top:47px;color:#edf7ff;font-size:22px;font-weight:900;letter-spacing:-.025em}.module-tile p{position:relative;max-width:410px;margin-top:10px;color:#778da1;font-size:12px;line-height:1.65}.module-open{position:absolute;right:25px;bottom:22px;left:25px;display:flex;justify-content:space-between;border-top:1px solid rgba(107,151,188,.12);padding-top:13px;color:#5bdeff;font:800 8px ui-monospace,monospace;letter-spacing:.15em}.account-footnote{display:flex;align-items:center;gap:20px;margin-top:18px;border:1px solid rgba(83,230,194,.12);background:rgba(83,230,194,.035);padding:13px 17px}.account-footnote span{flex:none;color:#53e6c2;font:800 8px ui-monospace,monospace;letter-spacing:.14em}.account-footnote p{color:#60778c;font-size:10px}
@media(max-width:760px){.account-command{grid-template-columns:1fr;padding:32px 22px;clip-path:none}.credit-readout{min-width:0}.module-grid{grid-template-columns:1fr}.account-footnote{align-items:flex-start;flex-direction:column;gap:7px}}
</style>
