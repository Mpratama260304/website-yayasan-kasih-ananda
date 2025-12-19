/**
 * ═══════════════════════════════════════════════════════════════════
 * UNIFIED SERVER - PostgreSQL Backend
 * ═══════════════════════════════════════════════════════════════════
 * 
 * FULL BACKEND REBUILD - NO localStorage, NO client-side persistence
 * All data is stored in PostgreSQL database
 * 
 * ✅ PostgreSQL database with Prisma ORM
 * ✅ Server-side sessions
 * ✅ File uploads to disk
 * ✅ RESTful API endpoints
 * ✅ PhalaCloud / Docker ready
 * 
 * ❌ NO .env file - all config via docker-compose environment
 * ═══════════════════════════════════════════════════════════════════
 */

// NOTE: No dotenv import - PhalaCloud doesn't support .env files
// All configuration comes from docker-compose.yml environment section

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'
import config from './config.js'
import * as db from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// ===========================================
// CONFIGURATION
// ===========================================
const PORT = config.port
const HOST = config.host
const IS_PRODUCTION = config.isProduction
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
// SETUP DIRECTORIES
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
}

// ===========================================
// EXPRESS APP
// ===========================================
const app = express()

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

// ===========================================
// AUTH MIDDLEWARE
// ===========================================
async function authMiddleware(req, res, next) {
  const token = req.cookies?.session || req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  const session = await db.validateSession(token)
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
  
  req.user = session.user
  req.session = session
  next()
}

// Optional auth - doesn't fail if not authenticated
async function optionalAuth(req, res, next) {
  const token = req.cookies?.session || req.headers.authorization?.replace('Bearer ', '')
  
  if (token) {
    const session = await db.validateSession(token)
    if (session) {
      req.user = session.user
      req.session = session
    }
  }
  next()
}

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
    
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      processed = processed.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
    
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

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// ===========================================
// HEALTH CHECK
// ===========================================
app.get('/api/health', async (req, res) => {
  try {
    const prisma = db.getPrisma()
    await prisma.$queryRaw`SELECT 1`
    
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      port: PORT,
      mode: IS_PRODUCTION ? 'production' : 'development',
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message,
    })
  }
})

// ===========================================
// AUTH ROUTES
// ===========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }
    
    const user = await db.validateCredentials(username, password)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const session = await db.createSession(user.id)
    
    // Set HTTP-only cookie
    res.cookie('session', session.token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })
    
    res.json({
      success: true,
      user: session.user,
      token: session.token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.cookies?.session || req.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      await db.destroySession(token)
    }
    
    res.clearCookie('session')
    res.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user })
})

// ===========================================
// USER ROUTES
// ===========================================
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await db.getUsers()
    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    // Don't send password hash
    const { password, ...safeUser } = user
    res.json(safeUser)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await db.updateUser(req.params.id, req.body)
    res.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

app.patch('/api/users/:id/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    // Only allow users to change their own password (or admins for any user)
    if (req.user.id !== req.params.id && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to change this password' })
    }
    
    const user = await db.getUserById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Verify current password
    const bcrypt = await import('bcryptjs')
    const isValid = await bcrypt.default.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }
    
    // Hash new password and update
    const hashedPassword = await bcrypt.default.hash(newPassword, 10)
    const updatedUser = await db.updateUser(req.params.id, { password: hashedPassword })
    
    // Don't send password hash
    const { password, ...safeUser } = updatedUser
    res.json(safeUser)
  } catch (error) {
    console.error('Update password error:', error)
    res.status(500).json({ error: 'Failed to update password' })
  }
})

// Check username availability
app.get('/api/users/check-username/:username', authMiddleware, async (req, res) => {
  try {
    const users = await db.getUsers()
    const exists = users.some(u => u.username.toLowerCase() === req.params.username.toLowerCase())
    res.json({ exists })
  } catch (error) {
    console.error('Check username error:', error)
    res.status(500).json({ error: 'Failed to check username' })
  }
})

// ===========================================
// POST ROUTES
// ===========================================
app.get('/api/posts', optionalAuth, async (req, res) => {
  try {
    const { status, category, search, limit, offset } = req.query
    
    // Non-authenticated users can only see published posts
    const options = {
      status: req.user ? status : 'PUBLISHED',
      categoryId: category,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    }
    
    const posts = await db.getPosts(options)
    res.json(posts)
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({ error: 'Failed to get posts' })
  }
})

