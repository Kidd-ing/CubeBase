/**
 * 魔方模式配置（配置驱动方案）
 * 新增模式时只需在此文件追加一项配置，无需修改任何组件逻辑
 */

// 所有支持的模式
export const ALL_MODES = ['2x2', '3x3', '4x4']

// 各模式的显示名称
export const MODE_LABELS = {
  '2x2': '二阶',
  '3x3': '三阶',
  '4x4': '四阶'
}

/**
 * 各模式的字母成员列表
 * 用于：字母图片映射页、状态详情页图片版公式映射
 */
export const MODE_LETTERS = {
  '2x2': [
    'R', "R'", 'R2', "R2'", 'L', "L'", 'L2', "L2'",
    'U', "U'", 'U2', "U2'", 'D', "D'", 'D2', "D2'",
    'F', "F'", 'F2', "F2'", 'B', "B'", 'B2', "B2'",
    'x', "x'", 'x2', "x2'", 'y', "y'", 'y2', "y2'",
    'z', "z'", 'z2', "z2'"
  ],
  '3x3': [
    'R', "R'", 'R2', "R2'", 'L', "L'", 'L2', "L2'",
    'U', "U'", 'U2', "U2'", 'D', "D'", 'D2', "D2'",
    'F', "F'", 'F2', "F2'", 'B', "B'", 'B2', "B2'",
    'r', "r'", 'r2', "r2'", 'l', "l'", 'l2', "l2'",
    'u', "u'", 'u2', "u2'", 'd', "d'", 'd2', "d2'",
    'f', "f'", 'f2', "f2'", 'b', "b'", 'b2', "b2'",
    'M', "M'", 'M2', "M2'", 'E', "E'", 'E2', "E2'",
    'S', "S'", 'S2', "S2'",
    'x', "x'", 'x2', "x2'", 'y', "y'", 'y2', "y2'",
    'z', "z'", 'z2', "z2'"
  ],
  '4x4': [
    'R', "R'", 'R2', "R2'", 'L', "L'", 'L2', "L2'",
    'U', "U'", 'U2', "U2'", 'D', "D'", 'D2', "D2'",
    'F', "F'", 'F2', "F2'", 'B', "B'", 'B2', "B2'",
    'Rw', "Rw'", 'Rw2', "Rw2'", 'Lw', "Lw'", 'Lw2', "Lw2'",
    'Uw', "Uw'", 'Uw2', "Uw2'", 'Dw', "Dw'", 'Dw2', "Dw2'",
    'Fw', "Fw'", 'Fw2', "Fw2'", 'Bw', "Bw'", 'Bw2', "Bw2'",
    'MR', "MR'", 'MR2', "MR2'", 'ML', "ML'", 'ML2', "ML2'",
    'MU', "MU'", 'MU2', "MU2'", 'MD', "MD'", 'MD2', "MD2'",
    'MF', "MF'", 'MF2', "MF2'", 'MB', "MB'", 'MB2', "MB2'",
    'M', "M'", 'M2', "M2'", 'E', "E'", 'E2', "E2'", 'S', "S'", 'S2', "S2'",
    '3Rw', "3Rw'", '3Rw2', "3Rw2'", '3Lw', "3Lw'", '3Lw2', "3Lw2'",
    '3Uw', "3Uw'", '3Uw2', "3Uw2'", '3Dw', "3Dw'", '3Dw2', "3Dw2'",
    '3Fw', "3Fw'", '3Fw2', "3Fw2'", '3Bw', "3Bw'", '3Bw2', "3Bw2'",
    'x', "x'", 'x2', "x2'", 'y', "y'", 'y2', "y2'",
    'z', "z'", 'z2', "z2'"
  ]
}

/**
 * 公式键盘共用行（所有模式都显示的前3行）
 */
export const KEYBOARD_COMMON_ROWS = [
  ['(', ')', '2', '3', '退格'],  // 第1行特殊处理（退格占2格）
  ['R', 'L', 'U', 'D', 'F', 'B'],
  ["R'", "L'", "U'", "D'", "F'", "B'"]
]

