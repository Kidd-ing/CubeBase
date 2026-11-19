import db from '@/db'

const WALLPAPER_ID = 1
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * 保存壁纸图片到 IndexedDB
 * @param {File|Blob} file - 图片文件
 * @returns {Promise<void>}
 */
export async function saveWallpaper(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('图片大小不能超过 10MB')
  }
  
  // 压缩图片
  const compressedFile = await compressImage(file)
  
  const data = {
    id: WALLPAPER_ID,
    image: compressedFile,
    fileName: file.name || 'wallpaper.jpg',  // 保存原始文件名
    updateTime: new Date().toISOString()
  }
  
  await db.wallpaper.put(data)
}

/**
 * 获取壁纸图片
 * @returns {Promise<string|null>} - 返回 DataURL 或 null
 */
export async function getWallpaper() {
  const record = await db.wallpaper.get(WALLPAPER_ID)
  if (!record || !record.image) return null
  
  // 如果是 Blob，转换为 DataURL
  if (record.image instanceof Blob) {
    return blobToDataURL(record.image)
  }
  return record.image
}

/**
 * 删除壁纸
 */
export async function deleteWallpaper() {
  await db.wallpaper.delete(WALLPAPER_ID)
}

/**
 * 检查是否存在壁纸
 * @returns {Promise<boolean>}
 */
export async function hasWallpaper() {
  const record = await db.wallpaper.get(WALLPAPER_ID)
  return !!(record && record.image)
}

/**
 * 获取壁纸信息（含原始文件名）
 * @returns {Promise<{fileName: string}|null>}
 */
export async function getWallpaperInfo() {
  const record = await db.wallpaper.get(WALLPAPER_ID)
  if (!record) return null
  return {
    fileName: record.fileName || 'wallpaper.jpg'
  }
}

/**
 * 压缩图片
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // 限制最大尺寸为 1920px（手机屏幕足够）
        const maxDimension = 1920
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为 JPEG，质量 0.8
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.8
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Blob 转 DataURL
 */
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