app.get('/api/posts/:id', optionalAuth, async (req, res) => {
  try {
    const post = await db.getPostById(req.params.id)
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    
    // Non-authenticated users can only see published posts
    if (!req.user && post.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Post not found' })
    }
    
    res.json(post)
  } catch (error) {
    console.error('Get post error:', error)
    res.status(500).json({ error: 'Failed to get post' })
  }
})

app.get('/api/posts/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const post = await db.getPostBySlug(req.params.slug)
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    
    if (!req.user && post.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Post not found' })
    }
    
    res.json(post)
  } catch (error) {
    console.error('Get post by slug error:', error)
    res.status(500).json({ error: 'Failed to get post' })
  }
})

app.post('/api/posts', authMiddleware, async (req, res) => {
  try {
    const { title, content, excerpt, featuredImage, status, categories, tags } = req.body
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' })
    }
    
    // Generate unique slug
    let slug = slugify(title)
    const existingPost = await db.getPostBySlug(slug)
    if (existingPost) {
      slug = `${slug}-${Date.now()}`
    }
    
    const post = await db.createPost({
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      status: status || 'DRAFT',
      authorId: req.user.id,
      categories,
      tags,
    })
    
    res.status(201).json(post)
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

app.put('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { title, slug, content, excerpt, featuredImage, status, categories, tags } = req.body
    
    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage
    if (status !== undefined) updateData.status = status
    if (categories !== undefined) updateData.categories = categories
    if (tags !== undefined) updateData.tags = tags
    
    const post = await db.updatePost(req.params.id, updateData)
    res.json(post)
  } catch (error) {
    console.error('Update post error:', error)
    res.status(500).json({ error: 'Failed to update post' })
  }
})

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    await db.deletePost(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// ===========================================
// CATEGORY ROUTES
// ===========================================
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getCategories()
    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to get categories' })
  }
})

app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }
    
    const slug = slugify(name)
    const category = await db.createCategory({ name, slug, description })
    res.status(201).json(category)
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await db.updateCategory(req.params.id, req.body)
    res.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteCategory(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// ===========================================
// TAG ROUTES
// ===========================================
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await db.getTags()
    res.json(tags)
  } catch (error) {
    console.error('Get tags error:', error)
    res.status(500).json({ error: 'Failed to get tags' })
  }
})

app.post('/api/tags', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }
    
    const tag = await db.findOrCreateTag(name)
    res.status(201).json(tag)
  } catch (error) {
    console.error('Create tag error:', error)
    res.status(500).json({ error: 'Failed to create tag' })
  }
})

app.delete('/api/tags/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteTag(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete tag error:', error)
    res.status(500).json({ error: 'Failed to delete tag' })
  }
})

// ===========================================
// GALLERY ROUTES
// ===========================================
app.get('/api/gallery', async (req, res) => {
  try {
    const { unit, album, limit, offset } = req.query
    
    const photos = await db.getGalleryPhotos({
      unit,
      albumId: album,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
    
    res.json(photos)
  } catch (error) {
    console.error('Get gallery error:', error)
    res.status(500).json({ error: 'Failed to get gallery' })
  }
})

app.post('/api/gallery', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, description, unit, albumId } = req.body
    
    if (!req.file && !req.body.fileUrl) {
      return res.status(400).json({ error: 'File or file URL required' })
    }
    
    let fileUrl = req.body.fileUrl
    
    // If file was uploaded, process and save it
    if (req.file) {
      const { buffer, mimetype, originalname } = req.file
      
      let finalBuffer = buffer
      let extension = path.extname(originalname).toLowerCase() || '.bin'
      
      if (ALLOWED_TYPES.images.includes(mimetype)) {
        const processed = await processImage(buffer)
        finalBuffer = processed.buffer
        extension = processed.format === 'gif' ? '.gif' : '.webp'
      }
      
      const filename = `${uuidv4()}${extension}`
      const filepath = path.join(CONFIG.uploadDir, 'images', filename)
      
      await fs.promises.writeFile(filepath, finalBuffer)
      fileUrl = `/uploads/images/${filename}`
    }
    
    const photo = await db.createGalleryPhoto({
      title: title || 'Untitled',
      description,
      fileUrl,
      fileType: 'image',
      unit: unit || 'SD',
      albumId: albumId || null,
    })
    
    res.status(201).json(photo)
  } catch (error) {
    console.error('Create gallery photo error:', error)
    res.status(500).json({ error: 'Failed to create gallery photo' })
  }
})

