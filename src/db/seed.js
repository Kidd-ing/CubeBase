import db from './index'
import dayjs from 'dayjs'
import { DEFAULT_MODULE_LEGENDS } from './defaultLegends'

// 三阶内置模块基础定义（图例数据从 defaultLegends.js 导入，确保数据完整性）
const BUILT_IN_MODULES_3X3 = [
  {
    name: 'F2L',
    desc: 'First Two Layers',
    type: 'builtIn',
    sort: 0,
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    ...DEFAULT_MODULE_LEGENDS.F2L
  },
  {
    name: 'OLL',
    desc: 'Orientation of Last Layer',
    type: 'builtIn',
    sort: 1,
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    ...DEFAULT_MODULE_LEGENDS.OLL
  },
  {
    name: 'PLL',
    desc: 'Permutation of Last Layer',
    type: 'builtIn',
    sort: 2,
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    ...DEFAULT_MODULE_LEGENDS.PLL
  }
]

/**
 * 初始化指定模式的种子数据
 * @param {'2x2' | '3x3' | '4x4'} cubeMode
 */
export async function initSeedData(cubeMode = '3x3') {
  const mode = cubeMode
  const moduleCount = await db.modules.where('cubeMode').equals(mode).count()
  if (moduleCount > 0) return

  // 只有三阶模式生成内置模块（F2L/OLL/PLL），二阶和四阶不生成
  if (mode !== '3x3') return

  await db.transaction('rw', db.modules, db.sets, async () => {
    for (const mod of BUILT_IN_MODULES_3X3) {
      const moduleId = await db.modules.add({ ...mod, cubeMode: mode })
      await db.sets.add({
        moduleId,
        name: '全部状态',
        desc: `该模块下所有状态`,
        type: 'builtIn',
        sort: 0,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: mode
      })
    }
  })
}

// 修复缺失的状态-状态集关联
export async function fixMissingStateRelations(cubeMode = '3x3') {
  const mode = cubeMode
  const sets = await db.sets.where('cubeMode').equals(mode).toArray()
  const states = await db.states.where('cubeMode').equals(mode).toArray()
  const existingRels = await db.stateSetRel.where('cubeMode').equals(mode).toArray()

  // 按模块分组状态集
  const setsByModule = {}
  sets.forEach(set => {
    if (!setsByModule[set.moduleId]) {
      setsByModule[set.moduleId] = []
    }
    setsByModule[set.moduleId].push(set)
  })

  // 获取每个状态所属的模块（通过现有的关联）
  const stateModules = {}
  existingRels.forEach(rel => {
    const set = sets.find(s => s.id === rel.setId)
    if (set && !stateModules[rel.stateId]) {
      stateModules[rel.stateId] = set.moduleId
    }
  })

  // 为没有关联到"全部状态"的状态添加关联
  const newRels = []
  for (const set of sets) {
    if (set.type !== 'builtIn') continue // 只处理"全部状态"
    
    const moduleStates = states.filter(s => stateModules[s.id] === set.moduleId)
    const setRelStateIds = existingRels
      .filter(r => r.setId === set.id)
      .map(r => r.stateId)

    for (const state of moduleStates) {
      if (!setRelStateIds.includes(state.id)) {
        newRels.push({
          stateId: state.id,
          setId: set.id,
          sort: 0
        })
      }
    }
  }

  if (newRels.length > 0) {
    const relsWithMode = newRels.map(r => ({ ...r, cubeMode: mode }))
    await db.stateSetRel.bulkAdd(relsWithMode)
    console.log(`修复了 ${newRels.length} 个缺失的状态-状态集关联`)
  }
}

export async function resetDatabase(cubeMode = '3x3') {
  const mode = cubeMode
  await db.transaction('rw', db.modules, db.sets, db.states, db.stateSetRel, db.formulas, db.letterImages, async () => {
    // 仅清除指定模式的数据，保留其他模式数据
    const modulesToDelete = await db.modules.where('cubeMode').equals(mode).primaryKeys()
    const setsToDelete = await db.sets.where('cubeMode').equals(mode).primaryKeys()
    const statesToDelete = await db.states.where('cubeMode').equals(mode).primaryKeys()
    const relsToDelete = await db.stateSetRel.where('cubeMode').equals(mode).primaryKeys()
    const formulasToDelete = await db.formulas.where('cubeMode').equals(mode).primaryKeys()

    await db.modules.bulkDelete(modulesToDelete)
    await db.sets.bulkDelete(setsToDelete)
    await db.states.bulkDelete(statesToDelete)
    await db.stateSetRel.bulkDelete(relsToDelete)
    await db.formulas.bulkDelete(formulasToDelete)

    // 删除该模式的字母图片（通过 letter 前缀匹配，如 3x3_R）
    const allLetterImages = await db.letterImages.toArray()
    const letterImagesToDelete = allLetterImages.filter(img =>
      img.letter && img.letter.startsWith(mode + '_')
    )
    if (letterImagesToDelete.length > 0) {
      await db.letterImages.bulkDelete(letterImagesToDelete.map(img => img.letter))
    }
  })
  await initSeedData(mode)
}
