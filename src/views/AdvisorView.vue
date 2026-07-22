<script setup>
import { ref } from 'vue'
import { askAdvisor } from '../services/communityApi'
const question = ref(''); const messages = ref([]); const loading = ref(false); const error = ref('')
const suggestions = ['Gợi ý đội hình Anh Hùng', 'Nhân vật UR+ mới nhất', 'Sự kiện đang diễn ra']
const ask = async () => { const value = question.value.trim(); if (!value) return; messages.value.push({ role: 'user', text: value }); question.value = ''; loading.value = true; error.value = ''; try { const result = await askAdvisor(value); messages.value.push({ role: 'assistant', text: result.answer, source: result.source }) } catch (exception) { error.value = exception.message } finally { loading.value = false } }
</script>

<template>
  <main class="px-4 py-10 sm:px-7 lg:py-14">
    <div class="mx-auto max-w-6xl">
      <header class="advisor-head"><div><p>AI DATA AUXILIARY / BETA</p><h1>Trợ lý dữ liệu</h1><span>Truy vấn nhân vật và sự kiện từ cơ sở dữ liệu Wiki.</span></div><div class="advisor-status"><i />MODEL STATUS<br><b>READY</b></div></header>
      <div class="advisor-grid">
        <aside class="prompt-bank">
          <span>PROMPT LIBRARY</span><h2>Bắt đầu nhanh</h2><p>Chọn một truy vấn mẫu hoặc nhập câu hỏi của riêng bạn.</p>
          <button v-for="(item, index) in suggestions" :key="item" @click="question = item"><b>0{{ index + 1 }}</b><span>{{ item }}</span><i>→</i></button>
          <div class="prompt-note"><strong>DATA SCOPE</strong><span>Characters / Events / Wiki</span></div>
        </aside>
        <section class="advisor-console">
          <div class="console-bar"><span>SESSION / {{ messages.length.toString().padStart(2, '0') }}</span><b><i /> CONNECTION SECURE</b></div>
          <div class="console-stream">
            <div v-if="messages.length === 0" class="console-empty"><strong>AI</strong><h2>Chờ truy vấn mới</h2><p>Trợ lý sẽ ưu tiên dữ liệu Wiki và ghi rõ nguồn trong mỗi phản hồi.</p></div>
            <article v-for="(message, index) in messages" :key="index" :class="['console-message', message.role]">
              <div>{{ message.role === 'user' ? 'YOU' : 'AI' }}</div><section><p>{{ message.text }}</p><small v-if="message.source">SOURCE // {{ message.source }}</small></section>
            </article>
            <p v-if="loading" class="console-loading"><i /> ĐANG PHÂN TÍCH DỮ LIỆU…</p>
          </div>
          <p v-if="error" class="console-error">{{ error }}</p>
          <form class="console-input" @submit.prevent="ask"><span>&gt;_</span><input v-model="question" maxlength="1000" required placeholder="Nhập truy vấn dữ liệu…" /><button :disabled="loading">GỬI →</button></form>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.advisor-head{display:flex;align-items:flex-end;justify-content:space-between;gap:25px}.advisor-head p{color:#5bdeff;font:800 9px ui-monospace,monospace;letter-spacing:.18em}.advisor-head h1{margin-top:10px;color:#eff8ff;font-size:45px;font-weight:950;letter-spacing:-.045em}.advisor-head>div>span{display:block;margin-top:8px;color:#748ba0;font-size:12px}.advisor-status{border-left:1px solid rgba(83,230,194,.25);padding:9px 17px;color:#60788e;font:700 8px/1.7 ui-monospace,monospace;letter-spacing:.12em}.advisor-status i{display:inline-block;height:6px;width:6px;margin-right:8px;border-radius:50%;background:#53e6c2;box-shadow:0 0 10px #53e6c2}.advisor-status b{color:#53e6c2}.advisor-grid{display:grid;grid-template-columns:260px minmax(0,1fr);gap:12px;margin-top:28px}.prompt-bank,.advisor-console{border:1px solid rgba(105,150,187,.16);background:rgba(7,16,28,.8)}.prompt-bank{padding:24px}.prompt-bank>span,.prompt-note strong{color:#5bdeff;font:800 8px ui-monospace,monospace;letter-spacing:.16em}.prompt-bank h2{margin-top:10px;color:white;font-size:20px;font-weight:900}.prompt-bank>p{margin:8px 0 22px;color:#667e94;font-size:11px;line-height:1.6}.prompt-bank button{display:grid;width:100%;grid-template-columns:24px 1fr auto;align-items:center;gap:9px;border-top:1px solid rgba(105,150,187,.12);padding:13px 0;text-align:left}.prompt-bank button b{color:#4c657b;font:800 8px ui-monospace,monospace}.prompt-bank button span{color:#9aafc2;font-size:11px}.prompt-bank button i{color:#5bdeff}.prompt-bank button:hover span{color:white}.prompt-note{margin-top:22px;border-left:2px solid #ff6a57;background:rgba(255,106,87,.04);padding:11px}.prompt-note span{display:block;margin-top:5px;color:#667e94;font:700 8px ui-monospace,monospace}.advisor-console{display:flex;min-height:590px;flex-direction:column}.console-bar{display:flex;justify-content:space-between;border-bottom:1px solid rgba(105,150,187,.13);padding:12px 15px;color:#587086;font:700 8px ui-monospace,monospace;letter-spacing:.13em}.console-bar b{color:#53e6c2}.console-bar i{display:inline-block;height:5px;width:5px;margin-right:7px;border-radius:50%;background:#53e6c2}.console-stream{flex:1;overflow-y:auto;padding:22px}.console-empty{display:grid;min-height:370px;place-items:center;align-content:center;text-align:center}.console-empty strong{display:grid;height:66px;width:66px;place-items:center;border:1px solid rgba(91,222,255,.25);color:#5bdeff;font:950 20px ui-monospace,monospace;clip-path:polygon(0 0,78% 0,100% 22%,100% 100%,22% 100%,0 78%)}.console-empty h2{margin-top:17px;color:#dcefff;font-size:18px;font-weight:900}.console-empty p{max-width:350px;margin-top:7px;color:#60788e;font-size:11px}.console-message{display:grid;grid-template-columns:34px 1fr;gap:12px;margin-bottom:17px}.console-message>div{display:grid;height:30px;place-items:center;background:#10283a;color:#5bdeff;font:900 8px ui-monospace,monospace}.console-message.user>div{background:#ff6a57;color:#160603}.console-message section{border-left:1px solid rgba(91,222,255,.2);background:rgba(3,9,17,.55);padding:13px 15px}.console-message.user section{border-left-color:#ff6a57}.console-message p{white-space:pre-line;color:#bdccda;font-size:12px;line-height:1.7}.console-message small{display:block;margin-top:9px;color:#50677d;font:700 7px ui-monospace,monospace;letter-spacing:.1em}.console-loading{color:#5bdeff;font:800 8px ui-monospace,monospace;letter-spacing:.14em}.console-loading i{display:inline-block;height:6px;width:6px;margin-right:8px;border-radius:50%;background:#5bdeff;animation:pulse 1s infinite}.console-error{margin:0 20px 10px;border-left:2px solid #ff6a57;padding:8px 11px;color:#ff8977;font-size:11px}.console-input{display:grid!important;grid-template-columns:auto 1fr auto!important;align-items:center!important;gap:12px!important;border:0!important;border-top:1px solid rgba(105,150,187,.14)!important;background:#050b13!important;padding:13px 15px!important}.console-input>span{color:#5bdeff;font:900 11px ui-monospace,monospace}.console-input input{border:0!important;background:transparent!important;color:#e4f2fd;outline:0}.console-input button{background:#5bdeff;padding:10px 15px;color:#031018;font:950 9px ui-monospace,monospace;letter-spacing:.12em}.console-input button:disabled{opacity:.4}@keyframes pulse{50%{opacity:.25}}
@media(max-width:760px){.advisor-head{align-items:flex-start;flex-direction:column}.advisor-grid{grid-template-columns:1fr}.prompt-bank{display:none}.advisor-console{min-height:560px}.advisor-head h1{font-size:37px}}
</style>
