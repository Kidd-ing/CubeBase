import Dexie from 'dexie'

const db = new Dexie('FormulaDB')

db.version(1).stores({
  modules: '++id, name, type, sort, createTime',
  sets: '++id, moduleId, name, type, sort, createTime',
  states: '++id, name, createTime',
  stateSetRel: '++id, stateId, setId, sort, [setId+stateId]',
  formulas: '++id, stateId, sort, createTime',
  letterImages: 'letter, updateTime'
})

// 升级到版本2，添加复合索引 [moduleId+name] 优化状态集查询
db.version(2).stores({
  modules: '++id, name, type, sort, createTime',
  sets: '++id, moduleId, name, type, sort, createTime, [moduleId+name]',
  states: '++id, name, createTime',
  stateSetRel: '++id, stateId, setId, sort, [setId+stateId]',
  formulas: '++id, stateId, sort, createTime',
  letterImages: 'letter, updateTime'
})

// 升级到版本4，添加备份管理表
db.version(4).stores({
  modules: '++id, name, type, sort, createTime',
  sets: '++id, moduleId, name, type, sort, createTime, [moduleId+name]',
  states: '++id, name, createTime',
  stateSetRel: '++id, stateId, setId, sort, [setId+stateId]',
  formulas: '++id, stateId, sort, createTime, mastered',
  letterImages: 'letter, updateTime',
  backups: '++id, name, createdAt'
})

// 升级到版本5，formulas 表新增 isScramble 字段区分打乱公式
db.version(5).stores({
  modules: '++id, name, type, sort, createTime',
  sets: '++id, moduleId, name, type, sort, createTime, [moduleId+name]',
  states: '++id, name, createTime',
  stateSetRel: '++id, stateId, setId, sort, [setId+stateId]',
  formulas: '++id, stateId, sort, createTime, mastered, isScramble',
  letterImages: 'letter, updateTime',
  backups: '++id, name, createdAt'
})

// 升级到版本6，添加壁纸表
db.version(6).stores({
  modules: '++id, name, type, sort, createTime',
  sets: '++id, moduleId, name, type, sort, createTime, [moduleId+name]',
  states: '++id, name, createTime',
  stateSetRel: '++id, stateId, setId, sort, [setId+stateId]',
  formulas: '++id, stateId, sort, createTime, mastered, isScramble',
  letterImages: 'letter, updateTime',
  backups: '++id, name, createdAt',
  wallpaper: '++id, updateTime'
})

// 升级到版本7，添加 cubeMode 字段用于区分二阶/三阶数据
db.version(7).stores({
  modules: '++id, name, type, sort, createTime, cubeMode',
  sets: '++id, moduleId, name, type, sort, createTime, [moduleId+name], cubeMode',
  states: '++id, name, createTime, cubeMode',
  stateSetRel: '++id, stateId, setId, sort, [setId+stateId], cubeMode',
  formulas: '++id, stateId, sort, createTime, mastered, isScramble, cubeMode',
  letterImages: 'letter, updateTime',
  backups: '++id, name, createdAt',
  wallpaper: '++id, updateTime'
}).upgrade(tx => {
  // 历史数据默认归属为三阶模式
  const defaultMode = '3x3'
  return Promise.all([
    tx.table('modules').toCollection().modify(r => { r.cubeMode = defaultMode }),
    tx.table('sets').toCollection().modify(r => { r.cubeMode = defaultMode }),
    tx.table('states').toCollection().modify(r => { r.cubeMode = defaultMode }),
    tx.table('stateSetRel').toCollection().modify(r => { r.cubeMode = defaultMode }),
    tx.table('formulas').toCollection().modify(r => { r.cubeMode = defaultMode })
  ])
})

export default db
