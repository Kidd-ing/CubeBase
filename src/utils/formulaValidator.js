import { MODE_LETTERS, ALL_MODES, MODE_NORMALIZE_LETTERS, MODE_LETTER_ALIASES } from '@/config/cubeModes.js'

/**
 * 将旧格式 X'2 转换为新格式 X2'
 * 例如：R'2 → R2', Rw'2 → Rw2', MR'2 → MR2', 3Rw'2 → 3Rw2'
 */
export function normalizeToken(token) {
  return token.replace(/^([A-Za-z0-9]+)'2$/, '$12\'')
}

// 四阶多字符前缀（两字符，用于分词，与模式无关）
const TWO_CHAR_PREFIXES = ['MR', 'ML', 'MU', 'MD', 'MF', 'MB', 'Rw', 'Lw', 'Uw', 'Dw', 'Fw', 'Bw']
const TWO_CHAR_PREFIX_REGEX = new RegExp(`^(${TWO_CHAR_PREFIXES.join('|')})$`)

// 为每个模式构建允许的字符集合（配置驱动）
// 共用规则：括号 ( ) 始终允许；数字只能跟在字母或右括号后
// 特殊规则：各模式允许的字母成员不同，从 MODE_LETTERS 配置派生
// 别名规则：MODE_LETTER_ALIASES 中的别名成员也合法，但 tokenize 时保留原样不归一化
//          （图片映射查找由 FormulaCard 通过别名映射回退到标准成员）
const MODE_ALLOWED_CHARS = {}
const MODE_LEGACY_CHARS = {}
const MODE_DIGIT_PREFIXED_MEMBERS = {} // 以 2 或 3 开头的成员（含别名）

