<template>
  <div class="page-base settingsabout-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="goBack">
          <ArrowLeft :size="22" />
        </button>
        <h1 class="page-title">关于</h1>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container flex-1 overflow-auto pb-safe">
      <!-- 顶部标题区 -->
      <div class="about-header">
        <div class="about-logo">
          <img src="@/assets/images/app-icon.png" alt="魔小库" class="logo-image" />
        </div>
        <h1 class="about-title">魔小库 CubeBase</h1>
        <p class="about-version">版本号：V{{ appVersion }}</p>
      </div>

      <!-- 产品简介 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('intro')">
          <h2 class="section-title">产品简介</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.intro }" />
        </div>
        <div v-show="expandedSections.intro" class="section-content">
          <p class="about-desc">
            魔小库 CubeBase，一款纯离线魔方CFOP个人公式库工具，专注为魔方爱好者提供不同模块公式收纳与管理服务。
          </p>
          <p class="about-desc">
            无需联网，本地存储所有数据，打造专属、安全、便捷的魔方公式私藏库，助力高效记公式、练公式。
          </p>
        </div>
      </div>

      <!-- 核心特色 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('features')">
          <h2 class="section-title">核心特色</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.features }" />
        </div>
        <div v-show="expandedSections.features" class="section-content">
          <ul class="feature-list">
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>内置F2L、OLL、PLL核心模块，同时支持自定义新增模块，灵活适配个性化需求</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>模块图例可手动构建，内置专属模板+快捷填色功能，无需额外找图，操作便捷</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>支持创建自定义状态集，可按场景分类管理（如十字O、一字O、点O等），查找更高效</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>支持手动创建自定义状态，轻松管理个人非标状态，满足进阶练习需求</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>状态可添加至任意状态集，同一个状态支持同时归入多个不同状态集，分类更灵活</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>状态集内支持移除与删除两种操作：移除仅将状态从当前集合中移出，不删除状态实体；删除则彻底删除状态，同步从所有状态集中移除</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>状态图例可自主构建，内置模板搭配快捷填色，新手也能快速制作专属图例</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>支持自定义状态排序，可按个人习惯调整顺序，贴合自身记忆逻辑</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>可添加自定义公式，支持标记公式起手状态与掌握情况，针对性练习更高效</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>状态内任意一条公式标记为已掌握，公式及状态卡片将显示小绿标，直观呈现掌握进度</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>支持自定义公式排序，可按熟练度、起手类型等灵活调整，方便重点记忆</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>字母公式与图片公式自动映射，直观易懂，新手也能快速看懂复杂公式</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>内置字母图片映射方案，同时支持自定义上传映射图片，打造专属公式展示风格</span>
            </li>
            <li class="feature-item">
              <span class="feature-check">🟢</span>
              <span>纯本地离线运行，数据安全不泄露；支持APP内部备份，以及数据导入导出，灵活留存</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 开发者信息 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('developer')">
          <h2 class="section-title">开发者信息</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.developer }" />
        </div>
        <div v-show="expandedSections.developer" class="section-content">
          <div class="info-item">
            <span class="info-label">开发者：</span>
            <span class="info-value">Kidding</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系我：</span>
          </div>
          <div class="info-item info-item-indent">
            <span class="info-label">邮箱：</span>
            <a href="mailto:2190853675@qq.com" target="_blank" class="info-link info-value">2190853675@qq.com</a>
          </div>
          <div class="info-item info-item-indent">
            <span class="info-label">哔站：</span>
            <a href="https://b23.tv/iGwHwNp" target="_blank" class="info-link info-value">Kidding丨的个人空间-哔哩哔哩</a>
          </div>
          <div class="info-item info-item-indent">
            <span class="info-label">QQ群：</span>
            <span class="info-link info-value" @click="copyQQGroup">437667062</span>
          </div>
          <div class="info-item">
            <span class="info-label">开发理念：</span>
            <span class="info-value">只为魔方爱好者，打造纯粹、好用的个人公式库工具</span>
          </div>
        </div>
      </div>

      <!-- 作者碎碎念 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('story')">
          <h2 class="section-title">作者碎碎念</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.story }" />
        </div>
        <div v-show="expandedSections.story" class="section-content">
          <p class="about-desc">
            这款《魔小库》APP是个人独立开发为爱发电，纯离线无任何广告，完全出于魔方爱好制作。本人并非专业程序员，全程借助 AI 辅助完成，没有手写一行代码。
          </p>
          <p class="about-desc">
            做这款 APP 的初衷很简单：魔方公式繁多，靠脑子记、笔记本记、官方图纸记、收藏视频记，个人觉得都不够优雅。每个状态又有多条顺手公式，一直缺少一个能专属管理个人魔方公式库的工具。
          </p>
          <p class="about-desc">
            所以决定自己做一个，我内置了 F2L、OLL、PLL 三大常用模块，同时支持自定义新增模块，比如层先法、花式等都可以自己新建模块，随心记录。
          </p>
          <p class="about-desc">
            原本打算状态图例直接上传图片，后来发现找图、上传太过繁琐，于是干脆做了一个快捷填色、手动构造图例功能，基本能手动复刻绝大多数魔方状态，不用再到处找素材。
          </p>
          <p class="about-desc">
            你可以自由收录自己顺手的公式，自定义排序、留存备注，只保留适合自己的解法；还能创建专属状态集，把相似形态、同类特征的状态归为一类，比如点 O、一字 O、十字 O 分组。同一个状态可加入多个状态集，就像歌曲放进不同歌单，分类更自由。
          </p>
          <p class="about-desc">
            每条公式支持标记起手方式和掌握进度，已掌握的公式和状态会自动显示绿标提醒，方便自查练习。同时支持字母公式自动映射生成图片公式，新手就算看不懂魔方字母符号，照着图形也能跟着还原，降低入门门槛。
          </p>
          <p class="about-desc">
            个人精力有限，开发与适配难免存在 BUG，还请大家多多谅解。欢迎大家随时反馈问题和建议，我会尽力持续维护、优化迭代。
          </p>
        </div>
      </div>

      <!-- 打赏作者 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('donate')">
          <h2 class="section-title">打赏作者</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.donate }" />
        </div>
        <div v-show="expandedSections.donate" class="section-content">
          <p class="about-desc">
            魔小库 全程免费使用、纯离线、无广告本工具永久公益自用，任何主动付费均为诈骗
          </p>
          <p class="about-desc">
            如果你觉得这款工具好用、用得顺手，愿意支持作者后续持续优化更新，可随心自愿打赏，金额随意。
          </p>
          <p class="about-desc">
            所有功能完全开放，不打赏也不限制任何使用权限，纯粹为爱发电，感谢各位魔友使用。
          </p>
          <p class="about-desc">
            所有善意支持皆心怀感念，但凡给予过支持的魔友，无论心意大小，均可前往 B 站私信我，领取本人精心整理的 F2L、OLL、PLL 全套标态公式完整备份文件。
          </p>
          <p class="about-desc">
            愿每位魔友手感常在线，衔接无卡顿，早日突破自己理想的成绩！
          </p>
          <div class="donate-qrcode-group">
            <div class="donate-qrcode-item" @click="openDonatePreview('wechat')">
              <img :src="donateWechatSrc" alt="微信打赏" class="donate-qrcode-img" />
              <span class="donate-qrcode-label">微信</span>
            </div>
            <div class="donate-qrcode-item" @click="openDonatePreview('alipay')">
              <img :src="donateAlipaySrc" alt="支付宝打赏" class="donate-qrcode-img" />
              <span class="donate-qrcode-label">支付宝</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 打赏二维码预览弹窗 -->
      <EditDialog
        v-model="showDonatePreview"
        :title="previewingDonateType === 'wechat' ? '微信打赏' : '支付宝打赏'"
        confirm-text="保存图片"
        :confirm-btn-class="previewingDonateType === 'wechat' ? 'confirm-wechat' : 'confirm-alipay'"
        dialog-class="donate-preview-dialog"
        @submit="handleSaveImage"
      >
        <div class="image-editor">
          <div class="preview-area">
            <img v-if="previewingDonateSrc" :src="previewingDonateSrc" class="preview-img" />
          </div>
        </div>
      </EditDialog>

      <!-- 更新日志 -->
      <div class="about-section" @click="goToUpdateLog">
        <div class="section-header section-header-clickable">
          <h2 class="section-title">更新日志</h2>
          <ChevronRight :size="18" class="toggle-icon" />
        </div>
      </div>

      <div class="about-section">
        <div class="section-header" @click="toggleSection('privacy')">
          <h2 class="section-title">隐私说明</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.privacy }" />
        </div>
        <div v-show="expandedSections.privacy" class="section-content privacy-content">
          <ol class="privacy-list">
            <li>本APP为纯离线工具，所有数据（公式、状态集、备注等）均存储在您的设备本地，不联网、不上传、不收集任何个人信息。</li>
            <li>自定义的公式、状态集等内容，仅您本人可查看、编辑、删除，无任何第三方访问权限。</li>
            <li>若您卸载APP，本地存储的数据将随之删除，卸载前请自行做好数据备份。</li>
          </ol>
        </div>
      </div>

      <!-- 免责声明 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('disclaimer')">
          <h2 class="section-title">免责声明</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.disclaimer }" />
        </div>
        <div v-show="expandedSections.disclaimer" class="section-content disclaimer-content">
          <ol class="disclaimer-list">
            <li>本APP仅提供魔方公式的存储、管理、展示服务，不承担因公式使用、练习产生的任何责任。</li>
            <li>APP内所有公式、图例素材均由用户自行提供或参考公开资源，若存在侵权，请联系开发者删除。</li>
            <li>开发者将尽力保障APP正常运行，但不保证无任何BUG，若因APP故障造成数据丢失，不承担相关责任，建议用户定期备份数据。</li>
          </ol>
        </div>
      </div>

      <!-- 底部版权信息 -->
      <div class="about-footer">
        <p class="copyright">© 2026 魔小库 CubeBase 版权所有 | 保留一切权利</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import EditDialog from '@/components/EditDialog.vue'
