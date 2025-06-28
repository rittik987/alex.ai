'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { getUserProfile, type Profile } from '@/lib/supabase/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<Profile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async (): Promise<Profile | null> => {
    console.log('🔄 AuthContext: Refreshing profile...')
    if (user) {
      const userProfile = await getUserProfile(user.id)
      console.log('📋 AuthContext: Profile refreshed:', userProfile)
      setProfile(userProfile)
      return userProfile
    }
    return null
  }

  useEffect(() => {
    console.log('🚀 AuthContext: Initializing...')
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 AuthContext: Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ AuthContext: Auth session error:', error.message)
        }
        
        console.log('📱 AuthContext: Initial session:', session?.user?.email || 'No session')
        setSession(session)
        setUser(session?.user ?? null)

        // Get user profile if user exists
        if (session?.user) {
          console.log('👤 AuthContext: User found, fetching profile...')
          const userProfile = await getUserProfile(session.user.id)
          console.log('📋 AuthContext: User profile:', userProfile)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('💥 AuthContext: Failed to get initial session:', error)
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        console.log('✅ AuthContext: Initial session check complete')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 AuthContext: Auth state changed:', event, session?.user?.email || 'No user')
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 AuthContext: User authenticated, fetching profile...')
          const userProfile = await getUserProfile(session.user.id)
          console.log('📋 AuthContext: Profile fetched:', userProfile)
          setProfile(userProfile)
        } else {
          console.log('👤 AuthContext: No user, clearing profile')
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      console.log('🧹 AuthContext: Cleaning up subscription')
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    console.log('📝 AuthContext: Signing up user:', email)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        }
      })
      console.log('📝 AuthContext: Signup result:', { data: data.user?.email, error: error?.message })
      return { error }
    } catch (error) {
      console.error('💥 AuthContext: Signup error:', error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔑 AuthContext: Signing in user:', email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log('🔑 AuthContext: Signin result:', { data: data.user?.email, error: error?.message })
      return { error }
    } catch (error) {
      console.error('💥 AuthContext: Signin error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    console.log('🚪 AuthContext: Signing out user')
    try {
      await supabase.auth.signOut()
      console.log('✅ AuthContext: User signed out successfully')
    } catch (error) {
      console.error('💥 AuthContext: Sign out error:', error)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}