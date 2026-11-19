/**
 * 图片处理工具
 */
import imageCompression from 'browser-image-compression'

const MAX_SIZE = 1024 * 1024 // 1MB
const MAX_DIMENSION = 512

/**
 * 验证 Blob 是否为可正常加载的图片
 * @param {Blob} blob
 * @returns {Promise<boolean>}
 */
function verifyImageBlob(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(true)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }
    img.src = url
  })
}

/**
 * 处理上传的图片
 * @param {File} file - 图片文件
 * @returns {Promise<{image: string, imageType: string}>}
 */
export async function handleImageUpload(file) {
  let processedFile = file

  // GIF 和 SVG 不压缩
  if (!['image/gif', 'image/svg+xml'].includes(file.type)) {
    // 仅压缩超过 1MB 的图片
    if (file.size > MAX_SIZE) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: MAX_DIMENSION,
          useWebWorker: false
        })
        // 压缩结果需通过大小检查和可加载性验证，否则回退原图
        if (compressed && compressed.size > 0 && compressed.size < file.size) {
          if (await verifyImageBlob(compressed)) {
            processedFile = compressed
          } else {
            console.warn('压缩图片无法加载，使用原图')
          }
        }
      } catch (e) {
        // 压缩失败，回退原图
        console.warn('图片压缩失败，使用原图', e)
      }
    }
  }

  // 转换为 Base64
  const image = await fileToBase64(processedFile)
  const imageType = processedFile.type || 'image/png'

  return { image, imageType }
}

/**
 * 将文件转换为 Base64
 * @param {File} file 
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 从 Base64 获取文件类型
 * @param {string} base64 
 * @returns {string}
 */
export function getImageType(base64) {
  const match = base64.match(/^data:([^;]+);/)
  return match ? match[1] : 'image/png'
}