import { saveScrollPosition, getScrollPosition, clearScrollPosition, PAGE_KEYS } from '@/utils/scrollPosition'

const router = useRouter()

// 应用版本号（自动读取原生应用版本）
const appVersion = ref('1.0.0')

onMounted(async () => {
  try {
    const { App } = await import('@capacitor/app')
    const info = await App.getInfo()
    if (info.version) {
      appVersion.value = info.version
    }
  } catch (e) {
    // Web环境或读取失败时使用默认值
    console.warn('获取应用版本信息失败:', e)
  }

  // 恢复滚动位置
  const savedScrollTop = getScrollPosition(PAGE_KEYS.SETTINGS_ABOUT)

  nextTick(() => {
    if (savedScrollTop > 0) {
      window.scrollTo({ top: savedScrollTop, behavior: 'instant' })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  })
})

// 用 import.meta.glob 扫描 donate 目录下所有图片，支持任意常规格式
const donateImageModules = import.meta.glob('../assets/images/donate/donate-*.{png,jpg,jpeg,webp,svg}', { eager: true, as: 'url' })

// 根据文件名前缀（wechat / alipay）提取对应的图片 URL
function getDonateSrc(name) {
  const matchKey = Object.keys(donateImageModules).find(key => key.includes(`donate-${name}.`))
  return matchKey ? donateImageModules[matchKey] : ''
}

const donateWechatSrc = getDonateSrc('wechat')
const donateAlipaySrc = getDonateSrc('alipay')

// 打赏二维码预览弹窗
const showDonatePreview = ref(false)
const previewingDonateType = ref('')
const previewingDonateSrc = computed(() =>
  previewingDonateType.value === 'wechat' ? donateWechatSrc : donateAlipaySrc
)

function openDonatePreview(type) {
  if (!getDonateSrc(type)) return
  previewingDonateType.value = type
  showDonatePreview.value = true
}

async function handleSaveImage() {
  try {
    const imageUrl = previewingDonateSrc.value
    if (!imageUrl) {
      ElMessage.error('未找到图片')
      return
    }

    const { Capacitor } = await import('@capacitor/core')
    const platform = Capacitor.getPlatform()

    if (platform === 'android') {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')

      let base64Data = ''
      let imageType = 'png'

      if (imageUrl.startsWith('data:')) {
        const match = imageUrl.match(/^data:image\/([^;]+);base64,(.+)$/)
        if (match) {
          imageType = match[1]
          base64Data = match[2]
        }
      } else {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        imageType = blob.type.replace('image/', '')
        base64Data = await blobToBase64(blob)
      }

      const fileName = `donate-${previewingDonateType.value}-${Date.now()}.${imageType}`

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      })

      ElMessage.success(`图片已保存到 Documents 目录`)
    } else {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `donate-${previewingDonateType.value}.png`
      link.click()
      ElMessage.success('图片已下载')
    }
  } catch (e) {
    console.error('保存图片失败:', e)
    ElMessage.error(e.message || '保存图片失败')
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function handleOpenScan() {
  // TODO: 跳转扫一扫功能待实现
}

// 产品简介、核心特色、开发者信息、作者碎碎念、打赏作者默认展开，隐私说明、免责声明默认折叠
const expandedSections = reactive({
  intro: true,
  features: true,
  developer: true,
  story: true,
  donate: true,
  privacy: false,
  disclaimer: false
})

function goBack() {
  router.replace('/settings')
}

function goToUpdateLog() {
  // 记录当前滚动位置
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
  saveScrollPosition(PAGE_KEYS.SETTINGS_ABOUT, null, scrollTop)

  // 清除更新日志页的滚动位置记录，确保进入时从顶部显示
  clearScrollPosition(PAGE_KEYS.UPDATE_LOG)

  router.replace('/settings/changelog')
}

function toggleSection(section) {
  expandedSections[section] = !expandedSections[section]
}

// 点击复制 QQ 群号
async function copyQQGroup() {
  const text = '437667062'
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // 降级方案：使用 execCommand
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success('QQ群号已复制')
  } catch (e) {
    console.error('复制失败:', e)
    ElMessage.error('复制失败，请手动复制')
  }
}
</script>

