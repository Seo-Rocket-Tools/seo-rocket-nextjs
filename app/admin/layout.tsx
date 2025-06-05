"use client"

import { useAuth, signOut } from '../../lib/useAuth'
import { supabase } from '../../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminSidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (collapsed: boolean) => void }) {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Products',
      icon: '📦',
      href: '/admin/products',
      children: [
        { name: 'Products Manager', href: '/admin/products', isDefault: true },
        { name: 'Product Tags', href: '/admin/products/tags' }
      ]
    },
    {
      name: 'Posts',
      icon: '📝',
      href: '/admin/posts',
      children: [
        { name: 'All Posts', href: '/admin/posts', isDefault: true },
        { name: 'Post Categories', href: '/admin/posts/categories' }
      ]
    },
    {
      name: 'Support',
      icon: '💬',
      href: '/admin/support',
      children: []
    }
  ]

  const isActive = (href: string) => {
    if (href === '/admin/products' && pathname === '/admin/products') return true
    if (href === '/admin/posts' && pathname === '/admin/posts') return true
    if (href === '/admin/support' && pathname === '/admin/support') return true
    return pathname === href
  }

  const isParentActive = (parentHref: string, children: any[]) => {
    if (pathname === parentHref) return true
    return children.some(child => pathname === child.href)
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 transition-all duration-300 flex flex-col`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <div key={item.name}>
            {/* Parent Item */}
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isParentActive(item.href, item.children)
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>

            {/* Child Items */}
            {!isCollapsed && item.children.length > 0 && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                      isActive(child.href)
                        ? 'bg-blue-500/20 text-blue-400 border-l-2 border-blue-400' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {child.name}
                    {child.isDefault && (
                      <span className="ml-2 text-xs text-gray-500">(Default)</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Coming Soon Indicator */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-400 font-medium text-xs">Under Development</span>
            </div>
            <p className="text-gray-400 text-xs">
              Features are being built progressively
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminHeader({ user }: { user: any }) {
  const router = useRouter()
  
  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="/seo-rocket-light.svg"
            alt="SEO Rocket"
            className="w-[100px] h-[30px] object-contain"
          />
          <div className="h-6 w-px bg-gray-700"></div>
          <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">Welcome, {user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!supabase) {
      setError('Authentication service not available')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, rgba(139, 69, 219, 0.3) 40%, transparent 70%)',
            top: '-400px',
            right: '-400px',
          }}
        />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo/Title */}
        <div className="text-center">
          <div className="mb-4">
            <img
              src="/seo-rocket-light.svg"
              alt="SEO Rocket"
              className="mx-auto w-[160px] h-[48px] object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400 text-lg">Sign in to manage your content</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, rgba(139, 69, 219, 0.3) 40%, transparent 70%)',
            top: '-400px',
            right: '-400px',
          }}
        />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <AdminSidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader user={user} />
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 