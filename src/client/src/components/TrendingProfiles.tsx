import React from 'react'

interface TrendingProfilesProps {
  profiles: any[]
}

export const TrendingProfiles: React.FC<TrendingProfilesProps> = ({ profiles }) => {
  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No trending profiles</h3>
        <p className="text-gray-500 dark:text-gray-400">Check back later for trending traders</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {profiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  )
}

const ProfileCard: React.FC<{ profile: any }> = ({ profile }) => {
  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
  }

  const getDisplayName = () => {
    return profile.pseudonym || profile.name || `User ${profile.id?.slice(0, 6)}` || 'Anonymous'
  }

  const getUsername = () => {
    return profile.name || profile.pseudonym || `user_${profile.id?.slice(0, 8)}` || 'anonymous'
  }

  return (
    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
      {/* Avatar */}
      <div className="relative mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto">
          {profile.profileImage ? (
            <img 
              src={profile.profileImage} 
              alt={getDisplayName()}
              className="w-full h-full rounded-2xl object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling!.style.display = 'flex'
              }}
            />
          ) : null}
          <div className={`w-full h-full rounded-2xl flex items-center justify-center ${profile.profileImage ? 'hidden' : 'flex'}`}>
            {getInitials(getDisplayName())}
          </div>
        </div>
        
        {/* Online indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 shadow-lg"></div>
      </div>

      {/* Name */}
      <div className="text-center">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1">
          {getDisplayName()}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono line-clamp-1">
          @{getUsername()}
        </p>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Status */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
          Active
        </div>
      </div>

      {/* Wallet info */}
      {profile.proxyWallet && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            {profile.proxyWallet.slice(0, 6)}...{profile.proxyWallet.slice(-4)}
          </p>
        </div>
      )}
    </div>
  )
}
