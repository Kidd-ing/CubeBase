/**
 * 数据导入导出工具
 * 完整导出/导入所有用户数据，包括内置模块中的自定义状态
 * 
 * 数据模型：
 * - modules: 模块表 (id, name, desc, type, sort, image(Base64), imageType, createTime, cubeMode)
 * - sets: 状态集表 (id, moduleId, name, desc, type, sort, createTime, cubeMode)
 * - states: 状态表 (id, name, desc, image, imageType, createTime, cubeMode)
 * - stateSetRel: 状态-状态集关联表 (id, stateId, setId, sort, cubeMode)
 * - formulas: 公式表 (id, stateId, content, hand, remark, mastered, sort, createTime, cubeMode)
 * - letterImages: 字母图片表 (letter, image, imageType, updateTime)
 */
import db from '@/db'
import dayjs from 'dayjs'
import { resetDatabase, fixMissingStateRelations } from '@/db/seed'
import { useCubeModeStore } from '@/stores/cubeModeStore'
import { DEFAULT_MODULE_LEGENDS } from '@/db/defaultLegends'

// 三阶内置模块预设描述
const BUILT_IN_MODULE_DESCS_3X3 = {
  'F2L': 'First Two Layers',
  'OLL': 'Orientation of Last Layer',
  'PLL': 'Permutation of Last Layer'
}

/**
 * 判断三阶内置模块是否处于初始状态（image/imageType/desc 均未被修改）
 * @param {Object} mod - 模块记录
 * @returns {boolean} true=初始状态，false=已被编辑
 */
function isBuiltInModulePristine(mod) {
  const legend = DEFAULT_MODULE_LEGENDS[mod.name]
  if (!legend) return false
  if (mod.image !== legend.image) return false
  if (mod.imageType !== legend.imageType) return false
  if (mod.desc !== BUILT_IN_MODULE_DESCS_3X3[mod.name]) return false
  return true
}

// 三阶内置模块名称列表
const BUILT_IN_MODULE_NAMES_3X3 = ['F2L', 'OLL', 'PLL']
// 二阶内置模块名称列表
const BUILT_IN_MODULE_NAMES_2X2 = ['CLL', 'EG-1', 'EG-2']

const BUILT_IN_MODULE_NAMES = [...BUILT_IN_MODULE_NAMES_3X3, ...BUILT_IN_MODULE_NAMES_2X2]

function getModuleDesc(name) {
  const descMap = {
    'F2L': 'First Two Layers',
    'OLL': 'Orientation of Last Layer',
    'PLL': 'Permutation of Last Layer',
    'CLL': 'Corners of Last Layer',
    'EG-1': 'EG Method Step 1',
    'EG-2': 'EG Method Step 2'
  }
  return descMap[name] || ''
}

/**
 * 导出所有数据
 * @param {string[]} modes - 需要导出的模式列表，如 ['2x2', '3x3']。为空或不传则导出全部
 * @param {Object} moduleFilters - 按模式指定的模块白名单，如 { '3x3': [1, 2] }。
 *   仅列出需要细分的模式；未列出的模式整体导出。
 *   值为空数组的模式等价于不选（调用方应已剔除该模式）。
 */
