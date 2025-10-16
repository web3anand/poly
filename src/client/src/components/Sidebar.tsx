import React from 'react'

export const Sidebar: React.FC = () => {
  const menuItems = [
    { name: 'Dashboard', icon: '📊', active: true },
    { name: 'Markets', icon: '📈', active: false },
    { name: 'Traders', icon: '👥', active: false },
    { name: 'Analytics', icon: '📊', active: false },
    { name: 'Alerts', icon: '🔔', active: false },
    { name: 'Portfolio', icon: '💼', active: false },
  ]

  const categories = [
    { name: 'Politics', count: 24, color: 'from-red-500 to-pink-500' },
    { name: 'Crypto', count: 18, color: 'from-yellow-500 to-orange-500' },
    { name: 'Sports', count: 32, color: 'from-green-500 to-emerald-500' },
    { name: 'Economics', count: 15, color: 'from-blue-500 to-cyan-500' },
    { name: 'Entertainment', count: 8, color: 'from-purple-500 to-violet-500' },
    { name: 'Technology', count: 12, color: 'from-indigo-500 to-blue-500' },
  ]

  return (
    <aside className="w-80 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50">
      <div className="p-6">
        {/* Navigation Menu */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
            Navigation
          </h3>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.name}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
            Categories
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.name}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${category.color}`}></div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200">
                  {category.count}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-4 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Markets</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">1,247</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-xl border border-green-200/50 dark:border-green-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Volume</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">$2.4M</p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">💰</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 p-4 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Traders</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">8,432</p>
                </div>
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👥</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Powered by Polymarket API
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Real-time data updates
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
