export default function SupportPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support</h1>
          <p className="text-gray-400 mt-1">
            Manage support requests and help resources
          </p>
        </div>
        
        <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all">
          💬 New Ticket
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <span className="text-emerald-400">🎫</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Total Tickets</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <span className="text-yellow-400">⏳</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Pending</p>
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
              <p className="text-gray-400 text-sm">Resolved</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400">📚</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Knowledge Base</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-white mb-2">Support Center</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            This section will handle customer support, documentation, and help resources. 
            Features are still being planned and designed.
          </p>
          
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-orange-400 font-medium text-sm">Planning Phase</span>
            </div>
            <p className="text-gray-300 text-sm">
              Support features are currently being planned. 
              Ideas and requirements are being gathered.
            </p>
          </div>
        </div>
      </div>

      {/* Potential Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Potential Features</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-orange-400">?</span>
              Support ticket system
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-400">?</span>
              Knowledge base articles
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-400">?</span>
              FAQ management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-400">?</span>
              Live chat integration
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-400">?</span>
              User feedback collection
            </li>
          </ul>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Ideas Under Consideration</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-blue-400">💡</span>
              Documentation builder
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">💡</span>
              Video tutorial management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">💡</span>
              Community forum
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">💡</span>
              Support analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">💡</span>
              Automated responses
            </li>
          </ul>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Share Your Ideas</h3>
        <p className="text-gray-400 mb-4">
          What support features would be most valuable for your workflow? 
          Your input will help shape the development of this section.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🎫</div>
            <h4 className="text-white font-medium mb-1">Ticket System</h4>
            <p className="text-gray-400 text-sm">Traditional support tickets</p>
          </div>
          
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="text-white font-medium mb-1">Knowledge Base</h4>
            <p className="text-gray-400 text-sm">Self-service documentation</p>
          </div>
          
          <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">💬</div>
            <h4 className="text-white font-medium mb-1">Live Chat</h4>
            <p className="text-gray-400 text-sm">Real-time support chat</p>
          </div>
        </div>
      </div>
    </div>
  )
} 