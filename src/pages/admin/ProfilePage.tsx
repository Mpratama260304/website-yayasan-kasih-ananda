import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi } from '@/lib/api'
import { uploadAvatar, checkUploadServer, isBase64, getFileUrl } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { User as UserIcon, Key, Shield, Camera, Warning, Spinner } from '@phosphor-icons/react'

export function ProfilePage() {
  const { user: currentUser, logout } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    username: '',
    email: '',
  })

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  useEffect(() => {
    loadProfile()
    checkServer()
  }, [currentUser])

  const checkServer = async () => {
    const online = await checkUploadServer()
    setServerOnline(online)
  }

  // Get display URL for avatar (handles both base64 and URL)
  const getAvatarDisplayUrl = (url: string) => {
    if (!url) return ''
    if (isBase64(url)) return url // Legacy base64
    return getFileUrl(url)
  }

  const loadProfile = async () => {
    if (!currentUser?.id) return
    try {
      setIsLoading(true)
      const loadedUser = await usersApi.getById(currentUser.id)
      if (loadedUser) {
        setUser(loadedUser)
        setProfileForm({
          name: loadedUser.name || '',
          username: loadedUser.username || '',
          email: loadedUser.email || '',
        })
        const avatar = loadedUser.avatar || ''
        setAvatarPreview(getAvatarDisplayUrl(avatar))
        setAvatarUrl(avatar)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Gagal memuat profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    if (!profileForm.name.trim()) {
      toast.error('Nama wajib diisi')
      return
    }
    if (!profileForm.username.trim()) {
      toast.error('Username wajib diisi')
      return
    }
    if (profileForm.username.length < 3) {
      toast.error('Username minimal 3 karakter')
      return
    }

    try {
      setIsSaving(true)

      // Check username uniqueness (excluding current user)
      const users = await usersApi.getAll()
      const usernameTaken = users.some(
        u => u.id !== user.id && u.username.toLowerCase() === profileForm.username.toLowerCase()
      )
      if (usernameTaken) {
        toast.error('Username sudah digunakan')
        return
      }

      const updatedUser = await usersApi.update(user.id, {
        name: profileForm.name.trim(),
        username: profileForm.username.trim(),
        email: profileForm.email.trim() || undefined,
        avatar: avatarUrl || undefined,
      })

      setUser(updatedUser)
      toast.success('Profil berhasil diupdate')

      // If username changed, suggest re-login
      if (user.username !== updatedUser.username) {
        toast.info('Username berubah. Disarankan login ulang.')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Gagal mengupdate profil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!user) return

    if (!passwordForm.currentPassword) {
      toast.error('Password saat ini wajib diisi')
      return
    }
    if (!passwordForm.newPassword) {
      toast.error('Password baru wajib diisi')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }

    try {
      setIsSaving(true)

      await usersApi.updatePassword(user.id, passwordForm.currentPassword, passwordForm.newPassword)

      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      toast.success('Password berhasil diubah')
      toast.info('Silakan login ulang dengan password baru', { duration: 5000 })

      // Force logout after password change
      setTimeout(() => {
        logout()
      }, 2000)
    } catch (error: any) {
      console.error('Error updating password:', error)
      if (error.message?.includes('incorrect')) {
        toast.error('Password saat ini salah')
      } else {
        toast.error('Gagal mengubah password')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }

    // Check server status
    if (!serverOnline) {
      toast.error('Server upload tidak tersedia. Jalankan: npm run server')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setIsUploading(true)
    try {
      const result = await uploadAvatar(file)
      if (result.success && result.url) {
        setAvatarUrl(result.url) // Store URL
        setAvatarPreview(getAvatarDisplayUrl(result.url))
        toast.success('Avatar berhasil diupload')
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Gagal mengupload avatar')
      setAvatarPreview(getAvatarDisplayUrl(avatarUrl)) // Revert
    } finally {
      setIsUploading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Gagal memuat data profil</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Profil Admin</h1>
        <p className="text-muted-foreground">Kelola informasi akun dan keamanan Anda</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon size={20} />
            Informasi Profil
          </CardTitle>
          <CardDescription>Update informasi dasar akun admin Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={avatarPreview} alt={user.name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Camera size={24} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Klik foto untuk mengubah avatar
              </p>
            </div>
          </div>

          <Separator />

          {/* Profile Form */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                placeholder="username"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Email (opsional)</Label>
              <Input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpdateProfile} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key size={20} />
            Ubah Password
          </CardTitle>
          <CardDescription>
            Perbarui password akun Anda. Anda akan diminta login ulang setelah mengubah password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password Saat Ini *</Label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Masukkan password saat ini"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Password Baru *</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password *</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleUpdatePassword} 
              disabled={isSaving}
              variant="destructive"
            >
              {isSaving ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Informasi Keamanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Akun Dibuat</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            {user.updatedAt && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Terakhir Diupdate</span>
                <span className="font-medium">
                  {new Date(user.updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