export async function exportAllData(modes = null, moduleFilters = null) {
  const [allModules, allSets, allStates, allStateSetRels, allFormulas, allLetterImages] = await Promise.all([
    db.modules.toArray(),
    db.sets.toArray(),
    db.states.toArray(),
    db.stateSetRel.toArray(),
    db.formulas.toArray(),
    db.letterImages.toArray()
  ])

  // 按模式过滤
  const filterByMode = (arr) => {
    if (!modes || modes.length === 0) return arr
    return arr.filter(r => modes.includes(r.cubeMode || '3x3'))
  }

  // letterImages 通过 letter 字段前缀过滤（格式为 `${cubeMode}_${letter}`，如 3x3_R）
  const filterLetterImagesByMode = (arr) => {
    if (!modes || modes.length === 0) return arr
    return arr.filter(img => modes.some(m => img.letter.startsWith(m + '_')))
  }

  let modules = filterByMode(allModules)
  let sets = filterByMode(allSets)
  let states = filterByMode(allStates)
  let stateSetRels = filterByMode(allStateSetRels)
  let formulas = filterByMode(allFormulas)
  const letterImages = filterLetterImagesByMode(allLetterImages)

  // 按模块二次过滤：模块 → 状态集 → 关联 → 状态 → 公式 逐级收窄
  const res = filterByModules({ modules, sets, stateSetRels, states, formulas }, moduleFilters)
  modules = res.modules
  sets = res.sets
  stateSetRels = res.stateSetRels
  states = res.states
  formulas = res.formulas

  const moduleInfoMap = {}
  modules.forEach(m => { moduleInfoMap[m.id] = m })

  return {
    version: 3,
    exportTime: new Date().toISOString(),
    exportModes: modes && modes.length > 0 ? modes : 'all',
    // 记录本次导出涉及的模块，仅作追溯用途，导入时不读取
    // 深拷贝去掉可能的 Vue 响应式 Proxy，避免数据被写入 IndexedDB（应用内备份）时结构化克隆失败
    exportModules: moduleFilters ? JSON.parse(JSON.stringify(moduleFilters)) : undefined,
    data: {
      modules: modules.map(m => ({
        id: m.id,
        name: m.name,
        desc: m.desc || '',
        type: m.type,
        sort: m.sort,
        image: m.image || '',
        imageType: m.imageType || '',
        createTime: m.createTime,
        cubeMode: m.cubeMode || '3x3'
      })),

      sets: sets.map(s => ({
        id: s.id,
        moduleId: s.moduleId,
        name: s.name,
        desc: s.desc || '',
        type: s.type,
        sort: s.sort,
        createTime: s.createTime,
        cubeMode: s.cubeMode || '3x3'
      })),

      states: states.map(s => ({
        id: s.id,
        name: s.name,
        desc: s.desc || '',
        image: s.image || '',
        imageType: s.imageType || '',
        createTime: s.createTime,
        cubeMode: s.cubeMode || '3x3'
      })),

      stateSetRels: stateSetRels.map(rel => ({
        id: rel.id,
        stateId: rel.stateId,
        setId: rel.setId,
        sort: rel.sort,
        cubeMode: rel.cubeMode || '3x3'
      })),

      formulas: formulas.map(f => ({
        id: f.id,
        stateId: f.stateId,
        content: f.content || '',
        hand: f.hand || '',
        remark: f.remark || '',
        mastered: f.mastered || false,
        isScramble: f.isScramble || false,
        sort: f.sort,
        createTime: f.createTime,
        cubeMode: f.cubeMode || '3x3'
      })),

      letterImages: letterImages.map(img => ({
        letter: img.letter,
        image: img.image || '',
        imageType: img.imageType || 'image/png',
        updateTime: img.updateTime
      }))
    }
  }
}

/**
 * 按模块白名单过滤数据
 * 数据链路：模块 → 状态集 → 状态-状态集关联 → 状态 → 公式
 * 只保留被选中模块名下的记录；未列入 moduleFilters 的模式原样保留（整体导出）
 * @param {Object} tables - { modules, sets, stateSetRels, states, formulas }
 * @param {Object|null} moduleFilters - { '3x3': [moduleId, ...] }
 */
function filterByModules(tables, moduleFilters) {
  const { modules, sets, stateSetRels, states, formulas } = tables

  if (!moduleFilters || Object.keys(moduleFilters).length === 0) {
    return tables
  }

  const filteredModes = Object.keys(moduleFilters)
  const hasFilter = (r) => {
    const mode = r.cubeMode || '3x3'
    return filteredModes.includes(mode)
  }

  const keepModuleIds = new Set()
  modules.filter(hasFilter).forEach(m => {
    if (moduleFilters[m.cubeMode || '3x3'].includes(m.id)) keepModuleIds.add(m.id)
  })

  const keepSetIds = new Set()
  sets.filter(hasFilter).forEach(s => {
    if (moduleFilters[s.cubeMode || '3x3'].includes(s.moduleId)) keepSetIds.add(s.id)
  })

  const keepRelIds = new Set()
  const keepStateIds = new Set()
  stateSetRels.filter(hasFilter).forEach(r => {
    if (keepSetIds.has(r.setId)) {
      keepRelIds.add(r.id)
      keepStateIds.add(r.stateId)
    }
  })

  return {
    modules: modules.filter(m => !hasFilter(m) || keepModuleIds.has(m.id)),
    sets: sets.filter(s => !hasFilter(s) || keepSetIds.has(s.id)),
    stateSetRels: stateSetRels.filter(r => !hasFilter(r) || keepRelIds.has(r.id)),
    states: states.filter(s => !hasFilter(s) || keepStateIds.has(s.id)),
    formulas: formulas.filter(f => !hasFilter(f) || keepStateIds.has(f.stateId))
  }
}

/**
 * 判断指定的一批模块是否完全没有用户数据
 * 用于导出前提示"所选数据均为空"
 * @param {number[]} moduleIds - 模块 id 列表
 * @returns {Promise<boolean>}
 */
