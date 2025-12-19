/**
 * ═══════════════════════════════════════════════════════════════════
 * UNIFIED SERVER - PhalaCloud Compatible
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ❌ NO .env file
 * ❌ NO dotenv
 * ❌ NO hardcoded process.env fallbacks
 * ✅ Config via config.js (with docker-compose override support)
 * ✅ PhalaCloud ready
 * 
 * This server handles EVERYTHING on ONE PORT:
 * - /api/*       → API routes
 * - /api/upload  → File uploads (multer)
 * - /uploads/*   → Static uploaded files
 * - /*           → Frontend (Vite dev or production build)
 * ═══════════════════════════════════════════════════════════════════
 */

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import config from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// ===========================================
// CONFIGURATION FROM config.js
// ===========================================
const PORT = config.port
const HOST = config.host
const IS_PRODUCTION = config.isProduction

// Use container paths in production, relative paths in development
const UPLOAD_DIR = IS_PRODUCTION ? config.uploadDir : path.join(ROOT_DIR, 'uploads')
const DIST_DIR = IS_PRODUCTION ? config.distDir : path.join(ROOT_DIR, 'dist')

const CONFIG = {
  uploadDir: UPLOAD_DIR,
  maxFileSize: config.maxFileSize,
  imageQuality: config.imageQuality,
  maxImageWidth: config.maxImageWidth,
  maxImageHeight: config.maxImageHeight,
}

const ALLOWED_TYPES = config.allowedTypes
const ALL_ALLOWED_TYPES = config.allAllowedTypes
const SUBDIRS = config.uploadSubdirs

