<script setup>
import { computed, onMounted, ref } from 'vue'
import { createTopUp, getMyTopUps } from '../services/communityApi'

const packages = [
  { id: 'coupon-6', coupons: 6, price: 12890, label: 'Gói 6 Coupon' },
]

const uid = ref('')
const server = ref('')
const rememberProfile = ref(false)
const selectedPackage = ref(packages[0])
const quantity = ref(1)
const orders = ref([])
const submitting = ref(false)
const loading = ref(true)
const error = ref('')
const notice = ref('')

const totalCoupons = computed(() => selectedPackage.value.coupons * quantity.value)
const totalPrice = computed(() => selectedPackage.value.price * quantity.value)
const formatMoney = value => `${Number(value).toLocaleString('vi-VN')}đ`
const formatDate = value => new Date(value).toLocaleString('vi-VN')
const statusLabel = value => ({ Pending: 'Chờ xử lý', Approved: 'Đã hoàn tất', Rejected: 'Từ chối' }[value] || value)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const requests = await getMyTopUps()
    orders.value = requests.filter(item => item.provider === 'Coupon Order')
  } catch (exception) {
    error.value = exception.message
  } finally {
    loading.value = false
  }
}

const changeQuantity = amount => {
  quantity.value = Math.min(10, Math.max(1, quantity.value + amount))
}

const submit = async () => {
  error.value = ''
  notice.value = ''
  const cleanUid = uid.value.trim()
  const cleanServer = server.value.trim()

  if (!/^\d{5,20}$/.test(cleanUid)) {
    error.value = 'UID phải gồm 5–20 chữ số.'
    return
  }
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(cleanServer)) {
    error.value = 'Server chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.'
    return
  }

  submitting.value = true
  try {
    const orderCode = Date.now().toString(36).toUpperCase()
    const referenceCode = `UID:${cleanUid}|SID:${cleanServer}|CP:${selectedPackage.value.coupons}|QTY:${quantity.value}|${orderCode}`
    await createTopUp({
      provider: 'Coupon Order',
      referenceCode,
      amount: totalPrice.value,
    })

    if (rememberProfile.value) {
      localStorage.setItem('opmwiki.coupon.profile', JSON.stringify({ uid: cleanUid, server: cleanServer }))
    } else {
      localStorage.removeItem('opmwiki.coupon.profile')
    }

    notice.value = `Đã gửi yêu cầu nạp ${totalCoupons.value} Coupon. Nhân viên sẽ kiểm tra và xử lý.`
    await load()
  } catch (exception) {
    error.value = exception.message
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('opmwiki.coupon.profile') || 'null')
    if (saved?.uid && saved?.server) {
      uid.value = saved.uid
      server.value = saved.server
      rememberProfile.value = true
    }
  } catch {
    localStorage.removeItem('opmwiki.coupon.profile')
  }
  load()
})
</script>