export async function isModulesEmpty(moduleIds) {
  if (!moduleIds || moduleIds.length === 0) return true

  const mods = await db.modules.where('id').anyOf(moduleIds).toArray()
  const modSets = await db.sets.where('moduleId').anyOf(moduleIds).toArray()
  const setIds = modSets.map(s => s.id)
  const rels = setIds.length ? await db.stateSetRel.where('setId').anyOf(setIds).toArray() : []
  const stateIds = [...new Set(rels.map(r => r.stateId))]
  const formulas = stateIds.length ? await db.formulas.where('stateId').anyOf(stateIds).toArray() : []

  if (formulas.length > 0) return false
  if (rels.length > 0) return false
  if (modSets.some(s => s.type === 'custom')) return false
  if (mods.some(m => m.type === 'custom')) return false
  // 内置模块若被编辑过（图例/描述有改动）也视为有数据
  if (mods.some(m => m.type === 'builtIn' && !isBuiltInModulePristine(m))) return false

  return true
}

/**
 * 判断指定模式的数据是否为空（无用户自定义数据）
 * 三阶：仅有3个内置模块(F2L/OLL/PLL)和3个"全部状态"状态集，无其他数据
 * 二阶/四阶：完全无数据（无内置模块）
 * @param {string} mode - 模式：'2x2' | '3x3' | '4x4'
 * @returns {Promise<boolean>}
 */
export async function isModeDataEmpty(mode) {
  const [modules, sets, states, stateSetRels, formulas, letterImages] = await Promise.all([
    db.modules.where('cubeMode').equals(mode).toArray(),
    db.sets.where('cubeMode').equals(mode).toArray(),
    db.states.where('cubeMode').equals(mode).toArray(),
    db.stateSetRel.where('cubeMode').equals(mode).toArray(),
    db.formulas.where('cubeMode').equals(mode).toArray(),
    db.letterImages.toArray()
  ])

  const modeLetterImages = letterImages.filter(img => img.letter && img.letter.startsWith(mode + '_'))

  if (mode === '3x3') {
    // 三阶：检查是否只有初始内置数据
    if (modules.length !== 3) return false
    if (!modules.every(m => m.type === 'builtIn' && ['F2L', 'OLL', 'PLL'].includes(m.name))) return false
    // 内置模块的 image/imageType/desc 必须均为初始预设值，任意修改则视为非空
    if (!modules.every(m => isBuiltInModulePristine(m))) return false
    if (sets.length !== 3) return false
    if (!sets.every(s => s.type === 'builtIn' && s.name === '全部状态')) return false
    if (states.length > 0) return false
    if (stateSetRels.length > 0) return false
    if (formulas.length > 0) return false
    if (modeLetterImages.length > 0) return false
    return true
  } else {
    // 二阶/四阶：无内置模块，只要有任何数据则非空
    return modules.length === 0 &&
           sets.length === 0 &&
           states.length === 0 &&
           stateSetRels.length === 0 &&
           formulas.length === 0 &&
           modeLetterImages.length === 0
  }
}

/**
 * 判断三阶模式数据是否为空（仅有初始内置模块 F2L/OLL/PLL 和对应的"全部状态"状态集，无任何自定义数据）
 */
function is3x3EmptyData(data) {
  const modules3x3 = (data.modules || []).filter(m => (m.cubeMode || '3x3') === '3x3')
  const sets3x3 = (data.sets || []).filter(s => (s.cubeMode || '3x3') === '3x3')
  const states3x3 = (data.states || []).filter(s => (s.cubeMode || '3x3') === '3x3')
  const stateSetRels3x3 = (data.stateSetRels || []).filter(r => (r.cubeMode || '3x3') === '3x3')
  const formulas3x3 = (data.formulas || []).filter(f => (f.cubeMode || '3x3') === '3x3')
  const letterImages3x3 = (data.letterImages || []).filter(img => img.letter && img.letter.startsWith('3x3_'))

  // 三阶必须只有3个内置模块（F2L、OLL、PLL）
  if (modules3x3.length !== 3) return false
  if (!modules3x3.every(m => m.type === 'builtIn' && ['F2L', 'OLL', 'PLL'].includes(m.name))) return false
  // 内置模块的 image/imageType/desc 必须均为初始预设值，任意修改则视为非空
  if (!modules3x3.every(m => isBuiltInModulePristine(m))) return false

  // 三阶必须只有3个"全部状态"状态集
  if (sets3x3.length !== 3) return false
  if (!sets3x3.every(s => s.type === 'builtIn' && s.name === '全部状态')) return false

  // 三阶不能有任何状态、关联、公式、字母图片
  if (states3x3.length > 0) return false
  if (stateSetRels3x3.length > 0) return false
  if (formulas3x3.length > 0) return false
  if (letterImages3x3.length > 0) return false

  return true
}

/**
 * 分析备份文件中包含哪些模式
 * @param {Object} backupData - 备份数据
 * @returns {string[]} 模式列表，如 ['2x2', '3x3', '4x4']
 */
