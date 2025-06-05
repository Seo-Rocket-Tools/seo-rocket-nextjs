export default function ProductsManagerPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Products Manager</h1>
          <p className="text-gray-400 mt-1">
            Manage all your software products, tools, and extensions
          </p>
        </div>
        
        <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
          + Add Product
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400">📦</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Total Products</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400">✅</span>
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
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400">🆓</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-white mb-2">Products Manager</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            This is where you'll manage all your products. You'll be able to add, edit, remove, publish/unpublish, 
            set as featured or free, and upload custom 200x200 PNG icons.
          </p>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-medium text-sm">Coming Soon</span>
            </div>
            <p className="text-gray-300 text-sm">
              Full product management interface with drag-and-drop ordering, 
              bulk actions, and advanced filtering options.
            </p>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Planned Features</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Add/Edit/Delete products
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Upload custom 200x200 PNG icons
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Publish/Unpublish toggle
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Featured/Free status controls
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Tag assignment and management
            </li>
          </ul>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Advanced Features</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Drag-and-drop ordering
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Bulk operations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Search and filtering
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Analytics and insights
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Import/Export functionality
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 