<template>
  <main class="coupon-page">
    <div class="coupon-shell">
      <header class="coupon-heading">
        <div>
          <p>CỬA HÀNG THÀNH VIÊN</p>
          <h1>Nạp Coupon</h1>
          <span>Chọn gói và gửi đúng UID, Server để nhân viên xử lý yêu cầu.</span>
        </div>
        <div class="coupon-heading__badge"><b>CP</b><span>Yêu cầu được kiểm tra thủ công</span></div>
      </header>

      <p v-if="notice" class="coupon-alert coupon-alert--success" role="status">{{ notice }}</p>
      <p v-if="error" class="coupon-alert coupon-alert--error" role="alert">{{ error }}</p>

      <form class="coupon-order" @submit.prevent="submit">
        <section class="coupon-panel coupon-profile">
          <header class="coupon-panel__heading">
            <span>01</span>
            <div><h2>Thông tin tài khoản game</h2><p>Kiểm tra kỹ UID và Server trước khi gửi.</p></div>
          </header>

          <div class="coupon-profile__fields">
            <label>
              <span>UID (User ID)</span>
              <input v-model="uid" inputmode="numeric" minlength="5" maxlength="20" required placeholder="Ví dụ: 3107453" />
            </label>
            <label>
              <span>Server (SID)</span>
              <input v-model="server" maxlength="20" required placeholder="Ví dụ: 310170" />
            </label>
          </div>
          <label class="coupon-remember">
            <input v-model="rememberProfile" type="checkbox" />
            <span>Lưu UID và Server trên thiết bị này cho lần sau</span>
          </label>
        </section>

        <section class="coupon-panel">
          <header class="coupon-panel__heading">
            <span>02</span>
            <div><h2>Chọn gói Coupon</h2><p>Giá hiển thị là tổng giá trị yêu cầu.</p></div>
          </header>

          <div class="coupon-packages">
            <button
              v-for="item in packages"
              :key="item.id"
              type="button"
              class="coupon-package"
              :class="{ 'is-selected': selectedPackage.id === item.id }"
              @click="selectedPackage = item"
            >
              <span class="coupon-ticket"><b>C</b><i>{{ item.coupons }}</i></span>
              <strong>{{ item.label }}</strong>
              <small>{{ formatMoney(item.price) }}</small>
              <em>Đã chọn</em>
            </button>
          </div>

          <div class="coupon-quantity">
            <div><span>Số lượng</span><small>Tối đa 10 gói mỗi yêu cầu</small></div>
            <div class="coupon-stepper">
              <button type="button" :disabled="quantity <= 1" aria-label="Giảm số lượng" @click="changeQuantity(-1)">−</button>
              <strong>{{ quantity }}</strong>
              <button type="button" :disabled="quantity >= 10" aria-label="Tăng số lượng" @click="changeQuantity(1)">+</button>
            </div>
          </div>
        </section>

        <section class="coupon-summary">
          <div>
            <span>Tổng nhận</span>
            <strong>{{ totalCoupons }} Coupon</strong>
          </div>
          <div>
            <span>Tổng tiền</span>
            <strong>{{ formatMoney(totalPrice) }}</strong>
          </div>
          <button :disabled="submitting">
            {{ submitting ? 'Đang gửi yêu cầu…' : `Gửi yêu cầu · ${formatMoney(totalPrice)}` }}
            <span>→</span>
          </button>
        </section>
      </form>

      <section class="coupon-history">
        <header>
          <div><span>LỊCH SỬ</span><h2>Yêu cầu Coupon của bạn</h2></div>
          <b>{{ orders.length }} yêu cầu</b>
        </header>
        <div v-if="loading" class="coupon-empty">Đang tải lịch sử…</div>
        <div v-else-if="orders.length" class="coupon-history__list">
          <article v-for="order in orders" :key="order.id">
            <div><strong>#{{ order.id }} · {{ formatMoney(order.amount) }}</strong><span>{{ order.referenceCode }}</span></div>
            <div class="coupon-history__status">
              <b :class="`is-${order.status.toLowerCase()}`">{{ statusLabel(order.status) }}</b>
              <time>{{ formatDate(order.createdAt) }}</time>
            </div>
          </article>
        </div>
        <div v-else class="coupon-empty">Bạn chưa gửi yêu cầu nạp Coupon nào.</div>
      </section>

      <p class="coupon-warning"><b>Lưu ý:</b> Đây là yêu cầu xử lý thủ công, không phải cổng thanh toán tự động. Không cung cấp mật khẩu hoặc OTP cho bất kỳ ai.</p>
    </div>
  </main>
</template>