export function analyzeBackupModes(backupData) {
  if (!backupData || !backupData.data) {
    return []
  }

  const version = backupData.version || 0

  // 旧版备份文件只有三阶数据
  if (version < 3) {
    return ['3x3']
  }

  const data = backupData.data
  const modeSet = new Set()

  // 收集各表的 cubeMode
  const tables = ['modules', 'sets', 'states', 'stateSetRels', 'formulas']
  tables.forEach(table => {
    if (data[table]?.length) {
      data[table].forEach(r => {
        modeSet.add(r.cubeMode || '3x3')
      })
    }
  })

  // 收集 letterImages 的模式前缀（格式为 `${cubeMode}_${letter}`，如 3x3_R）
  if (data.letterImages?.length) {
    data.letterImages.forEach(img => {
      const match = img.letter && img.letter.match(/^(\d+x\d+)_/)
      if (match) {
        modeSet.add(match[1])
      }
    })
  }

  // 如果三阶数据为空（仅有初始内置模块），不视为包含三阶数据
  if (modeSet.has('3x3') && is3x3EmptyData(data)) {
    modeSet.delete('3x3')
  }

  // 按固定顺序返回
  const ALL_MODES = ['2x2', '3x3', '4x4']
  return ALL_MODES.filter(m => modeSet.has(m))
}

/**
 * 分析备份文件中各模式包含的模块列表
 * 用于在导入弹窗中展示「模式下可勾选的模块」
 * @param {Object} backupData - 备份数据
 * @returns {Object} { '2x2': [{id, name, type, sort}], '3x3': [...], '4x4': [...] }
 */
export function analyzeBackupModules(backupData) {
  const result = { '2x2': [], '3x3': [], '4x4': [] }
  if (!backupData || !backupData.data || !Array.isArray(backupData.data.modules)) {
    return result
  }
  backupData.data.modules.forEach(m => {
    const mode = m.cubeMode || '3x3'
    if (!result[mode]) result[mode] = []
    result[mode].push({
      id: m.id,
      name: String(m.name || ''),
      type: m.type || 'custom',
      sort: Number(m.sort || 0)
    })
  })
  Object.values(result).forEach(list => list.sort((a, b) => a.sort - b.sort))
  return result
}

/**
 * 对比备份文件与本地库，判断所选模块是「已存在（将覆盖）」还是「新增（增量导入）」
 * 匹配规则：同一 cubemode 下模块 name 相同即视为同一个模块
 * @param {Object} backupData - 备份数据
 * @param {Object} selected - { '3x3': [备份文件中的模块 id], ... }；某模式未列出或为 null 时，
 *   视为该模式下全部模块都被选中（对应「整模式导入」场景，避免误判为无可导入模块）
 * @param {string[]} modes - 参与导入的模式；为空则取备份文件中含模块的模式
 * @returns {Promise<{overwrite: Array<{mode, name}>, fresh: Array<{mode, name}>}>}
 */
export async function analyzeImportConflicts(backupData, selected, modes = null) {
  const fileModules = analyzeBackupModules(backupData)
  const overwrite = []
  const fresh = []

  const targetModes = (modes && modes.length > 0)
    ? modes
    : Object.keys(fileModules).filter(m => (fileModules[m] || []).length > 0)

  for (const mode of targetModes) {
    const all = fileModules[mode] || []
    if (all.length === 0) continue

    const ids = selected?.[mode]
    const picked = (ids && ids.length > 0)
      ? all.filter(m => ids.includes(m.id))
      : all
    if (picked.length === 0) continue

    const localModules = await db.modules.where('cubeMode').equals(mode).toArray()
    const localNames = new Set(localModules.map(m => m.name))

    picked.forEach(m => {
      if (localNames.has(m.name)) {
        overwrite.push({ mode, name: m.name })
      } else {
        fresh.push({ mode, name: m.name })
      }
    })
  }

  return { overwrite, fresh }
}

/**
 * 导入数据
 * 支持新版多模式备份（version >= 3）和旧版单模式备份
 * 新版走增量导入：同名模块覆盖更新，其余模块新增，备份文件中没有的本地数据保持不变
 * @param {Object} backupData - 备份数据
 * @param {string[]} modes - 需要导入的模式列表，为空或不传则导入全部
 * @param {Object} selectedModules - 模块白名单 { '3x3': [备份文件中的模块 id] }，
 *   仅列出需要细分的模式；未列出或列出全部模块的模式按整模式处理。
 *   为空表示「导入所选模式下的全部模块」
 */
export async function importAllData(backupData, modes = null, selectedModules = null) {
  if (!backupData || !backupData.data) {
    throw new Error('无效的备份文件')
  }

  const version = backupData.version || 0

  if (version >= 3) {
    await importIncrementalData(backupData.data, modes, selectedModules)
  } else {
    await importLegacyData(backupData.data, modes)
  }

  await refreshAllStores()
}

