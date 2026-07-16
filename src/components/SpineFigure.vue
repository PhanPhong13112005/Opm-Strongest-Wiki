<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { Application, BaseTexture } from 'pixi.js'
import { Spine } from 'pixi-spine'
import { TextureAtlas } from '@pixi-spine/base'
import { AtlasAttachmentLoader, SkeletonJson } from '@pixi-spine/runtime-3.8'

const props = defineProps({ src: { type: String, required: true } })
const emit = defineEmits(['fail', 'loaded'])
const container = ref(null)
const loading = ref(true)
let application = null
let runId = 0
const shadowSlotPattern = /yinying|canying/i

const destroyApplication = () => {
  if (!application) return
  try {
    application.destroy(true, { children: true, texture: true, baseTexture: true })
  } catch {
    // Renderer may already be disposed when switching quickly.
  }
  application = null
}

const loadFigure = async () => {
  const currentRun = ++runId
  loading.value = true
  destroyApplication()
  if (container.value) {
    container.value.replaceChildren()
    delete container.value.dataset.spineAnimation
    delete container.value.dataset.spineAnimated
    delete container.value.dataset.spineMotionRatio
  }

  try {
    const basePath = props.src.slice(0, props.src.lastIndexOf('/') + 1)
    const [skeletonResponse, atlasResponse] = await Promise.all([
      fetch(props.src),
      fetch(props.src.replace(/\.json$/i, '.atlas'))
    ])
    if (!skeletonResponse.ok || !atlasResponse.ok) throw new Error('Spine assets unavailable')
    const [skeletonJson, atlasText] = await Promise.all([skeletonResponse.json(), atlasResponse.text()])
    if (currentRun !== runId || !container.value) return

    const atlas = new TextureAtlas(atlasText, (textureName, callback) => callback(BaseTexture.from(basePath + textureName)))
    const skeletonData = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(skeletonJson)

    for (const skin of skeletonData.skins) {
      for (const attachment of skin.getAttachments()) {
        const slot = skeletonData.slots[attachment.slotIndex]
        if (slot && shadowSlotPattern.test(slot.name)) skin.removeAttachment(attachment.slotIndex, attachment.name)
      }
    }

    const app = new Application({
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
      resizeTo: container.value
    })
    application = app
    container.value.appendChild(app.view)

    const figure = new Spine(skeletonData)
    for (const slot of figure.skeleton.slots) {
      if (shadowSlotPattern.test(slot.data.name)) slot.setAttachment(null)
    }

    const animations = skeletonData.animations || []
    const idle = animations.find(animation => animation.name === 'daiji')
      || animations.find(animation => animation.name === 'idle')
      || animations.find(animation => /^idle/i.test(animation.name))
    let motionRatio = null
    let safeIdle = false

    // Some extracted rigs contain an "idle" track that moves the character's
    // feet across the scene. Sample the bottom bones before enabling playback
    // so a broken track cannot make the preview slide or jump.
    if (idle) {
      figure.autoUpdate = false
      figure.skeleton.setToSetupPose()
      figure.skeleton.updateWorldTransform()

      const bones = figure.skeleton.bones
      let minY = Infinity
      let maxY = -Infinity
      for (const bone of bones) {
        minY = Math.min(minY, bone.worldY)
        maxY = Math.max(maxY, bone.worldY)
      }

      const skeletonHeight = maxY - minY || 1
      const bottomBones = bones.filter(bone => bone.worldY <= minY + skeletonHeight * 0.2)
      const setupPositions = bottomBones.map(bone => [bone.worldX, bone.worldY])
      const duration = idle.duration || 1
      let previousTime = 0
      let maxMovement = 0

      figure.state.setAnimation(0, idle.name, true)
      for (let sample = 0; sample <= 8; sample++) {
        const sampleTime = duration * sample / 8
        figure.update(sampleTime - previousTime)
        previousTime = sampleTime
        figure.skeleton.updateWorldTransform()
        bottomBones.forEach((bone, index) => {
          const [setupX, setupY] = setupPositions[index]
          maxMovement = Math.max(maxMovement, Math.hypot(bone.worldX - setupX, bone.worldY - setupY) / skeletonHeight)
        })
      }

      motionRatio = maxMovement
      safeIdle = maxMovement < 0.3
    }

    if (idle && safeIdle) {
      figure.skeleton.setToSetupPose()
      figure.state.setAnimation(0, idle.name, true)
      figure.autoUpdate = true
    } else {
      figure.state.clearTracks()
      figure.skeleton.setToSetupPose()
      figure.autoUpdate = false
    }
    figure.update(0)

    container.value.dataset.spineAnimation = idle?.name || ''
    container.value.dataset.spineAnimated = String(Boolean(idle && safeIdle))
    container.value.dataset.spineMotionRatio = motionRatio == null ? '' : motionRatio.toFixed(4)

    app.stage.addChild(figure)
    const fitFigure = () => {
      const width = app.renderer.width / app.renderer.resolution
      const height = app.renderer.height / app.renderer.resolution
      figure.skeleton.updateWorldTransform()
      const bounds = figure.getLocalBounds()
      if (!width || !height || !bounds.width || !bounds.height) return
      const scale = Math.min((width * 0.94) / bounds.width, (height * 0.94) / bounds.height)
      figure.scale.set(scale)
      figure.position.set(width / 2 - (bounds.x + bounds.width / 2) * scale, height - (bounds.y + bounds.height) * scale)
    }
    fitFigure()
    app.renderer.on('resize', fitFigure)
    loading.value = false
    emit('loaded', {
      animation: idle?.name || null,
      animated: Boolean(idle && safeIdle),
      motionRatio
    })
  } catch (error) {
    if (currentRun !== runId) return
    loading.value = false
    destroyApplication()
    emit('fail', error)
  }
}

watch(() => props.src, loadFigure, { immediate: true, flush: 'post' })
onBeforeUnmount(() => {
  runId++
  destroyApplication()
})
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="container" class="h-full w-full [&_canvas]:block" />
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <span class="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-opm-gold" />
    </div>
  </div>
</template>