/**
 * 各模式的公式键盘专属行（跟在共用行之后）
 */
export const MODE_KEYBOARD_ROWS = {
  '2x2': [
    ['x', 'y', 'z', "x'", "y'", "z'"]
  ],
  '3x3': [
    ['r', 'l', 'u', 'd', 'f', 'b'],
    ["r'", "l'", "u'", "d'", "f'", "b'"],
    ['M', 'E', 'S', 'x', 'y', 'z'],
    ["M'", "E'", "S'", "x'", "y'", "z'"]
  ],
  '4x4': [
    ['Rw', 'Lw', 'Uw', 'Dw', 'Fw', 'Bw'],
    ["Rw'", "Lw'", "Uw'", "Dw'", "Fw'", "Bw'"],
    ['MR', 'ML', 'MU', 'MD', 'MF', 'MB'],
    ["MR'", "ML'", "MU'", "MD'", "MF'", "MB'"],
    ['x', 'y', 'z', "x'", "y'", "z'"]
  ]
}

/**
 * 各模式小写字母归一化映射（小写 → 大写，用于公式输入容错）
 * 仅当大写字母存在于该模式字母列表、且对应小写字母不存在时才归一化
 * 例如：4x4 模式下 M 合法但 m 不合法，输入 m 自动转为 M
 */
export const MODE_NORMALIZE_LETTERS = {
  '2x2': {},
  '3x3': { 'm': 'M', 'e': 'E', 's': 'S' },
  '4x4': { 'm': 'M', 'e': 'E', 's': 'S' }
}

/**
 * 各模式字母成员别名映射（别名 → 标准成员）
 * 4x4 模式下 2R/2L/2U/2D/2F/2B 系列与 MR/ML/MU/MD/MF/MB 系列完全等价
 * 别名仅用于公式输入校验合法性（输入 2R 合法），不做归一化转换（保留用户输入形式）
 * 图片映射查找时由 FormulaCard 通过此映射回退到标准成员的资源
 */
export const MODE_LETTER_ALIASES = {
  '2x2': {},
  '3x3': {},
  '4x4': {
    '2R': 'MR', "2R'": "MR'", '2R2': 'MR2', "2R2'": "MR2'",
    '2L': 'ML', "2L'": "ML'", '2L2': 'ML2', "2L2'": "ML2'",
    '2U': 'MU', "2U'": "MU'", '2U2': 'MU2', "2U2'": "MU2'",
    '2D': 'MD', "2D'": "MD'", '2D2': 'MD2', "2D2'": "MD2'",
    '2F': 'MF', "2F'": "MF'", '2F2': 'MF2', "2F2'": "MF2'",
    '2B': 'MB', "2B'": "MB'", '2B2': 'MB2', "2B2'": "MB2'"
  }
}

/**
 * 获取指定模式的小写字母归一化映射
 * @param {string} mode - 模式：'2x2' | '3x3' | '4x4'
 * @returns {Object} 小写→大写映射对象
 */
export function getModeNormalizeLetters(mode) {
  return MODE_NORMALIZE_LETTERS[mode] || {}
}

/**
 * 获取指定模式的字母成员别名映射
 * @param {string} mode - 模式：'2x2' | '3x3' | '4x4'
 * @returns {Object} 别名→标准成员映射对象
 */
export function getModeLetterAliases(mode) {
  return MODE_LETTER_ALIASES[mode] || {}
}

/**
 * 获取指定模式的字母成员列表
 * @param {string} mode - 模式：'2x2' | '3x3' | '4x4'
 * @returns {string[]} 字母成员数组
 */
export function getModeLetters(mode) {
  return MODE_LETTERS[mode] || MODE_LETTERS['3x3']
}

/**
 * 获取指定模式的公式键盘专属行
 * @param {string} mode - 模式：'2x2' | '3x3' | '4x4'
 * @returns {Array<string[]>} 按钮行数组
 */
export function getModeKeyboardRows(mode) {
  return MODE_KEYBOARD_ROWS[mode] || MODE_KEYBOARD_ROWS['3x3']
}
