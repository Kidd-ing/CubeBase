<template>
  <div class="page-base changelog-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="goBack">
          <ArrowLeft :size="22" />
        </button>
        <h1 class="page-title">更新日志</h1>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container flex-1 overflow-auto pb-safe">
      <!-- 3.10.2版本更新日志 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('changelog3102')">
          <h2 class="section-title">魔小库 CubeBase 3.10.2版本更新日志</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.changelog3102 }" />
        </div>
        <div v-show="expandedSections.changelog3102" class="section-content">
          <ol class="changelog-list">
            <li>1、新增三阶顶层视角图例箭头标记编辑功能，支持绘制单向、双向箭头</li>
            <li>2、数据导出与应用内备份支持按模块细化选择</li>
            <li>3、数据导入支持增量导入，避免数据覆盖</li>
            <li>4、数据导入支持勾选所需内容，自动识别并标记本地已存在同名模块，提示将被覆盖更新</li>
            <li>5、数据重置同步支持按模块细化选择，可灵活指定重置范围</li>
            <li>6、修复部分已知问题，优化数据管理交互体验</li>
          </ol>
        </div>
      </div>

      <!-- 3.10.1版本更新日志 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('changelog3101')">
          <h2 class="section-title">魔小库 CubeBase 3.10.1版本更新日志</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.changelog3101 }" />
        </div>
        <div v-show="expandedSections.changelog3101" class="section-content">
          <ol class="changelog-list">
            <li>1、新增二阶、四阶模式，可自由切换，各模式数据独立存储</li>
            <li>2、完善四阶魔方全套公式支持，覆盖全场景旋转操作</li>
            <li>3、新增公式歧义智能检测，自动识别公式输入歧义问题</li>
            <li>4、全局 UI 交互统一优化，统一首页、状态集、状态详情等页面下拉菜单交互逻辑</li>
            <li>5、重构底层模式管理体系，配置化拓展新模式，优化多模式切换稳定性</li>
            <li>6、支持自定义导出或导入特定模式的数据</li>
            <li>7、修复部分已知问题</li>
          </ol>
        </div>
      </div>

      <!-- 3.9.4版本更新日志 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('changelog394')">
          <h2 class="section-title">魔小库 CubeBase 3.9.4 版本更新日志</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.changelog394 }" />
        </div>
        <div v-show="expandedSections.changelog394" class="section-content">
          <ol class="changelog-list">
            <li>1、新增个性主题，支持九种主题配色切换</li>
            <li>2、新增主界面壁纸，支持上传自定义壁纸</li>
            <li>3、新增导航栏及卡片样式，支持不透明、半透明、全透明三种模式切换</li>
            <li>4、优化公式编辑弹窗的按钮成员，减少冗余</li>
            <li>5、优化公式编辑弹窗输入法拉起逻辑，优化操作体验</li>
            <li>6、新增模块卡片统计信息，显示当前模块下保存的状态数量及公式数量</li>
            <li>7、优化状态集卡片统计信息，增加已掌握状态数量统计显示</li>
            <li>8、修复部分已知bug</li>
          </ol>
        </div>
      </div>

      <!-- 3.9.3版本更新日志 -->
      <div class="about-section">
        <div class="section-header" @click="toggleSection('changelog')">
          <h2 class="section-title">魔小库 CubeBase 3.9.3 版本更新日志</h2>
          <ChevronDown :size="18" class="toggle-icon" :class="{ rotated: expandedSections.changelog }" />
        </div>
        <div v-show="expandedSections.changelog" class="section-content">
          <ol class="changelog-list">
            <li>1、新增一键生成逆向打乱公式，为任意状态生成指定公式的逆向公式，作为打乱指引</li>
            <li>2、新增R'2等一共18个公式字母成员，支持录入'2公式成员</li>
            <li>3、支持录入任意数字，实现录入类似 (RUR'U')3，公式段重复执行的公式格式</li>
            <li>4、支持录入公式字母接任意数字，实现R3、U'99等成员的录入</li>
            <li>5、新增校验规则，保证公式中左右括号数量匹配</li>
            <li>6、页面右上角增加提示按钮，点击弹出此页面的相关提示信息</li>
            <li>7、长按公式卡片增加卡片弹出动画，引导用户左滑展开编辑按钮</li>
            <li>8、修复部分已知bug</li>
          </ol>
        </div>
      </div>

      <!-- 底部留白占位符 -->
      <div class="h-3 shrink-0"></div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronDown } from 'lucide-vue-next'

const router = useRouter()

// 默认展开更新日志（3.10.2默认展开，其余默认折叠）
const expandedSections = reactive({
  changelog3102: true,
  changelog3101: false,
  changelog394: false,
  changelog: false
})

function goBack() {
  router.replace('/settings/about')
}

function toggleSection(section) {
  expandedSections[section] = !expandedSections[section]
}
</script>

<style scoped>
/* 更新日志页特有样式（统一样式已提取到 index.css） */

/* ======== 通用区块样式（与关于页一致）======= */
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

/* 更新日志列表 */
.changelog-list {
  padding-left: 0;
  margin: 0;
  list-style: none;
}

.changelog-list li {
  font-size: 14px;
  color: #4E5969;
  margin: 0 0 12px 0;
  line-height: 1.6;
  text-align: justify;
}

.changelog-list li:last-child {
  margin-bottom: 0;
}
</style>
