export default function AllPostsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">All Posts</h1>
          <p className="text-gray-400 mt-1">
            Manage your blog posts and articles with rich text editing
          </p>
        </div>
        
        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all">
          ✍️ Write New Post
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400">📝</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Total Posts</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400">📄</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Published</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <span className="text-yellow-400">⭐</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Featured</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <span className="text-orange-400">📋</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Drafts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-white mb-2">Posts Manager</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Create and manage blog posts with a Notion-style rich text editor. 
            Use slash commands for headings, images, videos, links, and more.
          </p>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-medium text-sm">Coming Soon</span>
            </div>
            <p className="text-gray-300 text-sm">
              Rich text editor with slash commands, featured icons, 
              author linking, and software tagging.
            </p>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Rich Text Editor</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Notion-style slash commands
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Headings (H2-H5) with /
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Image and video embeds
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Button and link components
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Real-time auto-save
            </li>
          </ul>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Post Management</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Featured icon selection
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Author linking (Supabase Auth)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Software product tagging
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Publish/Draft status
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              SEO meta fields
            </li>
          </ul>
        </div>
      </div>

      {/* Slash Commands Preview */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Slash Commands Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 font-mono text-sm">/h2</span>
              <span className="text-gray-400 text-sm">→</span>
              <span className="text-white text-sm">Heading 2</span>
            </div>
            <p className="text-gray-400 text-xs">Large section heading</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-400 font-mono text-sm">/h3</span>
              <span className="text-gray-400 text-sm">→</span>
              <span className="text-white text-sm">Heading 3</span>
            </div>
            <p className="text-gray-400 text-xs">Medium section heading</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 font-mono text-sm">/image</span>
              <span className="text-gray-400 text-sm">→</span>
              <span className="text-white text-sm">Image</span>
            </div>
            <p className="text-gray-400 text-xs">Embed image with caption</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400 font-mono text-sm">/video</span>
              <span className="text-gray-400 text-sm">→</span>
              <span className="text-white text-sm">Video</span>
            </div>
            <p className="text-gray-400 text-xs">Embed YouTube/video</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 font-mono text-sm">/button</span>
              <span className="text-gray-400 text-sm">→</span>
              <span className="text-white text-sm">Button</span>
            </div>
            <p className="text-gray-400 text-xs">Call-to-action button</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyan-400 font-mono text-sm">/link</span>
              <span className="text-gray-400 text-sm">→</span>
              <span className="text-white text-sm">Link</span>
            </div>
            <p className="text-gray-400 text-xs">External or internal link</p>
          </div>
        </div>
      </div>
    </div>
  )
} 