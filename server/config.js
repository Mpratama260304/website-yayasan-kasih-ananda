/**
 * ═══════════════════════════════════════════════════════════════════
 * APP CONFIGURATION - PhalaCloud Compatible
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ❌ NO .env file support
 * ❌ NO dotenv dependency
 * ✅ All config via docker-compose environment
 * ✅ All defaults hardcoded for safety
 * ✅ PhalaCloud ready
 * 
 * Environment variables are ONLY read from docker-compose.yml
 * This ensures PhalaCloud compatibility since .env is not supported
 * ═══════════════════════════════════════════════════════════════════
 */

// ===========================================
// HELPER: Get config value with fallback
// ===========================================
function getConfig(key, defaultValue) {
  // Only check process.env if running in Docker (set via docker-compose)
  // Otherwise use hardcoded defaults
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]
  }
  return defaultValue
}

function getConfigInt(key, defaultValue) {
  const value = getConfig(key, null)
  if (value === null) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

function getConfigBool(key, defaultValue) {
  const value = getConfig(key, null)
  if (value === null) return defaultValue
  return value === 'true' || value === '1' || value === 'yes'
}

// ===========================================
// CONFIGURATION OBJECT
// ===========================================
export const config = {
  // ─────────────────────────────────────────
  // SERVER
  // ─────────────────────────────────────────
  port: getConfigInt('PORT', 3000),
  host: '0.0.0.0', // Required for Docker
  
  // Production mode detection
  // In Docker: set via docker-compose environment
  // Default: true (always assume production in container)
  isProduction: getConfig('NODE_ENV', 'production') === 'production',
  
  // ─────────────────────────────────────────
  // DATABASE
  // ─────────────────────────────────────────
  // PostgreSQL connection string
  // Format: postgresql://user:password@host:port/database
  databaseUrl: getConfig('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/yayasan_kasi'),
  
  // ─────────────────────────────────────────
  // PATHS (Absolute container paths)
  // ─────────────────────────────────────────
  uploadDir: '/app/uploads',
  distDir: '/app/dist',
  serverDir: '/app/server',
  
  // ─────────────────────────────────────────
  // UPLOAD SETTINGS
  // ─────────────────────────────────────────
  maxFileSize: getConfigInt('MAX_FILE_SIZE', 50 * 1024 * 1024), // 50MB
  imageQuality: getConfigInt('IMAGE_QUALITY', 85),
  maxImageWidth: getConfigInt('MAX_IMAGE_WIDTH', 1920),
  maxImageHeight: getConfigInt('MAX_IMAGE_HEIGHT', 1080),
  
  // ─────────────────────────────────────────
  // ALLOWED FILE TYPES
  // ─────────────────────────────────────────
  allowedTypes: {
    images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'],
    documents: ['application/pdf'],
    archives: ['application/zip', 'application/x-zip-compressed'],
  },
  
  // ─────────────────────────────────────────
  // CORS
  // ─────────────────────────────────────────
  corsOrigin: true, // Allow all origins (handled by reverse proxy)
  
  // ─────────────────────────────────────────
  // CACHE
  // ─────────────────────────────────────────
  staticCacheMaxAge: '1y', // Production cache duration
  
  // ─────────────────────────────────────────
  // SUBDIRECTORIES
  // ─────────────────────────────────────────
  uploadSubdirs: ['images', 'documents', 'archives', 'avatars'],
}

// ===========================================
// DERIVED VALUES
// ===========================================
config.allAllowedTypes = [
  ...config.allowedTypes.images,
  ...config.allowedTypes.documents,
  ...config.allowedTypes.archives,
]

// ===========================================
// EXPORT DEFAULT
// ===========================================
export default config
