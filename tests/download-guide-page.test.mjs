import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

test('download guide preparation and navigation respect the route publication boundary', () => {
  const router = read('src/router/index.js')
  const app = read('src/App.vue')
  const vi = JSON.parse(read('src/locales/vi.json'))
  const en = JSON.parse(read('src/locales/en.json'))
  const view = read('src/views/DownloadGuideView.vue')
  const config = read('src/data/opmWikiApkRelease.js')

  // Committed component/CTA preparation does not publish the public route.
  assert.match(view, /import \{ opmWikiApkRelease \} from '\.\.\/data\/opmWikiApkRelease'/)
  assert.match(config, /export const opmWikiApkRelease = Object\.freeze\(/)
  const published = /^\s*path:\s*['"]\/huong-dan-tai-game['"]/m.test(router)
  if (published) {
    assert.match(router, /const DownloadGuideView = retryImport\(\(\) => import\('\.\.\/views\/DownloadGuideView\.vue'\)\)/)
    assert.match(router, /name: 'download-guide',\s*component: DownloadGuideView/)
    assert.equal((app.match(/to="\/huong-dan-tai-game"/g) || []).length, 2)
    for (const label of ['Điều hướng chính', 'Mobile navigation']) {
      const navigation = app.match(new RegExp(`<nav\\b[^>]*aria-label="${label}"[^>]*>([\\s\\S]*?)<\\/nav>`))?.[1] || ''
      assert.equal((navigation.match(/to="\/huong-dan-tai-game"/g) || []).length, 1, `Missing guide link in ${label}`)
    }
    assert.equal(vi.nav.downloadGuide, 'Hướng dẫn tải')
    assert.equal(en.nav.downloadGuide, 'Download guide')
  } else {
    assert.doesNotMatch(router, /DownloadGuideView/)
    assert.doesNotMatch(app, /to="\/huong-dan-tai-game"/)
    assert.equal(Object.hasOwn(vi.nav, 'downloadGuide'), false)
    assert.equal(Object.hasOwn(en.nav, 'downloadGuide'), false)
  }
})

test('official regional links remain distinct and safe', () => {
  const view = read('src/views/DownloadGuideView.vue')

  assert.match(view, /com\.onepunchman\.ggplay\.sea\.cbt/)
  assert.match(view, /https:\/\/www\.taptap\.cn\/app\/136604/)
  assert.match(view, /id6749569333/)
  assert.match(view, /id1491275510/)
  assert.match(view, /id1449688300/)
  assert.match(view, /target="_blank"/)
  assert.match(view, /rel="noopener noreferrer"/)
  assert.match(view, /Apple Support|support\.apple\.com\/vi-vn\/118283/)
  assert.doesNotMatch(view, /apkpure|apkcombo|mod apk|disable play protect/i)
})

test('OpmWiki APK release stays disabled until approved metadata is configured', () => {
  const config = read('src/data/opmWikiApkRelease.js')
  const view = read('src/views/DownloadGuideView.vue')
  const env = read('.env.example')

  assert.match(config, /VITE_OPMWIKI_APK_URL/)
  assert.match(config, /status: url \? 'ready' : 'preparing'/)
  assert.match(config, /build: url \? '1' : ''/)
  assert.match(view, /APK chưa sẵn sàng/)
  assert.match(view, /Nút tải sẽ được mở khi bản phát hành chính thức sẵn sàng/)
  assert.match(view, /disabled/)
  assert.match(view, /không phải game One Punch Man chính thức/)
  assert.match(env, /^VITE_OPMWIKI_APK_URL=$/m)
  assert.doesNotMatch(view, /Thông tin factual|public artifact\/URL/)
  assert.doesNotMatch(config, /app-debug\.apk|androidTest|integration_test/)
})

test('approved OpmWiki APK CTA remains environment-driven and release-specific', () => {
  const config = read('src/data/opmWikiApkRelease.js')
  const view = read('src/views/DownloadGuideView.vue')
  const env = read('.env.example')

  assert.equal((view.match(/\{ id: '(?:vn|sea|cn|compare|apk)'/g) || []).length, 5)
  assert.match(view, /Tải OpmWiki cho Android/)
  assert.match(view, /target="_blank"/)
  assert.match(view, /rel="noopener noreferrer"/)
  assert.match(view, /<strong>Phiên bản:<\/strong>/)
  assert.match(view, /<strong>Build:<\/strong>/)
  assert.match(view, /<strong>Yêu cầu:<\/strong>/)
  assert.match(view, /<strong>Kích thước file:<\/strong>/)
  assert.match(view, /<strong>SHA-256:<\/strong>/)
  assert.match(view, /Android có thể yêu cầu cho phép cài ứng dụng/)
  assert.doesNotMatch(view, /disable Play Protect|tắt Play Protect/i)
  assert.doesNotMatch(view, /github\.com\/PhanPhong13112005\/Opm-Strongest-Wiki\/releases\/download/)
  assert.match(config, /VITE_OPMWIKI_APK_VERSION/)
  assert.match(config, /VITE_OPMWIKI_APK_SIZE/)
  assert.match(config, /VITE_OPMWIKI_APK_SHA256/)
  assert.match(config, /VITE_OPMWIKI_APK_MIN_ANDROID/)
  assert.match(env, /OpmWiki-0\.1\.0%2B1\.apk/)
  assert.match(env, /0133687AB842C1F0197F3C740CC6090449ADD783563A08B80DCF0462004475E5/)
})
