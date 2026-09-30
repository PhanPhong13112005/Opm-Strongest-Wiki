const clean = value => String(value || '').trim()

const url = clean(import.meta.env.VITE_OPMWIKI_APK_URL)

export const opmWikiApkRelease = Object.freeze({
  status: url ? 'ready' : 'preparing',
  url,
  version: clean(import.meta.env.VITE_OPMWIKI_APK_VERSION),
  build: url ? '1' : '',
  size: clean(import.meta.env.VITE_OPMWIKI_APK_SIZE),
  sha256: clean(import.meta.env.VITE_OPMWIKI_APK_SHA256),
  minAndroid: clean(import.meta.env.VITE_OPMWIKI_APK_MIN_ANDROID),
})
