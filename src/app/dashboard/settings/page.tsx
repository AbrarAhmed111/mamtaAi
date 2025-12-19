'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaUser, FaPhone, FaImage, FaSave, FaArrowLeft, FaBaby, FaComments, FaBook, FaFile } from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  full_name: string
  phone_number: string | null
  avatar_url: string | null
  role: string | null
  created_at: string | null
}

interface Stats {
  babies: number
  blogPosts: number
  forumThreads: number
  resources: number
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    babies: 0,
    blogPosts: 0,
    forumThreads: 0,
    resources: 0,
  })
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    avatar_url: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      loadStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (data.profile) {
        setProfile(data.profile)
        setFormData({
          full_name: data.profile.full_name || '',
          phone_number: data.profile.phone_number || '',
          avatar_url: data.profile.avatar_url || '',
        })
        if (data.profile.avatar_url) {
          setAvatarPreview(data.profile.avatar_url)
        }
      }
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!profile) return
    
    try {
      // Load user stats
      const [babiesRes, blogRes, forumRes, resourcesRes] = await Promise.all([
        fetch('/api/babies'),
        fetch('/api/community/blog'),
        fetch('/api/community/forum/threads'),
        fetch('/api/community/resources'),
      ])

      const babiesData = await babiesRes.json()
      const blogData = await blogRes.json()
      const forumData = await forumRes.json()
      const resourcesData = await resourcesRes.json()

      setStats({
        babies: babiesData.babies?.length || 0,
        blogPosts: blogData.posts?.filter((p: any) => p.author?.id === profile.id).length || 0,
        forumThreads: forumData.threads?.filter((t: any) => t.author?.id === profile.id).length || 0,
        resources: resourcesData.resources?.filter((r: any) => r.uploader?.id === profile.id).length || 0,
      })
    } catch (error) {
      console.error('Failed to load stats')
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    try {
      const formData = new FormData()
      formData.append('file', avatarFile)
      const res = await fetch('/api/uploads/profile-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, avatar_url: data.url }))
        toast.success('Avatar uploaded successfully')
        return data.url
      } else {
        toast.error(data.error || 'Failed to upload avatar')
        return null
      }
    } catch (error) {
      toast.error('Failed to upload avatar')
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Upload avatar first if a new file was selected
      let finalAvatarUrl = formData.avatar_url
      if (avatarFile) {
        const uploadedUrl = await handleAvatarUpload()
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl
        } else {
          setSaving(false)
          return
        }
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone_number: formData.phone_number || null,
          avatar_url: finalAvatarUrl || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Profile updated successfully!')
        setProfile(data.profile)
        setAvatarFile(null)
        // Refresh the page to show updated data
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700"
        >
          <FaArrowLeft />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-8">
        Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaImage className="inline mr-1" />
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name)}&background=ec4899&color=ffffff&size=128`}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-2 border-pink-200"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB</p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaUser className="inline mr-1" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaPhone className="inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Role (Read-only) */}
              {profile?.role && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <FaSave />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      full_name: profile?.full_name || '',
                      phone_number: profile?.phone_number || '',
                      avatar_url: profile?.avatar_url || '',
                    })
                    setAvatarFile(null)
                    setAvatarPreview(profile?.avatar_url || '')
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Account Created</span>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">User ID</span>
                <span className="text-sm font-mono text-gray-500 text-xs">
                  {profile?.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Activity</h2>
            <div className="space-y-4">
              <Link
                href="/dashboard/babies"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <FaBaby className="text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Babies</p>
                  <p className="text-xs text-gray-500">{stats.babies} registered</p>
                </div>
              </Link>

              <Link
                href="/dashboard/community?tab=blog"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FaBook className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Blog Posts</p>
                  <p className="text-xs text-gray-500">{stats.blogPosts} published</p>
                </div>
              </Link>

              <Link
                href="/dashboard/community?tab=forums"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <FaComments className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Forum Threads</p>
                  <p className="text-xs text-gray-500">{stats.forumThreads} started</p>
                </div>
              </Link>

              <Link
                href="/dashboard/community?tab=resources"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FaFile className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Resources</p>
                  <p className="text-xs text-gray-500">{stats.resources} shared</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl shadow-lg p-6 border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/community"
                className="block text-sm text-pink-700 hover:text-pink-800 hover:underline"
              >
                → Community Hub
              </Link>
              <Link
                href="/dashboard/babies"
                className="block text-sm text-pink-700 hover:text-pink-800 hover:underline"
              >
                → My Babies
              </Link>
              <Link
                href="/dashboard/community/guidelines"
                className="block text-sm text-pink-700 hover:text-pink-800 hover:underline"
              >
                → Community Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