<style scoped>
/* 关于页特有样式（统一样式已提取到 index.css） */

/* ======== 功能内容（保持原有不变）======= */

/* 顶部标题区 */
.about-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px 32px;
}

.about-logo {
  width: 80px;
  height: 80px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 20px;
  margin-bottom: 16px;
  overflow: hidden;
  position: relative;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.about-title {
  font-size: 22px;
  font-weight: 600;
  color: #1D2129;
  margin: 0 0 8px 0;
}

.about-version {
  font-size: 14px;
  color: #86909C;
  margin: 0;
}

/* 通用区块样式 */
.about-section {
  background: #FFFFFF;
  margin: 0 16px 12px;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
  margin: 0;
}

.toggle-icon {
  color: #86909C;
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.section-content {
  padding: 0 16px 16px;
  line-height: 1.6;
}

/* 产品简介 */
.about-desc {
  font-size: 14px;
  color: #4E5969;
  margin: 0 0 12px 0;
  text-align: justify;
}

.about-desc:last-child {
  margin-bottom: 0;
}

/* 核心特色 */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  font-size: 14px;
  color: #4E5969;
  padding: 8px 0;
  display: flex;
  gap: 8px;
}

.feature-check {
  flex-shrink: 0;
}

/* 开发者信息 */
.info-item {
  font-size: 14px;
  padding: 8px 0;
}

.info-item-indent {
  padding-left: 16px;
}

.info-label {
  color: #86909C;
}

.info-value {
  color: #1D2129;
}

.info-link {
  color: #1677FF;
  text-decoration: underline;
}

.info-link:active {
  opacity: 0.7;
}

/* 隐私说明 */
.privacy-content,
.disclaimer-content {
  padding-bottom: 16px;
}

.privacy-list,
.disclaimer-list,
.changelog-list {
  padding-left: 0;
  margin: 0;
  list-style: none; /* 移除默认序号，视觉上与其他区块一致 */
}

.privacy-list li,
.disclaimer-list li,
.changelog-list li {
  font-size: 14px;
  color: #4E5969;
  margin: 0 0 12px 0;
  line-height: 1.6;
  text-align: justify;
}

.privacy-list li:last-child,
.disclaimer-list li:last-child,
.changelog-list li:last-child {
  margin-bottom: 0;
}

/* 打赏二维码 */
.donate-qrcode-group {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.donate-qrcode-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.donate-qrcode-img {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid #E5E6EB;
  object-fit: cover;
  background: #F5F7FA;
}

/* 打赏二维码预览弹窗 */

.donate-preview-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-editor {
  display: flex;
  flex-direction: column;
}

.preview-area {
  width: 100%;
  aspect-ratio: 1;
  border: 1px dashed #DCDFE6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #F5F7FA;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 底部版权 */
.about-footer {
  padding: 32px 16px;
  text-align: center;
}

.copyright {
  font-size: 12px;
  color: #86909C;
  margin: 0;
}

/* 更新日志卡片点击样式 */
.section-header-clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.section-header-clickable:hover {
  background-color: #F5F7FA;
}

.section-header-clickable:active {
  background-color: #E5E6EB;
}
</style>
