# 魔方公式库 Android App

基于 Vue 3 + Vite + Capacitor 技术栈，面向三阶魔方 CFOP 学习者的本地离线公式管理 Android App。

## 技术栈

- **前端框架**: Vue 3 + Vite
- **UI 组件库**: Element Plus（移动端适配）
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **本地数据库**: Dexie.js（IndexedDB 封装）
- **拖拽排序**: vuedraggable@next
- **图片处理**: browser-image-compression
- **Android 打包**: Capacitor 6

## 项目结构

```
/src
  /components    # 公共复用组件
  /stores        # Pinia 状态管理
  /db            # Dexie 数据库定义、初始化
  /utils         # 工具函数
  /views         # 页面组件
  /router        # 路由配置
  /assets        # 静态资源
```

## 功能模块

### 1. 首页 - 模块管理
- 内置模块：F2L / OLL / PLL（不可删除，仅可编辑名称描述）
- 自定义模块：增删改、拖拽排序
- 删除时级联删除所有子数据

### 2. 模块页 - 状态集管理
- 每个模块内置"全部状态"状态集（不可删除）
- 自定义状态集：增删改、拖拽排序
- 删除仅删除集合+关联关系，不删除实体

### 3. 状态集页 - 状态列表
- 状态展示：图例+名称+描述+公式数量
- 长按多选模式：批量操作
- 内置"全部状态"集仅允许删除；自定义集支持移除

### 4. 状态详情页 - 公式管理（核心功能）
- 公式字段：字母公式、图形公式（自动映射拼接）、起手方式、备注
- 字母公式输入：键盘输入 + 快捷按钮面板
- 允许字符：R R' R2 L L' L2 U U' U2 D D' D2 F F' F2 B B' B2 等

### 5. 设置页
- 字母图片映射：每个字母上传/预览/删除自定义图片
- 数据导入导出：JSON 格式，包含所有数据和图片资源

## 数据库表结构（6张表）

1. **modules**: id, name, desc, type, sort, createTime
2. **sets**: id, moduleId, name, desc, type, sort, createTime
3. **states**: id, name, desc, image(Base64), imageType, createTime
4. **stateSetRel**: id, stateId, setId, sort
5. **formulas**: id, stateId, content, formatted, hand, remark, sort, createTime
6. **letterImages**: letter, image(Base64), imageType, updateTime

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 同步到 Android
npx cap sync android

# 打开 Android Studio
npx cap open android
```

## Android APK 构建

在 Android Studio 中打开 `android` 目录，或在命令行执行：

```bash
cd android
./gradlew assembleDebug
```

APK 文件将生成在 `android/app/build/outputs/apk/debug/` 目录。

## 全局规则

- 唯一性校验：同层级名称不可重复
- 删除逻辑区分：移除 vs 删除
- 交互统一：长按=多选、拖动手柄=排序、操作后Toast提示、删除二次确认
- 图片全格式支持: PNG/JPG/JPEG/WebP/SVG/GIF, Base64存储
- 兼容 Android 8.0+

## UI 规范

- 主色：#165DFF
- 内置模块色：F2L=#2563EB, OLL=#4F46E5, PLL=#9333EA
- 背景：#F5F7FA，卡片：#FFFFFF
- 卡片圆角12px，按钮圆角8px

## 开源协议

本项目基于 [MIT License](LICENSE) 开源，欢迎自由使用、修改和分发。
