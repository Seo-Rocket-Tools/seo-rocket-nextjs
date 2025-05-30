"use client"

import { useState, useEffect } from 'react'
import { loadSoftwareData, SoftwareData, SoftwareItem } from '../../data/software-loader'

// Hard-coded admin password
const ADMIN_PASSWORD = "seorocket2025"

interface EditingSoftware extends SoftwareItem {
  isNew?: boolean
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [softwareData, setSoftwareData] = useState<SoftwareData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<EditingSoftware | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)

  // Check for cached authentication on component mount
  useEffect(() => {
    const cachedAuth = localStorage.getItem('seo-rocket-admin-auth')
    if (cachedAuth === 'authenticated') {
      setIsAuthenticated(true)
    }
    setIsCheckingAuth(false)
  }, [])

  // Load software data
  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        try {
          // First check localStorage for saved data (static hosting fallback)
          const savedData = localStorage.getItem('seo-rocket-software-data')
          if (savedData) {
            console.log('Loading data from localStorage')
            setSoftwareData(JSON.parse(savedData))
            setIsLoading(false)
            return
          }

          // Fallback to original data loading
          const data = await loadSoftwareData()
          setSoftwareData(data)
          setIsLoading(false)
        } catch (error) {
          console.error('Failed to load data:', error)
          setIsLoading(false)
        }
      }
      
      loadData()
    }
  }, [isAuthenticated])

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setLoginError('')
      // Cache authentication in localStorage
      localStorage.setItem('seo-rocket-admin-auth', 'authenticated')
    } else {
      setLoginError('Invalid password')
      setPassword('')
    }
  }

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    setSoftwareData(null)
    // Clear cached authentication
    localStorage.removeItem('seo-rocket-admin-auth')
  }

  // Save software data to JSON (fallback to localStorage on static hosting)
  const saveSoftwareData = async (newData: SoftwareData) => {
    try {
      const response = await fetch('/api/software', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      })

      const result = await response.json()

      if (result.success) {
        setSoftwareData(newData)
        console.log('Data saved successfully to software.json!')
      } else {
        // Fallback to localStorage for static hosting
        console.log('API save failed, using localStorage fallback')
        localStorage.setItem('seo-rocket-software-data', JSON.stringify(newData))
        setSoftwareData(newData)
        console.log('Data saved to localStorage (static hosting mode)')
      }
    } catch (error) {
      console.error('Error saving data:', error)
      // Also fallback to localStorage on error
      try {
        localStorage.setItem('seo-rocket-software-data', JSON.stringify(newData))
        setSoftwareData(newData)
        console.log('Data saved to localStorage (fallback due to error)')
      } catch (localError) {
        console.error('Failed to save to localStorage:', localError)
      }
    }
  }

  // Add or update software
  const handleSaveSoftware = (updatedSoftware: EditingSoftware) => {
    if (!softwareData) return

    const newData = { ...softwareData }
    
    if (updatedSoftware.isNew) {
      // Add new software
      delete updatedSoftware.isNew
      newData.software.push(updatedSoftware as SoftwareItem)
      newData.metadata.totalSoftware = newData.software.length
    } else {
      // Update existing software
      const index = newData.software.findIndex(item => item.id === updatedSoftware.id)
      if (index !== -1) {
        newData.software[index] = updatedSoftware as SoftwareItem
      }
    }
    
    newData.metadata.lastUpdated = new Date().toISOString().split('T')[0]
    saveSoftwareData(newData)
    setIsModalOpen(false)
    setEditingItem(null)
  }

  // Delete software
  const handleDelete = (id: string) => {
    if (!softwareData) return
    
    const newData = { ...softwareData }
    newData.software = newData.software.filter(item => item.id !== id)
    newData.metadata.totalSoftware = newData.software.length
    newData.metadata.lastUpdated = new Date().toISOString().split('T')[0]
    
    saveSoftwareData(newData)
    setDeleteConfirm(null)
  }

  // Toggle software status
  const handleToggleStatus = (id: string) => {
    if (!softwareData) return
    
    const newData = { ...softwareData }
    const software = newData.software.find(item => item.id === id)
    if (software) {
      software.status = software.status === 'active' ? 'deprecated' : 'active'
      newData.metadata.lastUpdated = new Date().toISOString().split('T')[0]
      saveSoftwareData(newData)
    }
  }

  // Toggle featured status
  const handleToggleFeatured = (id: string) => {
    if (!softwareData) return
    
    const newData = { ...softwareData }
    const software = newData.software.find(item => item.id === id)
    if (software) {
      software.featured = !software.featured
      newData.metadata.lastUpdated = new Date().toISOString().split('T')[0]
      saveSoftwareData(newData)
    }
  }

  // Filter software based on search and status
  const filteredSoftware = softwareData?.software.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && item.status === 'active') ||
                         (filterStatus === 'inactive' && item.status !== 'active') ||
                         (filterStatus === 'featured' && item.featured)
    
    return matchesSearch && matchesStatus
  }) || []

  // Tag Management Functions
  const addTag = (tagName: string) => {
    if (!softwareData) return
    
    const trimmedTag = tagName.trim()
    if (!trimmedTag || softwareData.tags.includes(trimmedTag)) return
    
    const newData = { ...softwareData }
    newData.tags.push(trimmedTag)
    newData.metadata.lastUpdated = new Date().toISOString().split('T')[0]
    
    saveSoftwareData(newData)
    setNewTagInput('')
  }

  const deleteTag = (tagName: string) => {
    if (!softwareData) return
    
    const newData = { ...softwareData }
    
    // Remove tag from global tags array
    newData.tags = newData.tags.filter(tag => tag !== tagName)
    
    // Remove tag from all software items
    newData.software.forEach(software => {
      software.tags = software.tags.filter(tag => tag !== tagName)
    })
    
    newData.metadata.lastUpdated = new Date().toISOString().split('T')[0]
    
    saveSoftwareData(newData)
    setTagToDelete(null)
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (newTagInput.trim()) {
        addTag(newTagInput)
      }
    }
  }

  // Get non-system tags for management
  const getManageableTags = () => {
    const systemTags = ['Featured', 'Free', 'All']
    return softwareData?.tags.filter(tag => !systemTags.includes(tag)) || []
  }

  // Show authentication check loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">SEO Rocket Dashboard</h1>
            <p className="text-gray-400">Admin Access Required</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {loginError && (
              <div className="text-red-400 text-sm text-center">{loginError}</div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">SEO Rocket Dashboard</h1>
              <span className="bg-green-600 text-green-100 px-2 py-1 rounded-full text-xs font-medium">
                {softwareData?.metadata.totalSoftware} Software Items
              </span>
              {localStorage.getItem('seo-rocket-software-data') && (
                <span className="bg-orange-600 text-orange-100 px-2 py-1 rounded-full text-xs font-medium">
                  Static Hosting Mode
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setEditingItem({
                    id: '',
                    name: '',
                    icon: '',
                    description: '',
                    tags: [],
                    status: 'active',
                    releaseDate: new Date().toISOString().split('T')[0],
                    featured: false,
                    url: '#',
                    pricing: 'premium',
                    isNew: true
                  })
                  setIsModalOpen(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Software</span>
              </button>
              <button
                onClick={() => setShowTagManager(!showTagManager)}
                className={`px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2 ${
                  showTagManager 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Tag Manager</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, description, or tags..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Items</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="featured">Featured</option>
              </select>
            </div>
          </div>
        </div>

        {/* Software List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Software</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pricing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredSoftware.map((software) => (
                  <tr key={software.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{software.icon}</div>
                        <div>
                          <div className="text-sm font-medium text-white flex items-center">
                            {software.name}
                            {software.featured && (
                              <span className="ml-2 bg-yellow-600 text-yellow-100 px-2 py-1 rounded-full text-xs">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 max-w-md truncate">
                            {software.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        software.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {software.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        software.pricing === 'free' 
                          ? 'bg-blue-100 text-blue-800' 
                          : software.pricing === 'freemium'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {software.pricing}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {software.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="bg-gray-600 text-gray-200 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {software.tags.length > 3 && (
                          <span className="text-gray-400 text-xs">+{software.tags.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingItem(software)
                            setIsModalOpen(true)
                          }}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(software.id)}
                          className={`${software.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                          title={software.status === 'active' ? 'Unpublish' : 'Publish'}
                        >
                          {software.status === 'active' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(software.id)}
                          className={`${software.featured ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-gray-300'}`}
                          title={software.featured ? 'Remove from Featured' : 'Add to Featured'}
                        >
                          <svg className="w-4 h-4" fill={software.featured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(software.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSoftware.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No software found matching your criteria.
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && editingItem && (
        <EditSoftwareModal
          software={editingItem}
          availableTags={getManageableTags()}
          onSave={handleSaveSoftware}
          onClose={() => {
            setIsModalOpen(false)
            setEditingItem(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          softwareName={softwareData?.software.find(s => s.id === deleteConfirm)?.name || ''}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Tag Manager Side Panel */}
      {showTagManager && (
        <div className="fixed inset-y-0 right-0 w-80 bg-gray-800 border-l border-gray-700 z-40 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Tag Manager</h2>
              <button
                onClick={() => setShowTagManager(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Add New Tag */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Add New Tag</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter tag name"
                />
                <button
                  onClick={() => addTag(newTagInput)}
                  disabled={!newTagInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Press Enter or click Add</p>
            </div>

            {/* Existing Tags List */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Existing Tags</label>
              <div className="space-y-2">
                {getManageableTags().map((tag) => (
                  <div key={tag} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                    <span className="text-white font-medium">{tag}</span>
                    <button
                      onClick={() => setTagToDelete(tag)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete tag"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {getManageableTags().length === 0 && (
                  <p className="text-gray-400 text-sm italic">No custom tags created yet</p>
                )}
              </div>
            </div>

            {/* System Tags Info */}
            <div className="mt-6 p-3 bg-gray-900 rounded-md">
              <h3 className="text-sm font-medium text-gray-300 mb-2">System Tags</h3>
              <p className="text-xs text-gray-400 mb-2">These tags are built-in and cannot be deleted:</p>
              <div className="flex flex-wrap gap-1">
                {['Featured', 'Free', 'All'].map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tag Delete Confirmation Modal */}
      {tagToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Delete Tag</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete the tag <strong>"{tagToDelete}"</strong>? 
                This will remove it from all software items and cannot be undone.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setTagToDelete(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTag(tagToDelete)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Software Modal Component
function EditSoftwareModal({ 
  software, 
  availableTags, 
  onSave, 
  onClose 
}: { 
  software: EditingSoftware
  availableTags: string[]
  onSave: (software: EditingSoftware) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState<EditingSoftware>(software)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Generate ID for new software
    if (formData.isNew) {
      formData.id = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }
    
    onSave(formData)
  }

  const toggleTag = (tag: string) => {
    const updatedTags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag]
    
    setFormData({ ...formData, tags: updatedTags })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {formData.isNew ? 'Add New Software' : 'Edit Software'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="🚀"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              
              {/* Selected Tags Display */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-blue-100 rounded-full text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="ml-1 hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Available Tags Selection */}
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-600 rounded-md p-3 bg-gray-700">
                {availableTags.length === 0 ? (
                  <p className="col-span-2 text-gray-400 text-sm italic">No tags available. Create tags in Tag Manager first.</p>
                ) : (
                  availableTags.map((tag) => (
                    <label key={tag} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">{tag}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Select tags from available options. Create new tags in Tag Manager.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'beta' | 'coming-soon' | 'deprecated'})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="beta">Beta</option>
                  <option value="coming-soon">Coming Soon</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pricing</label>
                <select
                  value={formData.pricing}
                  onChange={(e) => setFormData({...formData, pricing: e.target.value as 'free' | 'premium' | 'freemium'})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="freemium">Freemium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Release Date</label>
                <input
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com or #"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-300">Featured</label>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
              >
                {formData.isNew ? 'Add Software' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Delete Confirmation Modal
function DeleteConfirmModal({ 
  softwareName, 
  onConfirm, 
  onCancel 
}: { 
  softwareName: string
  onConfirm: () => void
  onCancel: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">Delete Software</h3>
          <p className="text-gray-400 mb-6">
            Are you sure you want to delete <strong>{softwareName}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 