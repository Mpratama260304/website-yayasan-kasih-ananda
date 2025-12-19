/**
 * Upload Service - Same Origin Architecture
 * ==========================================
 * 
 * All uploads go to the SAME server (same origin).
 * No external URLs needed - everything is relative.
 * 
 * ✅ /api/upload     → Upload files
 * ✅ /api/files      → List files
 * ✅ /uploads/*      → Access files
 */

// ===========================================
// TYPES
// ===========================================
export interface UploadResult {
  success: boolean
  url?: string
  filename?: string
  originalName?: string
  mimeType?: string
  size?: number
  error?: string
}

export interface MultiUploadResult {
  success: boolean
  successful: UploadResult[]
  failed: { originalName: string; error: string }[]
}

// ===========================================
// UPLOAD FUNCTIONS
// ===========================================

/**
 * Upload a single file
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(files: File[]): Promise<MultiUploadResult> {
  try {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    const response = await fetch('/api/upload/multiple', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Multiple upload error:', error)
    return {
      success: false,
      successful: [],
      failed: files.map(f => ({ originalName: f.name, error: 'Upload failed' })),
    }
  }
}

/**
 * Upload avatar (256x256, WebP)
 */
export async function uploadAvatar(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload/avatar', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Avatar upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Delete a file
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    // Extract subdir and filename from URL
    // URL format: /uploads/{subdir}/{filename}
    const match = url.match(/\/uploads\/([^/]+)\/([^/]+)$/)
    if (!match) {
      console.error('Invalid file URL:', url)
      return false
    }

    const [, subdir, filename] = match
    
    const response = await fetch(`/api/upload/${subdir}/${filename}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

/**
 * List all files
 */
export async function listFiles(subdir?: string): Promise<UploadResult[]> {
  try {
    const url = subdir ? `/api/files/${subdir}` : '/api/files'
    const response = await fetch(url)
    const result = await response.json()
    
    if (result.success) {
      return result.files
    }
    return []
  } catch (error) {
    console.error('List files error:', error)
    return []
  }
}

// ===========================================
// MIGRATION HELPERS (base64 → file)
// ===========================================

/**
 * Migrate a base64 string to a file
 */
export async function migrateBase64ToFile(base64: string, originalName?: string): Promise<string | null> {
  try {
    const response = await fetch('/api/migrate-base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, originalName }),
    })

    const result = await response.json()
    return result.success ? result.url : null
  } catch (error) {
    console.error('Migration error:', error)
    return null
  }
}

/**
 * Migrate base64 images in HTML content
 */
export async function migrateBase64InContent(html: string): Promise<string> {
  const base64Pattern = /src="(data:image\/[^;]+;base64,[^"]+)"/g
  let result = html
  let match

  while ((match = base64Pattern.exec(html)) !== null) {
    const base64 = match[1]
    const newUrl = await migrateBase64ToFile(base64)
    if (newUrl) {
      result = result.replace(base64, newUrl)
    }
  }

  return result
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Check if a string is base64
 */
export function isBase64(str: string): boolean {
  return str?.startsWith('data:')
}

/**
 * Check if URL is a valid file URL
 */
export function isValidFileUrl(url: string): boolean {
  return url?.startsWith('/uploads/') || url?.startsWith('http')
}

/**
 * Get full URL for a file path
 * Since we're same-origin, relative URLs work fine
 */
export function getFileUrl(path: string): string {
  if (!path) return ''
  
  // Already absolute URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // Base64 - return as-is
  if (isBase64(path)) {
    return path
  }
  
  // Relative path starting with /
  if (path.startsWith('/')) {
    return path
  }
  
  // Add leading slash
  return `/${path}`
}

/**
 * Check if upload server is available
 */
export async function checkUploadServer(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