/**
 * 导入新版多模式数据（增量导入）
 *
 * 与旧的「整模式清空再写入」不同：
 * 1. 只收窄到用户勾选的模块数据
 * 2. 若本地已存在同名模块（同一 cubeMode），先删除该模块的子树（状态集/关联/状态/公式），再写入 = 覆盖更新
 * 3. 其余模块直接新增 = 增量导入，备份文件中没有的本地数据一律保留
 * 4. 所有导入记录重新分配 id，避免与本地已有 id 冲突
 */
async function importIncrementalData(data, modes, selectedModules) {
  const { modules, sets, states, stateSetRels, formulas, letterImages } = data

  // 确定要导入的模式：未指定则导入全部
  const importModes = (!modes || modes.length === 0) ? ['2x2', '3x3', '4x4'] : modes

  // 按模式过滤要导入的数据
  const filterByMode = (arr) => {
    if (!arr) return []
    return arr.filter(r => importModes.includes(r.cubeMode || '3x3'))
  }
  const filterLetterImgs = (arr) => {
    if (!arr) return []
    return arr.filter(img => importModes.some(m => img.letter && img.letter.startsWith(m + '_')))
  }

  let fModules = filterByMode(modules)
  let fSets = filterByMode(sets)
  let fStates = filterByMode(states)
  let fStateSetRels = filterByMode(stateSetRels)
  let fFormulas = filterByMode(formulas)
  const fLetterImages = filterLetterImgs(letterImages)

  // 按勾选的模块收窄：模块 → 状态集 → 关联 → 状态 → 公式
  const moduleFilters = buildScopedModuleFilters(fModules, importModes, selectedModules)
  if (moduleFilters) {
    const res = filterByModules(
      { modules: fModules, sets: fSets, stateSetRels: fStateSetRels, states: fStates, formulas: fFormulas },
      moduleFilters
    )
    fModules = res.modules
    fSets = res.sets
    fStateSetRels = res.stateSetRels
    fStates = res.states
    fFormulas = res.formulas
  }

  if (fModules.length === 0 && fLetterImages.length === 0) {
    return
  }

  await db.transaction('rw', db.modules, db.sets, db.states, db.stateSetRel, db.formulas, db.letterImages, async () => {
    // 1. 覆盖模式：删除本地同名模块及其子树
    for (const mode of importModes) {
      const incoming = fModules.filter(m => (m.cubeMode || '3x3') === mode)
      if (incoming.length === 0) continue

      const localModules = await db.modules.where('cubeMode').equals(mode).toArray()
      const incomingNames = new Set(incoming.map(m => m.name))
      const duplicates = localModules.filter(m => incomingNames.has(m.name))
      for (const dup of duplicates) {
        await deleteModuleSubtree(dup.id)
      }
    }

    // 2. 追加模式：所有导入记录重新分配 id，避免与本地 id 冲突
    const moduleIdMap = new Map()
    const setIdMap = new Map()
    const stateIdMap = new Map()

    for (const m of fModules) {
      const newId = await db.modules.add({
        name: String(m.name || ''),
        desc: m.desc || '',
        type: m.type || 'custom',
        sort: Number(m.sort || 0),
        image: m.image || '',
        imageType: m.imageType || '',
        createTime: m.createTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: m.cubeMode || '3x3'
      })
      moduleIdMap.set(m.id, newId)
    }

    for (const s of fSets) {
      const newModuleId = moduleIdMap.get(s.moduleId)
      if (newModuleId == null) continue
      const newId = await db.sets.add({
        moduleId: newModuleId,
        name: String(s.name || ''),
        desc: s.desc || '',
        type: s.type || 'custom',
        sort: Number(s.sort || 0),
        createTime: s.createTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: s.cubeMode || '3x3'
      })
      setIdMap.set(s.id, newId)
    }

    for (const st of fStates) {
      const newId = await db.states.add({
        name: String(st.name || ''),
        desc: st.desc || '',
        image: st.image || '',
        imageType: st.imageType || '',
        createTime: st.createTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: st.cubeMode || '3x3'
      })
      stateIdMap.set(st.id, newId)
    }

    for (const rel of fStateSetRels) {
      const newSetId = setIdMap.get(rel.setId)
      const newStateId = stateIdMap.get(rel.stateId)
      if (newSetId == null || newStateId == null) continue
      await db.stateSetRel.add({
        stateId: newStateId,
        setId: newSetId,
        sort: Number(rel.sort || 0),
        cubeMode: rel.cubeMode || '3x3'
      })
    }

    for (const f of fFormulas) {
      const newStateId = stateIdMap.get(f.stateId)
      if (newStateId == null) continue
      await db.formulas.add({
        stateId: newStateId,
        content: f.content || '',
        hand: f.hand || '',
        remark: f.remark || '',
        mastered: f.mastered || false,
        isScramble: f.isScramble || false,
        sort: Number(f.sort || 0),
        createTime: f.createTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: f.cubeMode || '3x3'
      })
    }

    // letterImages 以 letter 为主键，同名覆盖即可
    if (fLetterImages.length) {
      await db.letterImages.bulkPut(fLetterImages)
    }
  })

  // 修复选中模式的状态关联
  for (const mode of importModes) {
    await fixMissingStateRelations(mode)
  }
}

