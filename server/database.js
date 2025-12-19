/**
 * ═══════════════════════════════════════════════════════════════════
 * DATABASE SERVICE - Prisma PostgreSQL
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Handles all database operations via Prisma ORM
 * ═══════════════════════════════════════════════════════════════════
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Singleton Prisma Client
let prisma

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    })
  }
  return prisma
}

// ============================================
// DATABASE INITIALIZATION
// ============================================
export async function initializeDatabase() {
  const db = getPrisma()
  
  try {
    // Test connection
    await db.$connect()
    console.log('✅ Database connected successfully')
    
    // Initialize default admin user if none exists
    const userCount = await db.user.count()
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await db.user.create({
        data: {
          username: 'admin',
          passwordHash: hashedPassword,
          role: 'admin',
          name: 'Administrator',
          email: 'admin@yayasankasiananda.com',
        },
      })
      console.log('✅ Default admin user created (username: admin, password: admin123)')
    }
    
    // Initialize global settings if none exists
    const settings = await db.globalSettings.findUnique({ where: { id: 'global' } })
    if (!settings) {
      await db.globalSettings.create({
        data: {
          id: 'global',
          siteName: 'Yayasan Kasih Ananda',
          siteDescription: 'Yayasan pendidikan yang berkomitmen mencerdaskan anak bangsa',
          ppdbOpen: false,
          ppdbOpenMessage: 'Pendaftaran Peserta Didik Baru telah dibuka!',
          ppdbClosedMessage: 'Pendaftaran Peserta Didik Baru saat ini ditutup. Silakan pantau website untuk informasi pembukaan selanjutnya.',
        },
      })
      console.log('✅ Default global settings created')
    }
    
    // Create default categories
    const categoryCount = await db.category.count()
    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'Pengumuman', slug: 'pengumuman', description: 'Pengumuman resmi dari sekolah' },
        { name: 'Kegiatan', slug: 'kegiatan', description: 'Kegiatan dan acara sekolah' },
        { name: 'Prestasi', slug: 'prestasi', description: 'Prestasi siswa dan sekolah' },
        { name: 'Akademik', slug: 'akademik', description: 'Informasi akademik' },
      ]
      await db.category.createMany({ data: defaultCategories })
      console.log('✅ Default categories created')
    }
    
    return true
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// ============================================
// AUTH SERVICES
// ============================================
export async function validateCredentials(username, password) {
  const db = getPrisma()
  const user = await db.user.findUnique({ where: { username } })
  
  if (!user) return null
  
  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) return null
  
  // Return user without password hash
  const { passwordHash, ...safeUser } = user
  return safeUser
}

export async function createSession(userId) {
  const db = getPrisma()
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  const session = await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  })
  
  return session
}

export async function validateSession(token) {
  const db = getPrisma()
  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  })
  
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { token } })
    return null
  }
  
  return session
}

export async function destroySession(token) {
  const db = getPrisma()
  try {
    await db.session.delete({ where: { token } })
    return true
  } catch {
    return false
  }
}

// ============================================
// USER SERVICES
// ============================================
export async function getUsers() {
  const db = getPrisma()
  const users = await db.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return users
}

export async function getUserById(id) {
  const db = getPrisma()
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return user
}

export async function updateUser(id, data) {
  const db = getPrisma()
  
  const updateData = { ...data }
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10)
    delete updateData.password
  }
  
  const user = await db.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      role: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return user
}

// ============================================
// POST SERVICES
// ============================================
export async function getPosts(options = {}) {
  const db = getPrisma()
  const { status, categoryId, search, limit, offset } = options
  
  const where = {}
  if (status) where.status = status
  if (categoryId) {
    where.categories = { some: { categoryId } }
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  const posts = await db.post.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
  
  // Transform categories and tags
  return posts.map(post => ({
    ...post,
    categories: post.categories.map(pc => pc.category),
    tags: post.tags.map(pt => pt.tag),
  }))
}

export async function getPostById(id) {
  const db = getPrisma()
  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  })
  
  if (!post) return null
  
  return {
    ...post,
    categories: post.categories.map(pc => pc.category),
    tags: post.tags.map(pt => pt.tag),
  }
}

export async function getPostBySlug(slug) {
  const db = getPrisma()
  const post = await db.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  })
  
  if (!post) return null
  
  return {
    ...post,
    categories: post.categories.map(pc => pc.category),
    tags: post.tags.map(pt => pt.tag),
  }
}

export async function createPost(data) {
  const db = getPrisma()
  const { categories, tags, ...postData } = data
  
  const post = await db.post.create({
    data: {
      ...postData,
      publishedAt: postData.status === 'PUBLISHED' ? new Date() : null,
      categories: categories?.length ? {
        create: categories.map(categoryId => ({ categoryId })),
      } : undefined,
      tags: tags?.length ? {
        create: tags.map(tagId => ({ tagId })),
      } : undefined,
    },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  })
  
  return {
    ...post,
    categories: post.categories.map(pc => pc.category),
    tags: post.tags.map(pt => pt.tag),
  }
}

export async function updatePost(id, data) {
  const db = getPrisma()
  const { categories, tags, ...postData } = data
  
  // Handle status change
  if (postData.status === 'PUBLISHED') {
    const existing = await db.post.findUnique({ where: { id } })
    if (existing && existing.status !== 'PUBLISHED') {
      postData.publishedAt = new Date()
    }
  }
  
  // Update categories if provided
  if (categories !== undefined) {
    await db.postCategory.deleteMany({ where: { postId: id } })
    if (categories.length > 0) {
      await db.postCategory.createMany({
        data: categories.map(categoryId => ({ postId: id, categoryId })),
      })
    }
  }
  
  // Update tags if provided
  if (tags !== undefined) {
    await db.postTag.deleteMany({ where: { postId: id } })
    if (tags.length > 0) {
      await db.postTag.createMany({
        data: tags.map(tagId => ({ postId: id, tagId })),
      })
    }
  }
  
  const post = await db.post.update({
    where: { id },
    data: postData,
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  })
  
  return {
    ...post,
    categories: post.categories.map(pc => pc.category),
    tags: post.tags.map(pt => pt.tag),
  }
}

export async function deletePost(id) {
  const db = getPrisma()
  await db.post.delete({ where: { id } })
  return true
}

// ============================================
// CATEGORY SERVICES
// ============================================
export async function getCategories() {
  const db = getPrisma()
  return db.category.findMany({ orderBy: { name: 'asc' } })
}

export async function createCategory(data) {
  const db = getPrisma()
  return db.category.create({ data })
}

export async function updateCategory(id, data) {
  const db = getPrisma()
  return db.category.update({ where: { id }, data })
}

export async function deleteCategory(id) {
  const db = getPrisma()
  await db.category.delete({ where: { id } })
  return true
}

// ============================================
// TAG SERVICES
// ============================================
export async function getTags() {
  const db = getPrisma()
  return db.tag.findMany({ orderBy: { name: 'asc' } })
}

export async function createTag(data) {
  const db = getPrisma()
  return db.tag.create({ data })
}

export async function findOrCreateTag(name) {
  const db = getPrisma()
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  
  let tag = await db.tag.findUnique({ where: { slug } })
  if (!tag) {
    tag = await db.tag.create({ data: { name, slug } })
  }
  return tag
}

export async function deleteTag(id) {
  const db = getPrisma()
  await db.tag.delete({ where: { id } })
  return true
}

// ============================================
// GALLERY SERVICES
// ============================================
export async function getGalleryPhotos(options = {}) {
  const db = getPrisma()
  const { unit, albumId, limit, offset } = options
  
  const where = {}
  if (unit) where.unit = unit
  if (albumId) where.albumId = albumId
  
  return db.galleryPhoto.findMany({
    where,
    include: { album: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export async function createGalleryPhoto(data) {
  const db = getPrisma()
  return db.galleryPhoto.create({
    data,
    include: { album: true },
  })
}

export async function updateGalleryPhoto(id, data) {
  const db = getPrisma()
  return db.galleryPhoto.update({
    where: { id },
    data,
    include: { album: true },
  })
}

export async function deleteGalleryPhoto(id) {
  const db = getPrisma()
  await db.galleryPhoto.delete({ where: { id } })
  return true
}

// Gallery Albums
export async function getGalleryAlbums(options = {}) {
  const db = getPrisma()
  const { unit } = options
  
  const where = {}
  if (unit) where.unit = unit
  
  return db.galleryAlbum.findMany({
    where,
    include: {
      photos: { take: 4 },
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createGalleryAlbum(data) {
  const db = getPrisma()
  return db.galleryAlbum.create({ data })
}

export async function updateGalleryAlbum(id, data) {
  const db = getPrisma()
  return db.galleryAlbum.update({ where: { id }, data })
}

export async function deleteGalleryAlbum(id) {
  const db = getPrisma()
  await db.galleryAlbum.delete({ where: { id } })
  return true
}

// Gallery Categories
export async function getGalleryCategories(unit) {
  const db = getPrisma()
  const where = unit ? { unit } : {}
  return db.galleryCategory.findMany({ where, orderBy: { name: 'asc' } })
}

export async function createGalleryCategory(data) {
  const db = getPrisma()
  return db.galleryCategory.create({ data })
}

export async function deleteGalleryCategory(id) {
  const db = getPrisma()
  await db.galleryCategory.delete({ where: { id } })
  return true
}

// ============================================
// ENROLLMENT SERVICES
// ============================================
function generateRegistrationNo(unit) {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${unit}-${year}-${random}`
}

export async function getEnrollments(options = {}) {
  const db = getPrisma()
  const { unit, status, academicYear, limit, offset } = options
  
  const where = {}
  if (unit) where.unit = unit
  if (status) where.status = status
  if (academicYear) where.academicYear = academicYear
  
  return db.enrollment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export async function getEnrollmentById(id) {
  const db = getPrisma()
  return db.enrollment.findUnique({ where: { id } })
}

export async function createEnrollment(data) {
  const db = getPrisma()
  const registrationNo = generateRegistrationNo(data.unit)
  
  return db.enrollment.create({
    data: {
      ...data,
      registrationNo,
      birthDate: new Date(data.birthDate),
    },
  })
}

export async function updateEnrollment(id, data) {
  const db = getPrisma()
  
  const updateData = { ...data }
  if (data.birthDate) {
    updateData.birthDate = new Date(data.birthDate)
  }
  
  return db.enrollment.update({
    where: { id },
    data: updateData,
  })
}

export async function deleteEnrollment(id) {
  const db = getPrisma()
  await db.enrollment.delete({ where: { id } })
  return true
}

export async function checkNikExists(nik) {
  const db = getPrisma()
  const enrollment = await db.enrollment.findFirst({
    where: {
      nik,
      status: { not: 'REJECTED' },
    },
    select: { id: true },
  })
  return !!enrollment
}

export async function getEnrollmentStats() {
  const db = getPrisma()
  
  const [total, byStatus, byUnit] = await Promise.all([
    db.enrollment.count(),
    db.enrollment.groupBy({
      by: ['status'],
      _count: true,
    }),
    db.enrollment.groupBy({
      by: ['unit'],
      _count: true,
    }),
  ])
  
  return {
    total,
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    byUnit: Object.fromEntries(byUnit.map(u => [u.unit, u._count])),
  }
}

// ============================================
// CONTACT MESSAGE SERVICES
// ============================================
export async function getContactMessages(options = {}) {
  const db = getPrisma()
  const { status, limit, offset } = options
  
  const where = {}
  if (status) where.status = status
  
  return db.contactMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export async function getContactMessageById(id) {
  const db = getPrisma()
  return db.contactMessage.findUnique({ where: { id } })
}

export async function createContactMessage(data) {
  const db = getPrisma()
  return db.contactMessage.create({ data })
}

export async function updateContactMessageStatus(id, status) {
  const db = getPrisma()
  
  const data = { status }
  if (status === 'REPLIED') {
    data.repliedAt = new Date()
  }
  
  return db.contactMessage.update({
    where: { id },
    data,
  })
}

export async function deleteContactMessage(id) {
  const db = getPrisma()
  await db.contactMessage.delete({ where: { id } })
  return true
}

export async function getUnreadMessageCount() {
  const db = getPrisma()
  return db.contactMessage.count({ where: { status: 'UNREAD' } })
}

// ============================================
// MEDIA SERVICES
// ============================================
export async function getMediaFiles(options = {}) {
  const db = getPrisma()
  const { mimeType, limit, offset } = options
  
  const where = {}
  if (mimeType) {
    where.mimeType = { startsWith: mimeType }
  }
  
  return db.mediaFile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export async function createMediaFile(data) {
  const db = getPrisma()
  return db.mediaFile.create({ data })
}

export async function updateMediaFile(id, data) {
  const db = getPrisma()
  return db.mediaFile.update({ where: { id }, data })
}

export async function deleteMediaFile(id) {
  const db = getPrisma()
  const media = await db.mediaFile.findUnique({ where: { id } })
  if (media) {
    await db.mediaFile.delete({ where: { id } })
  }
  return media
}

// ============================================
// GLOBAL SETTINGS SERVICES
// ============================================
export async function getGlobalSettings() {
  const db = getPrisma()
  let settings = await db.globalSettings.findUnique({ where: { id: 'global' } })
  
  if (!settings) {
    settings = await db.globalSettings.create({
      data: {
        id: 'global',
        siteName: 'Yayasan Kasih Ananda',
      },
    })
  }
  
  return settings
}

export async function updateGlobalSettings(data) {
  const db = getPrisma()
  return db.globalSettings.upsert({
    where: { id: 'global' },
    update: data,
    create: { id: 'global', ...data },
  })
}

export async function getPPDBStatus() {
  const settings = await getGlobalSettings()
  return {
    isOpen: settings.ppdbOpen,
    openMessage: settings.ppdbOpenMessage,
    closedMessage: settings.ppdbClosedMessage,
  }
}

export async function setPPDBStatus(isOpen) {
  const db = getPrisma()
  return db.globalSettings.update({
    where: { id: 'global' },
    data: { ppdbOpen: isOpen },
  })
}

// ============================================
// DASHBOARD STATS
// ============================================
export async function getDashboardStats() {
  const db = getPrisma()
  
  const [
    totalPosts,
    publishedPosts,
    totalEnrollments,
    pendingEnrollments,
    totalMessages,
    unreadMessages,
    totalPhotos,
  ] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { status: 'PUBLISHED' } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: 'PENDING' } }),
    db.contactMessage.count(),
    db.contactMessage.count({ where: { status: 'UNREAD' } }),
    db.galleryPhoto.count(),
  ])
  
  return {
    posts: { total: totalPosts, published: publishedPosts },
    enrollments: { total: totalEnrollments, pending: pendingEnrollments },
    messages: { total: totalMessages, unread: unreadMessages },
    gallery: { total: totalPhotos },
  }
}

export { getPrisma }