// ===========================================
// SETUP DIRECTORIES (fail-safe)
// ===========================================
try {
  SUBDIRS.forEach(subdir => {
    const dir = path.join(CONFIG.uploadDir, subdir)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 Created: ${dir}`)
    }
  })
} catch (error) {
  console.error('⚠️ Directory setup warning:', error.message)
  // Don't crash - directories might be mounted via Docker volume
}

// ===========================================
// EXPRESS APP
// ===========================================
const app = express()

// CORS - Allow same origin (handled by reverse proxy in production)
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ===========================================
// STATIC FILES - /uploads/*
// ===========================================
app.use('/uploads', express.static(CONFIG.uploadDir, {
  maxAge: IS_PRODUCTION ? config.staticCacheMaxAge : 0,
  etag: true,
  lastModified: true,
}))

// ===========================================
// MULTER SETUP
// ===========================================
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: CONFIG.maxFileSize },
})

// ===========================================
// HELPER FUNCTIONS
// ===========================================
function getSubdirForMimeType(mimeType) {
  if (ALLOWED_TYPES.images.includes(mimeType)) return 'images'
  if (ALLOWED_TYPES.documents.includes(mimeType)) return 'documents'
  if (ALLOWED_TYPES.archives.includes(mimeType)) return 'archives'
  return 'images'
}

async function processImage(buffer, options = {}) {
  const { 
    maxWidth = CONFIG.maxImageWidth, 
    maxHeight = CONFIG.maxImageHeight, 
    quality = CONFIG.imageQuality 
  } = options
  
  try {
    const image = sharp(buffer)
    const metadata = await image.metadata()
    
    let processed = image
    
    // Resize if too large
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      processed = processed.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
    
    // Convert to WebP for better compression (except for GIFs)
    if (metadata.format !== 'gif') {
      processed = processed.webp({ quality })
    }
    
    return {
      buffer: await processed.toBuffer(),
      format: metadata.format === 'gif' ? 'gif' : 'webp',
      width: metadata.width,
      height: metadata.height,
    }
  } catch (error) {
    console.error('Image processing error:', error)
    return { buffer, format: 'original' }
  }
}

// ===========================================
// API ROUTES
// ===========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    mode: IS_PRODUCTION ? 'production' : 'development',
    uploadDir: CONFIG.uploadDir,
  })
})

// Single file upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const { buffer, mimetype, originalname } = req.file
    const subdir = getSubdirForMimeType(mimetype)
    
    let finalBuffer = buffer
    let extension = path.extname(originalname).toLowerCase() || '.bin'
    
    // Process images
    if (ALLOWED_TYPES.images.includes(mimetype)) {
      const processed = await processImage(buffer)
      finalBuffer = processed.buffer
      extension = processed.format === 'gif' ? '.gif' : '.webp'
    }
    
    // Generate unique filename
    const filename = `${uuidv4()}${extension}`
    const filepath = path.join(CONFIG.uploadDir, subdir, filename)
    
    // Ensure directory exists
    const dirPath = path.dirname(filepath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    // Save file
    await fs.promises.writeFile(filepath, finalBuffer)
    
    // Return URL (relative - same origin)
    const url = `/uploads/${subdir}/${filename}`
    
    console.log(`✅ Uploaded: ${url}`)
    
    res.json({
      success: true,
      url,
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size: finalBuffer.length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Multiple file upload
app.post('/api/upload/multiple', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' })
    }

    const results = { successful: [], failed: [] }

    for (const file of req.files) {
      try {
        const { buffer, mimetype, originalname } = file
        const subdir = getSubdirForMimeType(mimetype)
        
        let finalBuffer = buffer
        let extension = path.extname(originalname).toLowerCase() || '.bin'
        
        if (ALLOWED_TYPES.images.includes(mimetype)) {
          const processed = await processImage(buffer)
          finalBuffer = processed.buffer
          extension = processed.format === 'gif' ? '.gif' : '.webp'
        }
        
        const filename = `${uuidv4()}${extension}`
        const filepath = path.join(CONFIG.uploadDir, subdir, filename)
        
        // Ensure directory exists
        const dirPath = path.dirname(filepath)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
        }
        
        await fs.promises.writeFile(filepath, finalBuffer)
        
        results.successful.push({
          url: `/uploads/${subdir}/${filename}`,
          filename,
          originalName: originalname,
          mimeType: mimetype,
          size: finalBuffer.length,
        })
      } catch (err) {
        results.failed.push({ originalName: file.originalname, error: err.message })
      }
    }

    res.json({ success: true, ...results })
  } catch (error) {
    console.error('Multiple upload error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Avatar upload (smaller size, always square)
app.post('/api/upload/avatar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const { buffer, mimetype, originalname } = req.file
    
    if (!ALLOWED_TYPES.images.includes(mimetype)) {
      return res.status(400).json({ success: false, error: 'Only images allowed for avatars' })
    }

    // Process avatar - 256x256, square
    const processed = await sharp(buffer)
      .resize(256, 256, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer()

    const filename = `${uuidv4()}.webp`
    const filepath = path.join(CONFIG.uploadDir, 'avatars', filename)
    
    // Ensure directory exists
    const dirPath = path.dirname(filepath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    await fs.promises.writeFile(filepath, processed)
    
    const url = `/uploads/avatars/${filename}`
    
    console.log(`✅ Avatar uploaded: ${url}`)
    
    res.json({
      success: true,
      url,
      filename,
      originalName: originalname,
      size: processed.length,
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete file
app.delete('/api/upload/:subdir/:filename', async (req, res) => {
  try {
    const { subdir, filename } = req.params
    
    // Validate subdir
    if (!SUBDIRS.includes(subdir)) {
      return res.status(400).json({ success: false, error: 'Invalid subdirectory' })
    }
    
    // Prevent path traversal
    const safeFilename = path.basename(filename)
    const filepath = path.join(CONFIG.uploadDir, subdir, safeFilename)
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }
    
    await fs.promises.unlink(filepath)
    
    console.log(`🗑️ Deleted: ${subdir}/${filename}`)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// List files
app.get('/api/files', async (req, res) => {
  try {
    const files = []
    
    for (const subdir of SUBDIRS) {
      const dirPath = path.join(CONFIG.uploadDir, subdir)
      if (!fs.existsSync(dirPath)) continue
      
      const items = await fs.promises.readdir(dirPath)
      for (const item of items) {
        const itemPath = path.join(dirPath, item)
        try {
          const stats = await fs.promises.stat(itemPath)
          
          if (stats.isFile()) {
            files.push({
              filename: item,
              url: `/uploads/${subdir}/${item}`,
              subdir,
              size: stats.size,
              createdAt: stats.birthtime.toISOString(),
            })
          }
        } catch (e) {
          // Skip files we can't read
        }
      }
    }
    
    // Sort newest first
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    res.json({ success: true, files })
  } catch (error) {
    console.error('List files error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// List files in specific subdir
app.get('/api/files/:subdir', async (req, res) => {
  try {
    const { subdir } = req.params
    
    if (!SUBDIRS.includes(subdir)) {
      return res.status(400).json({ success: false, error: 'Invalid subdirectory' })
    }
    
    const dirPath = path.join(CONFIG.uploadDir, subdir)
    const files = []
    
    if (fs.existsSync(dirPath)) {
      const items = await fs.promises.readdir(dirPath)
      for (const item of items) {
        const itemPath = path.join(dirPath, item)
        try {
          const stats = await fs.promises.stat(itemPath)
          
          if (stats.isFile()) {
            files.push({
              filename: item,
              url: `/uploads/${subdir}/${item}`,
              subdir,
              size: stats.size,
              createdAt: stats.birthtime.toISOString(),
            })
          }
        } catch (e) {
          // Skip files we can't read
        }
      }
    }
    
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    res.json({ success: true, files })
  } catch (error) {
    console.error('List files error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Migrate base64 to file
app.post('/api/migrate-base64', async (req, res) => {
  try {
    const { base64, originalName } = req.body
    
    if (!base64 || !base64.startsWith('data:')) {
      return res.status(400).json({ success: false, error: 'Invalid base64 data' })
    }
    
    // Parse base64
    const matches = base64.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Invalid base64 format' })
    }
    
    const mimeType = matches[1]
    const data = matches[2]
    const buffer = Buffer.from(data, 'base64')
    
    const subdir = getSubdirForMimeType(mimeType)
    
    let finalBuffer = buffer
    let extension = '.bin'
    
    // Determine extension from mime type
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = '.jpg'
    else if (mimeType.includes('png')) extension = '.png'
    else if (mimeType.includes('webp')) extension = '.webp'
    else if (mimeType.includes('gif')) extension = '.gif'
    else if (mimeType.includes('pdf')) extension = '.pdf'
    else if (mimeType.includes('zip')) extension = '.zip'
    
    // Process images
    if (ALLOWED_TYPES.images.includes(mimeType) && mimeType !== 'image/gif') {
      const processed = await processImage(buffer)
      finalBuffer = processed.buffer
      extension = '.webp'
    }
    
    const filename = `${uuidv4()}${extension}`
    const filepath = path.join(CONFIG.uploadDir, subdir, filename)
    
    // Ensure directory exists
    const dirPath = path.dirname(filepath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    await fs.promises.writeFile(filepath, finalBuffer)
    
    const url = `/uploads/${subdir}/${filename}`
    
    console.log(`✅ Migrated base64 to: ${url}`)
    
    res.json({
      success: true,
      url,
      filename,
      originalName: originalName || filename,
      mimeType,
      size: finalBuffer.length,
    })
  } catch (error) {
    console.error('Migration error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ===========================================
// FRONTEND SERVING
// ===========================================
async function startServer() {
  if (IS_PRODUCTION) {
    // Production: Serve built files
    if (fs.existsSync(DIST_DIR)) {
      app.use(express.static(DIST_DIR))
      
      // SPA fallback - use {*path} for Express 5.x compatibility
      app.get('/{*path}', (req, res) => {
        res.sendFile(path.join(DIST_DIR, 'index.html'))
      })
    } else {
      console.error('❌ Build not found at:', DIST_DIR)
      app.get('/{*path}', (req, res) => {
        res.status(500).send(`
          <html>
            <body style="font-family: sans-serif; padding: 40px;">
              <h1>⚠️ Build Not Found</h1>
              <p>Production build not found at: ${DIST_DIR}</p>
              <p>Run: <code>npm run build</code></p>
            </body>
          </html>
        `)
      })
    }
  } else {
    // Development: Use Vite middleware
    try {
      const { createServer: createViteServer } = await import('vite')
      const vite = await createViteServer({
        root: ROOT_DIR,
        server: { middlewareMode: true },
        appType: 'spa',
      })
      
      app.use(vite.middlewares)
      
      console.log('🔥 Vite dev middleware attached')
    } catch (error) {
      console.error('❌ Vite setup error:', error)
      // Don't crash in dev mode, just serve API
      app.get('/{*path}', (req, res) => {
        res.status(500).send('Vite dev server failed to start')
      })
    }
  }

  // ===========================================
  // START SERVER
  // ===========================================
  const server = app.listen(PORT, HOST, () => {
    console.log('')
    console.log('═══════════════════════════════════════════════════')
    console.log('  🚀 UNIFIED SERVER - PhalaCloud Ready')
    console.log('═══════════════════════════════════════════════════')
    console.log(`  📍 URL:        http://${HOST}:${PORT}`)
    console.log(`  🌐 Mode:       ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`)
    console.log(`  📁 Uploads:    ${CONFIG.uploadDir}`)
    console.log(`  📦 Dist:       ${DIST_DIR}`)
    console.log('')
    console.log('  📁 Routes:')
    console.log('     /api/health     → Health check')
    console.log('     /api/upload     → File upload')
    console.log('     /api/files      → List files')
    console.log('     /uploads/*      → Static files')
    console.log('     /*              → Frontend')
    console.log('═══════════════════════════════════════════════════')
    console.log('')
  })

  // Error handling
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error('')
      console.error('❌ ════════════════════════════════════════════════')
      console.error(`   PORT ${PORT} IS ALREADY IN USE!`)
      console.error('   ────────────────────────────────────────────────')
      console.error('   Kill existing process:')
      console.error(`   $ lsof -ti:${PORT} | xargs kill -9`)
      console.error('❌ ════════════════════════════════════════════════')
      console.error('')
      process.exit(1)
    } else {
      console.error('Server error:', error)
      process.exit(1)
    }
  })
}

// Start the server
startServer()