app.put('/api/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const photo = await db.updateGalleryPhoto(req.params.id, req.body)
    res.json(photo)
  } catch (error) {
    console.error('Update gallery photo error:', error)
    res.status(500).json({ error: 'Failed to update gallery photo' })
  }
})

app.delete('/api/gallery/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteGalleryPhoto(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete gallery photo error:', error)
    res.status(500).json({ error: 'Failed to delete gallery photo' })
  }
})

// Gallery Albums
app.get('/api/gallery/albums', async (req, res) => {
  try {
    const { unit } = req.query
    const albums = await db.getGalleryAlbums({ unit })
    res.json(albums)
  } catch (error) {
    console.error('Get albums error:', error)
    res.status(500).json({ error: 'Failed to get albums' })
  }
})

app.post('/api/gallery/albums', authMiddleware, async (req, res) => {
  try {
    const album = await db.createGalleryAlbum(req.body)
    res.status(201).json(album)
  } catch (error) {
    console.error('Create album error:', error)
    res.status(500).json({ error: 'Failed to create album' })
  }
})

app.put('/api/gallery/albums/:id', authMiddleware, async (req, res) => {
  try {
    const album = await db.updateGalleryAlbum(req.params.id, req.body)
    res.json(album)
  } catch (error) {
    console.error('Update album error:', error)
    res.status(500).json({ error: 'Failed to update album' })
  }
})

app.delete('/api/gallery/albums/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteGalleryAlbum(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete album error:', error)
    res.status(500).json({ error: 'Failed to delete album' })
  }
})

// Gallery Categories
app.get('/api/gallery/categories', async (req, res) => {
  try {
    const { unit } = req.query
    const categories = await db.getGalleryCategories(unit)
    res.json(categories)
  } catch (error) {
    console.error('Get gallery categories error:', error)
    res.status(500).json({ error: 'Failed to get gallery categories' })
  }
})

app.post('/api/gallery/categories', authMiddleware, async (req, res) => {
  try {
    const category = await db.createGalleryCategory(req.body)
    res.status(201).json(category)
  } catch (error) {
    console.error('Create gallery category error:', error)
    res.status(500).json({ error: 'Failed to create gallery category' })
  }
})

app.delete('/api/gallery/categories/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteGalleryCategory(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete gallery category error:', error)
    res.status(500).json({ error: 'Failed to delete gallery category' })
  }
})

// ===========================================
// ENROLLMENT (PPDB) ROUTES
// ===========================================
app.get('/api/enrollments', authMiddleware, async (req, res) => {
  try {
    const { unit, status, academicYear, limit, offset } = req.query
    
    const enrollments = await db.getEnrollments({
      unit,
      status,
      academicYear,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
    
    res.json(enrollments)
  } catch (error) {
    console.error('Get enrollments error:', error)
    res.status(500).json({ error: 'Failed to get enrollments' })
  }
})

app.get('/api/enrollments/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await db.getEnrollmentStats()
    res.json(stats)
  } catch (error) {
    console.error('Get enrollment stats error:', error)
    res.status(500).json({ error: 'Failed to get enrollment stats' })
  }
})

// Check if NIK already exists (public endpoint for form validation)
app.get('/api/enrollments/check-nik/:nik', async (req, res) => {
  try {
    const exists = await db.checkNikExists(req.params.nik)
    res.json({ exists })
  } catch (error) {
    console.error('Check NIK error:', error)
    res.status(500).json({ error: 'Failed to check NIK' })
  }
})

app.get('/api/enrollments/:id', authMiddleware, async (req, res) => {
  try {
    const enrollment = await db.getEnrollmentById(req.params.id)
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' })
    }
    
    res.json(enrollment)
  } catch (error) {
    console.error('Get enrollment error:', error)
    res.status(500).json({ error: 'Failed to get enrollment' })
  }
})