/**
 * 构造「模块收窄」用的白名单
 * 只针对勾选了部分模块的模式建立白名单，整模式勾选的模式不列入（保持全部导入）
 * @param {Array} fileModules - 备份文件中属于待导入模式的模块
 * @param {string[]} importModes - 待导入模式
 * @param {Object|null} selectedModules - { '3x3': [文件模块 id] }
 */
function buildScopedModuleFilters(fileModules, importModes, selectedModules) {
  if (!selectedModules) return null

  const filters = {}
  for (const mode of importModes) {
    const selected = selectedModules[mode]
    if (!selected) continue
    const allIds = fileModules
      .filter(m => (m.cubeMode || '3x3') === mode)
      .map(m => m.id)
    if (allIds.length === 0) continue
    // 勾选了全部模块时不收窄
    if (selected.length >= allIds.length) continue
    filters[mode] = selected
  }

  return Object.keys(filters).length > 0 ? filters : null
}

/**
 * 清空一组状态集下的关联与状态数据
 * 状态仅在不再被其他状态集引用时，才连同其公式一起删除
 * @param {number[]} setIds - 状态集 id 列表
 */
async function clearSetsData(setIds) {
  if (!setIds || setIds.length === 0) return

  const rels = await db.stateSetRel.where('setId').anyOf(setIds).toArray()
  if (rels.length === 0) return

  const stateIds = [...new Set(rels.map(r => r.stateId))]
  await db.stateSetRel.bulkDelete(rels.map(r => r.id))

  // 只清理不再被其他状态集引用的状态及其公式
  for (const stateId of stateIds) {
    const remainCount = await db.stateSetRel.where('stateId').equals(stateId).count()
    if (remainCount === 0) {
      await db.formulas.where('stateId').equals(stateId).delete()
      await db.states.delete(stateId)
    }
  }
}

/**
 * 删除单个模块及其子树（状态集 / 关联 / 状态 / 公式）
 * 用于「同名模块覆盖更新」与「重置自定义模块」场景
 * @param {number} moduleId - 本地模块 id
 */
async function deleteModuleSubtree(moduleId) {
  const modSets = await db.sets.where('moduleId').equals(moduleId).toArray()
  const setIds = modSets.map(s => s.id)

  if (setIds.length > 0) {
    await clearSetsData(setIds)
    await db.sets.bulkDelete(setIds)
  }

  await db.modules.delete(moduleId)
}

/**
 * 导入旧版数据：所有记录归属为三阶模式
 * 仅当用户选中三阶时导入，且只覆盖三阶的现有数据
 */
