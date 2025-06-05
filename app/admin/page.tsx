"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth, signOut } from '../../lib/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
        // Success - the useAuth hook will handle the state update
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

function AdminDashboard({ user }: { user: any }) {
  const router = useRouter()
  
  const handleLogout = async () => {
    await signOut()
    router.push('/')
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

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/seo-rocket-light.svg"
              alt="SEO Rocket"
              className="w-[120px] h-[36px] object-contain"
            />
            <div className="h-8 w-px bg-gray-700"></div>
            <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Welcome, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">
              Welcome to Admin Dashboard
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Manage your products, posts, and content from this central hub. 
              Use the sidebar navigation to access different sections.
            </p>
          </div>

          {/* Quick Stats/Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="text-lg font-semibold text-white mb-2">Products</h3>
              <p className="text-gray-400 text-sm mb-4">
                Manage your software products, tools, and extensions. Add custom icons, organize with tags, and control visibility.
              </p>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">• Products Manager</div>
                <div className="text-xs text-gray-500">• Product Tags</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="text-lg font-semibold text-white mb-2">Posts</h3>
              <p className="text-gray-400 text-sm mb-4">
                Create and manage blog posts with rich text editor. Use Notion-style slash commands for formatting.
              </p>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">• All Posts</div>
                <div className="text-xs text-gray-500">• Post Categories</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="text-lg font-semibold text-white mb-2">Support</h3>
              <p className="text-gray-400 text-sm mb-4">
                Manage support requests, documentation, and help resources for your users.
              </p>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">• Coming Soon</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 bg-blue-600/20 border border-blue-600/30 rounded-lg text-left hover:bg-blue-600/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">➕</span>
                  <div>
                    <h3 className="text-white font-medium">Add New Product</h3>
                    <p className="text-gray-400 text-sm">Create a new software product listing</p>
                  </div>
                </div>
              </button>
              
              <button className="p-4 bg-purple-600/20 border border-purple-600/30 rounded-lg text-left hover:bg-purple-600/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✍️</span>
                  <div>
                    <h3 className="text-white font-medium">Write New Post</h3>
                    <p className="text-gray-400 text-sm">Create a new blog post or article</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Development Status */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-medium">Development in Progress</span>
            </div>
            <p className="text-gray-300 text-sm text-center">
              The admin interface is being built progressively. New features will be added as development continues.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return user ? <AdminDashboard user={user} /> : <LoginForm />
} 