app.post('/api/enrollments', async (req, res) => {
  try {
    // Check if PPDB is open
    const ppdbStatus = await db.getPPDBStatus()
    if (!ppdbStatus.isOpen) {
      return res.status(400).json({ error: 'Pendaftaran saat ini ditutup', message: ppdbStatus.closedMessage })
    }
    
    const enrollment = await db.createEnrollment(req.body)
    res.status(201).json(enrollment)
  } catch (error) {
    console.error('Create enrollment error:', error)
    res.status(500).json({ error: 'Failed to create enrollment' })
  }
})

app.put('/api/enrollments/:id', authMiddleware, async (req, res) => {
  try {
    const enrollment = await db.updateEnrollment(req.params.id, req.body)
    res.json(enrollment)
  } catch (error) {
    console.error('Update enrollment error:', error)
    res.status(500).json({ error: 'Failed to update enrollment' })
  }
})

app.patch('/api/enrollments/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const enrollment = await db.updateEnrollment(req.params.id, { status })
    res.json(enrollment)
  } catch (error) {
    console.error('Update enrollment status error:', error)
    res.status(500).json({ error: 'Failed to update enrollment status' })
  }
})

app.delete('/api/enrollments/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteEnrollment(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete enrollment error:', error)
    res.status(500).json({ error: 'Failed to delete enrollment' })
  }
})

// ===========================================
// CONTACT MESSAGE ROUTES
// ===========================================
app.get('/api/contact', authMiddleware, async (req, res) => {
  try {
    const { status, limit, offset } = req.query
    
    const messages = await db.getContactMessages({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
    
    res.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

app.get('/api/contact/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await db.getUnreadMessageCount()
    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
})

app.get('/api/contact/:id', authMiddleware, async (req, res) => {
  try {
    const message = await db.getContactMessageById(req.params.id)
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }
    
    res.json(message)
  } catch (error) {
    console.error('Get message error:', error)
    res.status(500).json({ error: 'Failed to get message' })
  }
})

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' })
    }
    
    const contactMessage = await db.createContactMessage({
      name,
      email,
      phone,
      subject,
      message,
    })
    
    res.status(201).json(contactMessage)
  } catch (error) {
    console.error('Create message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

app.patch('/api/contact/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    
    if (!['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    
    const message = await db.updateContactMessageStatus(req.params.id, status)
    res.json(message)
  } catch (error) {
    console.error('Update message status error:', error)
    res.status(500).json({ error: 'Failed to update message status' })
  }
})

app.delete('/api/contact/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteContactMessage(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

// ===========================================
// MEDIA ROUTES
// ===========================================
app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    const { type, limit, offset } = req.query
    
    const files = await db.getMediaFiles({
      mimeType: type,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
    
    res.json(files)
  } catch (error) {
    console.error('Get media error:', error)
    res.status(500).json({ error: 'Failed to get media' })
  }
})

app.delete('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const media = await db.deleteMediaFile(req.params.id)
    
    // Also delete file from disk if it exists
    if (media && media.url && !media.url.startsWith('http')) {
      const filepath = path.join(ROOT_DIR, media.url)
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath)
      }
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete media error:', error)
    res.status(500).json({ error: 'Failed to delete media' })
  }
})

// ===========================================
// SETTINGS ROUTES
// ===========================================
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getGlobalSettings()
    res.json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

app.put('/api/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await db.updateGlobalSettings(req.body)
    res.json(settings)
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

app.get('/api/settings/ppdb', async (req, res) => {
  try {
    const status = await db.getPPDBStatus()
    res.json(status)
  } catch (error) {
    console.error('Get PPDB status error:', error)
    res.status(500).json({ error: 'Failed to get PPDB status' })
  }
})

app.patch('/api/settings/ppdb', authMiddleware, async (req, res) => {
  try {
    const { isOpen } = req.body
    
    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ error: 'isOpen must be a boolean' })
    }
    
    await db.setPPDBStatus(isOpen)
    const status = await db.getPPDBStatus()
    res.json(status)
  } catch (error) {
    console.error('Update PPDB status error:', error)
    res.status(500).json({ error: 'Failed to update PPDB status' })
  }
})

// ===========================================
// DASHBOARD ROUTES
// ===========================================
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await db.getDashboardStats()
    res.json(stats)
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to get dashboard stats' })
  }
})