async function importLegacyData(data, modes) {
  // 旧版数据都是三阶，如果用户未选中三阶则不导入
  const importModes = (!modes || modes.length === 0) ? ['3x3'] : modes
  if (!importModes.includes('3x3')) {
    return
  }

  const { modules, sets, states, stateSetRels, formulas, letterImages } = data
  const mode = '3x3'

  // 只清空三阶数据，保留二阶和四阶
  await db.transaction('rw', db.modules, db.sets, db.states, db.stateSetRel, db.formulas, db.letterImages, async () => {
    await db.modules.where('cubeMode').equals(mode).delete()
    await db.sets.where('cubeMode').equals(mode).delete()
    await db.states.where('cubeMode').equals(mode).delete()
    await db.stateSetRel.where('cubeMode').equals(mode).delete()
    await db.formulas.where('cubeMode').equals(mode).delete()

    // letterImages 删除三阶前缀的记录
    const existingLetterImgs = await db.letterImages.toArray()
    const letterImgsToDelete = existingLetterImgs.filter(img => img.letter && img.letter.startsWith(mode + '_'))
    if (letterImgsToDelete.length > 0) {
      await db.letterImages.bulkDelete(letterImgsToDelete.map(img => img.letter))
    }
  })

  const moduleIdMap = {}
  const setIdMap = {}
  const stateIdMap = {}
  const builtInModulesByName = {}

  await db.transaction('rw', db.modules, db.sets, async () => {
    for (const mod of BUILT_IN_MODULE_NAMES_3X3) {
      const modData = modules?.find(m => m.name === mod && m.type === 'builtIn')
      const sort = modData?.sort ?? BUILT_IN_MODULE_NAMES_3X3.indexOf(mod)

      const moduleId = await db.modules.add({
        name: mod,
        desc: modData?.desc || getModuleDesc(mod),
        type: 'builtIn',
        sort,
        image: modData?.image || '',
        imageType: modData?.imageType || '',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: mode
      })

      builtInModulesByName[mod] = moduleId

      if (modData) {
        moduleIdMap[modData.id] = moduleId
      }

      const allSetsData = sets?.find(s => s.name === '全部状态' && s.moduleName === mod)
      const allSetSort = allSetsData?.sort ?? 0

      const setId = await db.sets.add({
        moduleId,
        name: '全部状态',
        desc: '该模块下所有状态',
        type: 'builtIn',
        sort: allSetSort,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: mode
      })

      if (allSetsData) {
        setIdMap[allSetsData.id] = setId
      }
    }
  })

  if (modules?.length) {
    const customModulesData = modules.filter(m => m.type === 'custom')

    for (const mod of customModulesData) {
      const newModuleId = await db.modules.add({
        name: String(mod.name || ''),
        desc: mod.desc || '',
        type: 'custom',
        sort: Number(mod.sort || 0),
        image: mod.image || '',
        imageType: mod.imageType || '',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: mode
      })
      moduleIdMap[mod.id] = newModuleId

      const allSetsData = sets?.find(s =>
        s.name === '全部状态' &&
        s.moduleId === mod.id &&
        s.type === 'builtIn'
      )

      const newSetId = await db.sets.add({
        moduleId: newModuleId,
        name: '全部状态',
        desc: '该模块下所有状态',
        type: 'builtIn',
        sort: allSetsData?.sort ?? 0,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: mode
      })

      if (allSetsData) {
        setIdMap[allSetsData.id] = newSetId
      }
      setIdMap['module_' + mod.id] = newSetId
    }
  }

  if (sets?.length) {
    const customSetsData = sets.filter(s => s.type === 'custom' && s.name !== '全部状态')

    for (const set of customSetsData) {
      let newModuleId = moduleIdMap[set.moduleId]

      if (!newModuleId) {
        const builtInMod = builtInModulesByName[set.moduleName]
        if (builtInMod) {
          newModuleId = builtInMod
        }
      }

      if (newModuleId) {
        const newId = await db.sets.add({
          moduleId: newModuleId,
          name: String(set.name || ''),
          desc: set.desc || '',
          type: 'custom',
          sort: Number(set.sort || 0),
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          cubeMode: mode
        })
        setIdMap[set.id] = newId
      }
    }
  }

  if (states?.length) {
    for (const state of states) {
      const newId = await db.states.add({
        name: String(state.name || ''),
        desc: state.desc || '',
        image: state.image || '',
        imageType: state.imageType || '',
        createTime: state.createTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: mode
      })
      stateIdMap[state.id] = newId
    }
  }

  if (stateSetRels?.length) {
    for (const rel of stateSetRels) {
      const newStateId = stateIdMap[rel.stateId]
      if (!newStateId) continue

      let newSetId = setIdMap[rel.setId]

      if (!newSetId && rel.originalSetInfo) {
        const origSet = rel.originalSetInfo

        if (origSet.moduleId) {
          const newModId = moduleIdMap[origSet.moduleId]
          if (newModId) {
            const allSet = await db.sets.where({
              moduleId: newModId,
              name: '全部状态',
              type: 'builtIn'
            }).first()
            if (allSet) {
              newSetId = allSet.id
            }
          }
        }

        if (!newSetId && origSet.name === '全部状态' && origSet.moduleType === 'builtIn') {
          const builtInModId = builtInModulesByName[origSet.moduleName]
          if (builtInModId) {
            const allSet = await db.sets.where({
              moduleId: builtInModId,
              name: '全部状态',
              type: 'builtIn'
            }).first()
            if (allSet) {
              newSetId = allSet.id
            }
          }
        }

        if (!newSetId && origSet.moduleId) {
          newSetId = setIdMap['module_' + origSet.moduleId]
        }
      }

      if (newSetId) {
        await db.stateSetRel.add({
          stateId: newStateId,
          setId: newSetId,
          sort: Number(rel.sort || 0),
          cubeMode: mode
        })
      }
    }
  }

  if (formulas?.length) {
    for (const formula of formulas) {
      const newStateId = stateIdMap[formula.stateId]
      if (newStateId) {
        await db.formulas.add({
          stateId: newStateId,
          content: String(formula.content || ''),
          hand: formula.hand || '',
          remark: formula.remark || '',
          mastered: formula.mastered || false,
          isScramble: formula.isScramble || false,
          sort: Number(formula.sort || 0),
          createTime: formula.createTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
          cubeMode: mode
        })
      }
    }
  }

  if (letterImages?.length) {
    for (const img of letterImages) {
      await db.letterImages.put({
        letter: String(img.letter || ''),
        image: img.image || '',
        imageType: img.imageType || 'image/png',
        updateTime: img.updateTime || new Date().toISOString()
      })
    }
  }

  await fixMissingStateRelations(mode)
}