for (const mode of ALL_MODES) {
  const letters = MODE_LETTERS[mode]
  const aliases = MODE_LETTER_ALIASES[mode] || {}
  const charSet = new Set(letters)
  const legacySet = new Set()
  const digitPrefixed = new Set()
  // 添加标准成员
  for (const letter of letters) {
    // 为每个 X2' 格式的 token 添加对应的旧格式 X'2
    const match = letter.match(/^([A-Za-z0-9]+)2'$/)
    if (match) {
      legacySet.add(match[1] + "'2")
    }
    // 收集以 2 或 3 开头的成员（用于歧义检测）
    if (letter[0] === '2' || letter[0] === '3') {
      digitPrefixed.add(letter)
    }
  }
  // 添加别名成员到合法集合和数字前缀集合
  for (const alias of Object.keys(aliases)) {
    charSet.add(alias)
    // 为别名 X2' 格式添加旧格式 X'2
    const aliasMatch = alias.match(/^([A-Za-z0-9]+)2'$/)
    if (aliasMatch) {
      legacySet.add(aliasMatch[1] + "'2")
    }
    if (alias[0] === '2' || alias[0] === '3') {
      digitPrefixed.add(alias)
    }
  }
  MODE_ALLOWED_CHARS[mode] = charSet
  MODE_LEGACY_CHARS[mode] = legacySet
  MODE_DIGIT_PREFIXED_MEMBERS[mode] = digitPrefixed
}

// 判断 token 是否为数字（重复次数标记）
function isDigitToken(token) {
  return /^[0-9]+$/.test(token)
}

// 判断 token 是否为指定模式允许的字母成员（含旧格式兼容）
function isLetterToken(token, cubeMode) {
  const allowed = MODE_ALLOWED_CHARS[cubeMode] || MODE_ALLOWED_CHARS['3x3']
  const legacy = MODE_LEGACY_CHARS[cubeMode] || MODE_LEGACY_CHARS['3x3']
  return allowed.has(token) || legacy.has(token)
}

/**
 * 尝试匹配数字前缀成员（3Rw, 2R 等）
 * 从最长到最短尝试匹配，支持旧格式 X'2 → X2'
 * @returns {Object|null} { token, length } 或 null
 */
function tryMatchDigitPrefixedMember(str, i, cubeMode) {
  const allowed = MODE_ALLOWED_CHARS[cubeMode] || MODE_ALLOWED_CHARS['3x3']
  const legacy = MODE_LEGACY_CHARS[cubeMode] || MODE_LEGACY_CHARS['3x3']
  // 最长 6 字符（3Rw2'），最短 2 字符（2R）
  for (let len = 6; len >= 2; len--) {
    const candidate = str.substring(i, i + len)
    if (candidate.length < len) continue
    // 新格式
    if (allowed.has(candidate)) {
      return { token: candidate, length: len }
    }
    // 旧格式 X'2 → 归一化为 X2'
    if (legacy.has(candidate)) {
      return { token: normalizeToken(candidate), length: len }
    }
  }
  return null
}

/**
 * 歧义检测：检查数字边界是否存在多种合法拆分方式
 * 歧义场景：token + 数字串 + token（无空格），数字串可有多种合法切分方式
 * 例如 U23Fw：可拆分为 U2 + 3Fw，也可拆分为 U23 + Fw
 * 例如 R'2L：可拆分为 R'2(=R2') + L，也可拆分为 R' + 2L
 * @returns {string|null} 歧义错误信息，null 表示无歧义
 */
function checkAmbiguity(content, cubeMode) {
  const str = content.trim()
  const allowed = MODE_ALLOWED_CHARS[cubeMode] || MODE_ALLOWED_CHARS['3x3']
  const legacy = MODE_LEGACY_CHARS[cubeMode] || MODE_LEGACY_CHARS['3x3']
  const digitPrefixed = MODE_DIGIT_PREFIXED_MEMBERS[cubeMode] || MODE_DIGIT_PREFIXED_MEMBERS['3x3']
  const normalizeMap = MODE_NORMALIZE_LETTERS[cubeMode] || {}

  // 归一化 token：小写 m/e/s → 大写，旧格式 X'2 → 新格式 X2'
  function normalize(token) {
    let result = token.replace(/^([mes])/, (m, c) => normalizeMap[c] || c)
    result = result.replace(/^([A-Za-z0-9]+)'2$/, '$12\'')
    return result
  }

  // 检查 token 是否合法（含旧格式兼容）
  function isValid(token) {
    const normalized = normalize(token)
    return allowed.has(normalized) || legacy.has(token)
  }

  // 从位置 end 向前匹配所有合法的 token（不含空格和括号）
  function matchBackward(end) {
    const matches = []
    for (let len = 1; len <= 6; len++) {
      const start = end - len
      if (start < 0) break
      const token = str.substring(start, end)
      if (/[()\s]/.test(token)) break
      if (isValid(token)) {
        matches.push({ token, start, normalized: normalize(token) })
      }
    }
    return matches
  }

  // 扫描字符串，找到数字串
  for (let i = 0; i < str.length; i++) {
    if (!/[0-9]/.test(str[i])) continue

    // 找到数字串
    const numStart = i
    let numEnd = numStart
    while (numEnd < str.length && /[0-9]/.test(str[numEnd])) numEnd++
    const numStr = str.substring(numStart, numEnd)

    // 数字串后面必须是字母（无空格）
    if (numEnd >= str.length || !/[A-Za-z]/.test(str[numEnd])) {
      i = numEnd - 1
      continue
    }

    // 数字串前面必须有合法的 token（无空格）
    const formerMatches = matchBackward(numStart)
    if (formerMatches.length === 0) {
      i = numEnd - 1
      continue
    }

    const afterNumStr = str.substring(numEnd)

    // 枚举切分点 k（0 到 numStr.length）
    const validSplits = []
    for (let k = 0; k <= numStr.length; k++) {
      const formerNum = numStr.substring(0, k)
      const latterNum = numStr.substring(k)

      // 检查前者是否合法
      let formerValid = false
      let formerDesc = ''
      for (const fm of formerMatches) {
        if (formerNum === '') {
          formerValid = true
          formerDesc = fm.normalized
          break
        }
        // 前者 = fm.token + formerNum
        const combined = fm.token + formerNum
        if (isValid(combined)) {
          formerValid = true
          formerDesc = normalize(combined)
          break
        }
        // 或者 fm 是无数字后缀的字母成员，formerNum 是重复次数（如 U23=U执行23次）
        formerValid = true
        formerDesc = fm.normalized + formerNum
        break
      }
      if (!formerValid) continue

      // 检查后者是否合法
      let latterValid = false
      let latterDesc = ''
      if (latterNum === '') {
        // 后者 = afterNumStr 开头的合法 token
        for (let len = 1; len <= 6; len++) {
          const candidate = afterNumStr.substring(0, len)
          if (/[()\s]/.test(candidate)) break
          if (isValid(candidate)) {
            latterValid = true
            latterDesc = normalize(candidate)
            break
          }
        }
      } else {
        // 后者以 latterNum 开头，必须是数字前缀成员
        const candidate = latterNum + afterNumStr
        for (const member of digitPrefixed) {
          if (member.startsWith(latterNum) && candidate.startsWith(member)) {
            latterValid = true
            latterDesc = member
            break
          }
        }
      }
      if (!latterValid) continue

      validSplits.push({ former: formerDesc, latter: latterDesc })
    }

    // 多个合法拆分 → 歧义
    if (validSplits.length > 1) {
      const ctxStart = formerMatches[0].start
      const ctxEnd = Math.min(str.length, numEnd + 3)
      const context = str.substring(ctxStart, ctxEnd)
      const splitDescs = validSplits.map(s => `[${s.former}] + [${s.latter}]`).join(' 或 ')
      return `存在歧义：'${context}' 可拆分为 ${splitDescs}，请插入空格明确拆分方式`
    }

    i = numEnd - 1
  }

  return null
}

export function validateFormula(content, cubeMode = '3x3') {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '公式不能为空' }
  }

  // 歧义检测（在 tokenize 之前，基于原始字符串）
  const ambiguityError = checkAmbiguity(content, cubeMode)
  if (ambiguityError) {
    return { valid: false, error: ambiguityError }
  }

  const tokens = tokenize(content, cubeMode)
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const prevToken = tokens[i - 1]

    // 括号始终允许
    if (token === '(' || token === ')') continue

    // 字母成员：按模式校验（包括新格式 X2' 和旧格式 X'2）
    if (isLetterToken(token, cubeMode)) continue

    // 数字只允许出现在特定位置
    if (isDigitToken(token)) {
      const prevIsClosingBracket = prevToken === ')'
      const prevIsLetter = isLetterToken(prevToken, cubeMode)
      // X2' 格式后不能直接跟数字（如 R2'99 非法）
      if (prevIsLetter && /2'$/.test(prevToken)) {
        return { valid: false, error: `非法位置: 数字 ${token} 不能直接跟在 ${prevToken} 后` }
      }
      if (!prevIsClosingBracket && !prevIsLetter) {
        return { valid: false, error: `非法位置: 数字 ${token} 只能跟在右括号或字母后` }
      }
      continue
    }

    return { valid: false, error: `非法字符: ${token}` }
  }

  // 校验括号匹配（支持嵌套）
  let depth = 0
  for (const token of tokens) {
    if (token === '(') depth++
    else if (token === ')') depth--
    if (depth < 0) {
      return { valid: false, error: '括号不匹配：右括号多于左括号' }
    }
  }
  if (depth > 0) {
    return { valid: false, error: '括号不匹配：左括号多于右括号' }
  }

  return { valid: true, error: '' }
}

