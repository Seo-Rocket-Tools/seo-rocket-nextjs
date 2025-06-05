export default function ProductTagsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Product Tags</h1>
          <p className="text-gray-400 mt-1">
            Manage product tags and organize products within each tag
          </p>
        </div>
        
        <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all">
          + Add Tag
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400">🏷️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Total Tags</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400">📦</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Tagged Products</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Avg Products/Tag</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Product Tags Manager</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Manage product tags and organize the order of products within each tag. 
            Click on any tag to open a modal with drag-and-drop product ordering.
          </p>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-medium text-sm">Coming Soon</span>
            </div>
            <p className="text-gray-300 text-sm">
              Tag management interface with product ordering modals, 
              bulk tag operations, and visual tag organization.
            </p>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Tag Management</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Add/Edit/Delete tags
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              View products in each tag
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Tag usage analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Bulk tag operations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              Tag color coding
            </li>
          </ul>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Product Ordering</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Click tag to open ordering modal
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Drag-and-drop product ordering
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Visual product thumbnails
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Real-time order updates
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Order affects public display
            </li>
          </ul>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How Product Tag Ordering Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-400 text-xl">1</span>
            </div>
            <h4 className="text-white font-medium mb-2">Select Tag</h4>
            <p className="text-gray-400 text-sm">Click on any tag to view and manage the products within that tag</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-400 text-xl">2</span>
            </div>
            <h4 className="text-white font-medium mb-2">Drag & Drop</h4>
            <p className="text-gray-400 text-sm">Reorder products by dragging them up or down in the list</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-400 text-xl">3</span>
            </div>
            <h4 className="text-white font-medium mb-2">Auto-Save</h4>
            <p className="text-gray-400 text-sm">Changes are saved automatically and reflected on the public site</p>
          </div>
        </div>
      </div>
    </div>
  )
} 