async function refreshAllStores() {
  const { useModuleStore } = await import('@/stores/moduleStore')
  const { useSetStore } = await import('@/stores/setStore')
  const { useStateStore } = await import('@/stores/stateStore')
  const { useFormulaStore } = await import('@/stores/formulaStore')
  const { useSettingStore } = await import('@/stores/settingStore')

  const moduleStore = useModuleStore()
  const setStore = useSetStore()
  const stateStore = useStateStore()
  const formulaStore = useFormulaStore()
  const settingStore = useSettingStore()

  moduleStore.invalidate()
  setStore.invalidate()
  stateStore.invalidate()
  formulaStore.invalidate()

  await Promise.all([
    moduleStore.fetchModules(),
    setStore.fetchSets(),
    stateStore.fetchStates(),
    stateStore.fetchStateSetRels(),
    formulaStore.fetchFormulas(),
    settingStore.fetchLetterImages()
  ])
}

/**
 * 重置数据
 * @param {string[]} modes - 需要重置的模式列表，为空或不传则重置当前模式
 * @param {Object} moduleFilters - 按模式指定的模块白名单，如 { '3x3': [1, 2] }。
 *   未列入的模式按整模式重置；列入的模式仅重置勾选的模块
 */
export async function resetAllData(modes = null, moduleFilters = null) {
  const targetModes = (!modes || modes.length === 0)
    // 未指定模式则重置当前模式
    ? [useCubeModeStore().currentMode]
    : modes

  for (const mode of targetModes) {
    const ids = moduleFilters?.[mode]
    if (ids && ids.length > 0) {
      await resetModulesOfMode(mode, ids)
    } else {
      await resetDatabase(mode)
    }
  }

  await refreshAllStores()
}

/**
 * 重置指定模式下勾选的模块
 * - 勾选了该模式全部模块：等价于整模式重置（resetDatabase，同时清理字母图片）
 * - 仅勾选部分模块：自定义模块连同子树整体删除；内置模块清空其下数据并恢复初始图例，模块本身保留
 * @param {string} mode - 模式
 * @param {number[]} moduleIds - 待重置的模块 id
 */
async function resetModulesOfMode(mode, moduleIds) {
  const allModules = await db.modules.where('cubeMode').equals(mode).toArray()
  const selected = allModules.filter(m => moduleIds.includes(m.id))
  if (selected.length === 0) return

  // 全部模块都被勾选时等价于整模式重置
  if (selected.length >= allModules.length) {
    await resetDatabase(mode)
    return
  }

  const customModules = selected.filter(m => m.type !== 'builtIn')
  const builtInModules = selected.filter(m => m.type === 'builtIn')

  await db.transaction('rw', db.modules, db.sets, db.states, db.stateSetRel, db.formulas, async () => {
    for (const mod of customModules) {
      await deleteModuleSubtree(mod.id)
    }
    for (const mod of builtInModules) {
      await resetBuiltInModule(mod)
    }
  })
}

/** 清空内置模块下的自定义数据并恢复初始图例，模块本身与"全部状态"状态集保留 */
async function resetBuiltInModule(mod) {
  const sets = await db.sets.where('moduleId').equals(mod.id).toArray()
  const customSets = sets.filter(s => s.type !== 'builtIn')
  const builtInSet = sets.find(s => s.type === 'builtIn')

  // 清空所有状态集（含内置"全部状态"）下的关联、状态与公式
  await clearSetsData(sets.map(s => s.id))

  if (customSets.length > 0) {
    await db.sets.bulkDelete(customSets.map(s => s.id))
  }
  if (!builtInSet) {
    await db.sets.add({
      moduleId: mod.id,
      name: '全部状态',
      desc: `该模块下所有状态`,
      type: 'builtIn',
      sort: 0,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      cubeMode: mod.cubeMode || '3x3'
    })
  }

  // 恢复内置模块的初始图例与描述
  const legend = DEFAULT_MODULE_LEGENDS[mod.name]
  if (legend) {
    await db.modules.update(mod.id, {
      image: legend.image,
      imageType: legend.imageType,
      desc: getModuleDesc(mod.name) || mod.desc || ''
    })
  }
}