export function tokenize(content, cubeMode = '3x3') {
  const normalizeMap = MODE_NORMALIZE_LETTERS[cubeMode] || {}
  const allowed = MODE_ALLOWED_CHARS[cubeMode] || MODE_ALLOWED_CHARS['3x3']
  const legacy = MODE_LEGACY_CHARS[cubeMode] || MODE_LEGACY_CHARS['3x3']
  const tokens = []
  let i = 0
  const str = content.trim()
  while (i < str.length) {
    if (str[i] === ' ') { i++; continue }
    if (str[i] === '(' || str[i] === ')') {
      tokens.push(str[i])
      i++
      continue
    }

    // 数字开头：先尝试匹配数字前缀成员（3Rw, 2R 等），否则作为数字 token
    if (str[i] === '2' || str[i] === '3') {
      const matched = tryMatchDigitPrefixedMember(str, i, cubeMode)
      if (matched) {
        // 保留用户输入形式（2R 不转换为 MR），仅处理旧格式 X'2 → X2'
        tokens.push(matched.token)
        i += matched.length
        continue
      }
      // 不是数字前缀成员，作为数字 token
      let numStr = ''
      while (i < str.length && /[0-9]/.test(str[i])) {
        numStr += str[i]
        i++
      }
      tokens.push(numStr)
      continue
    }

    // 其他数字作为重复次数 token（支持多位数）
    if (/[0-9]/.test(str[i])) {
      let numStr = ''
      while (i < str.length && /[0-9]/.test(str[i])) {
        numStr += str[i]
        i++
      }
      tokens.push(numStr)
      continue
    }

    // 尝试匹配四阶多字符前缀（MR, ML, MU, MD, MF, MB, Rw, Lw, Uw, Dw, Fw, Bw）
    const twoChar = str.substring(i, i + 2)
    if (TWO_CHAR_PREFIX_REGEX.test(twoChar)) {
      const third = str[i + 2]
      const fourth = str[i + 3]
      // 新格式 Xw2'（四字符 token）
      if (third === '2' && fourth === "'") {
        tokens.push(twoChar + "2'")
        i += 4
      } else if (third === "'" && fourth === '2') {
        // 旧格式 Xw'2 → 转换为新格式 Xw2'
        tokens.push(twoChar + "2'")
        i += 4
      } else if (third === "'") {
        // 支持 Xw' 格式的三字符 token
        tokens.push(twoChar + third)
        i += 3
      } else if (third === '2') {
        // Xw2 格式：若 2 后面紧跟数字，则 Xw 作为独立 token，2 及后续数字作为数字 token
        // 避免 Rw223 被拆分为 Rw2 和 23，应视作 Rw 和 223
        if (/[0-9]/.test(fourth)) {
          tokens.push(twoChar)
          i += 2
        } else {
          tokens.push(twoChar + third)
          i += 3
        }
      } else {
        // 仅 Xw 两字符 token
        tokens.push(twoChar)
        i += 2
      }
      continue
    }

    // 单字符字母成员（R, L, U, D, F, B, x, y, z, M, E, S, r, l, u, d, f, b）
    // 小写 m/e/s 按模式配置归一化为大写 M/E/S
    const char = str[i]
    const next = str[i + 1]
    const nextNext = str[i + 2]
    if (/[RUFBLDMESmesrufbldxyz]/.test(char)) {
      const letter = normalizeMap[char] || char
      // 新格式 X2'（三字符 token）
      if (next === '2' && nextNext === "'") {
        tokens.push(letter + "2'")
        i += 3
      } else if (next === "'" && nextNext === '2') {
        // 旧格式 X'2 → 转换为新格式 X2'
        tokens.push(letter + "2'")
        i += 3
      } else if (next === "'") {
        tokens.push(letter + next)
        i += 2
      } else if (next === '2') {
        // X2 格式：若 2 后面紧跟数字，则 X 作为独立 token，2 及后续数字作为数字 token
        // 避免 R223 被拆分为 R2 和 23，应视作 R 和 223
        if (/[0-9]/.test(nextNext)) {
          tokens.push(letter)
          i++
        } else {
          tokens.push(letter + next)
          i += 2
        }
      } else {
        tokens.push(letter)
        i++
      }
    } else {
      tokens.push(char)
      i++
    }
  }
  return tokens
}

export function formatFormula(content, cubeMode = '3x3') {
  const tokens = tokenize(content, cubeMode)
  let result = ''
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const prevToken = tokens[i - 1]

    if (i > 0 && token !== '(' && token !== ')' && !isDigitToken(token) && prevToken !== '(') {
      result += ' '
    }

    result += token
  }
  return result.trim()
}

export function getFormulaDisplayTokens(formatted, cubeMode = '3x3') {
  return tokenize(formatted, cubeMode)
}

export { isDigitToken }