<style scoped>
.coupon-page{min-height:calc(100vh - 96px);padding:38px 26px 70px;background:radial-gradient(circle at 80% 0,rgba(85,224,181,.06),transparent 28%)}
.coupon-shell{width:min(100%,1050px);margin:0 auto}.coupon-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;border-bottom:1px solid rgba(100,145,180,.15);padding-bottom:24px}.coupon-heading p,.coupon-history header span{margin:0;color:#55e0b5;font:900 10px ui-monospace,SFMono-Regular,monospace;letter-spacing:.14em}.coupon-heading h1{margin:6px 0 0;color:#f5f9fc;font-size:clamp(34px,5vw,50px);font-weight:950;letter-spacing:-.045em}.coupon-heading>div>span{display:block;margin-top:8px;color:#7d91a4;font-size:13px}.coupon-heading__badge{display:flex;align-items:center;gap:10px;border:1px solid rgba(85,224,181,.18);border-radius:12px;background:rgba(85,224,181,.05);padding:10px 13px}.coupon-heading__badge b{display:grid;width:34px;height:34px;place-items:center;border-radius:8px;background:#55e0b5;color:#04130e;font:950 11px ui-monospace,monospace}.coupon-heading__badge span{max-width:150px;color:#7f9b91;font-size:10px;line-height:1.4}.coupon-alert{margin:14px 0 0;border-radius:10px;padding:12px 14px;font-size:12px;font-weight:750}.coupon-alert--success{border:1px solid rgba(85,224,181,.24);background:rgba(85,224,181,.07);color:#8cebd0}.coupon-alert--error{border:1px solid rgba(255,103,103,.25);background:rgba(255,103,103,.07);color:#ffaaa3}.coupon-order{display:grid;gap:14px;margin-top:19px}.coupon-panel{overflow:hidden;border:1px solid rgba(102,145,180,.16);border-radius:17px;background:rgba(7,14,23,.92)}.coupon-panel__heading{display:flex;align-items:center;gap:13px;border-bottom:1px solid rgba(102,145,180,.12);padding:18px 21px}.coupon-panel__heading>span{display:grid;width:34px;height:34px;place-items:center;border-radius:8px;background:rgba(85,224,181,.09);color:#55e0b5;font:900 10px ui-monospace,monospace}.coupon-panel__heading h2{margin:0;color:#edf6fa;font-size:17px;font-weight:900}.coupon-panel__heading p{margin:4px 0 0;color:#65798b;font-size:10px}.coupon-profile__fields{display:grid;grid-template-columns:1.45fr 1fr;gap:12px;padding:20px 21px 12px}.coupon-profile label>span,.coupon-quantity span{display:block;color:#8295a6;font-size:11px;font-weight:800}.coupon-profile input:not([type=checkbox]){width:100%;margin-top:8px;border:1px solid rgba(113,151,181,.2);border-radius:10px;background:#050b12;padding:13px 14px;color:#edf7fb;font-size:13px;outline:none}.coupon-profile input:focus{border-color:rgba(85,224,181,.55);box-shadow:0 0 0 3px rgba(85,224,181,.06)}.coupon-remember{display:flex;align-items:center;gap:9px;margin:0 21px 20px;border-radius:9px;background:rgba(255,255,255,.025);padding:11px 13px}.coupon-remember input{accent-color:#55e0b5}.coupon-remember span{color:#718696!important;font-size:10px!important}.coupon-packages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:20px 21px}.coupon-package{position:relative;display:flex;min-height:178px;align-items:center;flex-direction:column;border:1px solid rgba(111,151,182,.17);border-radius:13px;background:#070e17;padding:20px;color:#91a2b0}.coupon-package.is-selected{border-color:#55e0b5;background:linear-gradient(145deg,rgba(85,224,181,.1),#070e17 67%);box-shadow:inset 0 0 0 1px rgba(85,224,181,.08)}.coupon-ticket{position:relative;display:grid;width:58px;height:70px;place-items:center;border:2px solid #55e0b5;border-radius:7px;background:linear-gradient(145deg,#173f39,#0b181a);color:#7ff0cf}.coupon-ticket::before,.coupon-ticket::after{content:"";position:absolute;top:28px;width:8px;height:14px;border-radius:9px;background:#070e17}.coupon-ticket::before{left:-5px}.coupon-ticket::after{right:-5px}.coupon-ticket b{font-size:26px}.coupon-ticket i{position:absolute;right:5px;bottom:4px;font:900 9px ui-monospace,monospace}.coupon-package strong{margin-top:13px;color:#f1f7fa;font-size:13px}.coupon-package small{margin-top:7px;color:#55e0b5;font-size:12px;font-weight:900}.coupon-package em{position:absolute;top:10px;right:10px;border-radius:99px;background:#55e0b5;padding:4px 7px;color:#04130e;font-size:8px;font-style:normal;font-weight:900;opacity:0}.coupon-package.is-selected em{opacity:1}.coupon-quantity{display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(102,145,180,.12);padding:17px 21px}.coupon-quantity small{display:block;margin-top:4px;color:#5e7182;font-size:9px}.coupon-stepper{display:flex;align-items:center;gap:14px;border:1px solid rgba(111,151,182,.17);border-radius:99px;padding:4px}.coupon-stepper button{display:grid;width:32px;height:32px;place-items:center;border-radius:50%;background:rgba(85,224,181,.08);color:#55e0b5;font-size:18px}.coupon-stepper button:disabled{opacity:.3}.coupon-stepper strong{min-width:20px;color:#f4f8fb;text-align:center;font-size:15px}.coupon-summary{display:grid;grid-template-columns:1fr 1fr minmax(260px,1.4fr);align-items:center;gap:12px;border:1px solid rgba(85,224,181,.22);border-radius:16px;background:linear-gradient(110deg,rgba(85,224,181,.07),rgba(7,14,23,.94));padding:14px 16px}.coupon-summary>div{padding-left:10px}.coupon-summary>div span{display:block;color:#698074;font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.coupon-summary>div strong{display:block;margin-top:5px;color:#eaf5f1;font-size:17px}.coupon-summary>button{display:flex;align-items:center;justify-content:space-between;border-radius:11px;background:#55e0b5;padding:14px 17px;color:#04130e;font-size:12px;font-weight:950}.coupon-summary>button:disabled{opacity:.55}.coupon-summary>button span{font-size:18px}.coupon-history{margin-top:20px;overflow:hidden;border:1px solid rgba(102,145,180,.15);border-radius:16px;background:rgba(7,14,23,.84)}.coupon-history>header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(102,145,180,.12);padding:17px 20px}.coupon-history h2{margin:4px 0 0;color:#eaf3f8;font-size:17px;font-weight:900}.coupon-history>header>b{border-radius:99px;background:rgba(85,224,181,.08);padding:6px 9px;color:#71dcbc;font-size:9px}.coupon-history__list article{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid rgba(102,145,180,.09);padding:15px 20px}.coupon-history__list article:last-child{border:0}.coupon-history__list strong{display:block;color:#dce8ee;font-size:12px}.coupon-history__list article div>span{display:block;margin-top:5px;color:#5f7486;font:700 9px ui-monospace,monospace}.coupon-history__status{text-align:right}.coupon-history__status b{display:inline-block;border-radius:99px;padding:5px 8px;font-size:9px}.coupon-history__status b.is-pending{background:rgba(255,188,74,.1);color:#ffc866}.coupon-history__status b.is-approved{background:rgba(85,224,181,.1);color:#72e5c2}.coupon-history__status b.is-rejected{background:rgba(255,103,103,.1);color:#ff9999}.coupon-history__status time{display:block;margin-top:5px;color:#5b7082;font-size:9px}.coupon-empty{display:grid;min-height:110px;place-items:center;padding:24px;color:#65798a;font-size:11px}.coupon-warning{margin:14px 2px 0;color:#637789;font-size:10px;line-height:1.6}.coupon-warning b{color:#f0ba59}
@media(max-width:760px){.coupon-page{padding:26px 14px 55px}.coupon-heading{align-items:flex-start;flex-direction:column}.coupon-heading__badge{display:none}.coupon-profile__fields{grid-template-columns:1fr}.coupon-packages{grid-template-columns:1fr}.coupon-package{min-height:165px}.coupon-summary{grid-template-columns:1fr 1fr}.coupon-summary>button{grid-column:1/-1}.coupon-history__list article{align-items:flex-start;flex-direction:column}.coupon-history__status{text-align:left}}
@media(max-width:420px){.coupon-summary{grid-template-columns:1fr}.coupon-summary>button{grid-column:auto}.coupon-quantity{align-items:flex-start;gap:15px;flex-direction:column}.coupon-stepper{align-self:flex-end}}
</style>