// ===========================================
// FILE UPLOAD ROUTES
// ===========================================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const { buffer, mimetype, originalname } = req.file
    const subdir = getSubdirForMimeType(mimetype)
    
    let finalBuffer = buffer
    let extension = path.extname(originalname).toLowerCase() || '.bin'
    let width, height
    
    if (ALLOWED_TYPES.images.includes(mimetype)) {
      const processed = await processImage(buffer)
      finalBuffer = processed.buffer
      extension = processed.format === 'gif' ? '.gif' : '.webp'
      width = processed.width
      height = processed.height
    }
    
    const filename = `${uuidv4()}${extension}`
    const filepath = path.join(CONFIG.uploadDir, subdir, filename)
    
    const dirPath = path.dirname(filepath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    await fs.promises.writeFile(filepath, finalBuffer)
    
    const url = `/uploads/${subdir}/${filename}`
    
    // Save to database
    await db.createMediaFile({
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size: finalBuffer.length,
      url,
      width,
      height,
    })
    
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
        
        const dirPath = path.dirname(filepath)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
        }
        
        await fs.promises.writeFile(filepath, finalBuffer)
        
        const url = `/uploads/${subdir}/${filename}`
        
        await db.createMediaFile({
          filename,
          originalName: originalname,
          mimeType: mimetype,
          size: finalBuffer.length,
          url,
        })
        
        results.successful.push({
          url,
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

app.post('/api/upload/avatar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const { buffer, mimetype, originalname } = req.file
    
    if (!ALLOWED_TYPES.images.includes(mimetype)) {
      return res.status(400).json({ success: false, error: 'Only images allowed for avatars' })
    }

    const processed = await sharp(buffer)
      .resize(256, 256, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer()

    const filename = `${uuidv4()}.webp`
    const filepath = path.join(CONFIG.uploadDir, 'avatars', filename)
    
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

app.delete('/api/upload/:subdir/:filename', authMiddleware, async (req, res) => {
  try {
    const { subdir, filename } = req.params
    
    if (!SUBDIRS.includes(subdir)) {
      return res.status(400).json({ success: false, error: 'Invalid subdirectory' })
    }
    
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
    
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    res.json({ success: true, files })
  } catch (error) {
    console.error('List files error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ===========================================
// FRONTEND SERVING
// ===========================================
async function startServer() {
  // Initialize database
  try {
    await db.initializeDatabase()
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message)
    console.error('   Make sure PostgreSQL is running and DATABASE_URL is correct')
    process.exit(1)
  }
  
  if (IS_PRODUCTION) {
    if (fs.existsSync(DIST_DIR)) {
      app.use(express.static(DIST_DIR))
      
      // Catch-all for SPA - exclude API routes (Express 5.x syntax)
      app.get('/{*path}', (req, res, next) => {
        // Don't catch API routes
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
          return next()
        }
        res.sendFile(path.join(DIST_DIR, 'index.html'))
      })
    } else {
      console.error('❌ Build not found at:', DIST_DIR)
      // Only serve error page for non-API routes (Express 5.x syntax)
      app.get('/{*path}', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
          return next()
        }
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
      app.get('/{*path}', (req, res) => {
        res.status(500).send('Vite dev server failed to start')
      })
    }
  }

  const server = app.listen(PORT, HOST, () => {
    console.log('')
    console.log('═══════════════════════════════════════════════════')
    console.log('  🚀 SERVER - PostgreSQL Backend')
    console.log('═══════════════════════════════════════════════════')
    console.log(`  📍 URL:        http://${HOST}:${PORT}`)
    console.log(`  🌐 Mode:       ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`)
    console.log(`  📁 Uploads:    ${CONFIG.uploadDir}`)
    console.log(`  🗄️  Database:   PostgreSQL (Prisma)`)
    console.log('')
    console.log('  📁 API Routes:')
    console.log('     /api/auth/*        → Authentication')
    console.log('     /api/posts/*       → Blog posts')
    console.log('     /api/gallery/*     → Photo gallery')
    console.log('     /api/enrollments/* → PPDB registrations')
    console.log('     /api/contact/*     → Contact messages')
    console.log('     /api/settings/*    → Global settings')
    console.log('     /api/upload/*      → File uploads')
    console.log('     /uploads/*         → Static files')
    console.log('═══════════════════════════════════════════════════')
    console.log('')
  })

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

startServer()
