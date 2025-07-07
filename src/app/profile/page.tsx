'use client'

import { CreditCard, Save, Settings, Shield, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  points: number
  age_verified: boolean
  age_verified_at: string | null
  content_preferences: any
  is_content_creator: boolean
  creator_verified: boolean
  privacy_settings: any
  created_at: string
}

interface PrivacySettings {
  discrete_billing: boolean
  anonymous_reviews: boolean
  hide_purchase_history: boolean
  marketing_emails: boolean
}

interface ContentPreferences {
  blocked_categories: string[]
  content_warnings_enabled: boolean
  blur_explicit_content: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'profile' | 'privacy' | 'preferences'
  >('profile')

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    discrete_billing: true,
    anonymous_reviews: false,
    hide_purchase_history: false,
    marketing_emails: false,
  })

  const [contentPreferences, setContentPreferences] =
    useState<ContentPreferences>({
      blocked_categories: [],
      content_warnings_enabled: true,
      blur_explicit_content: true,
    })

  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...')
          const newProfile = {
            id: user.id,
            email: user.email,
            points: 100, // Legacy points column
            privacy_settings: {
              show_email: false,
              show_purchase_history: false,
              allow_friend_requests: true,
              discrete_billing: true,
              anonymous_reviews: false,
            },
            content_preferences: {
              blocked_categories: [],
              content_warnings_enabled: true,
              blur_explicit_content: true,
            },
          }

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            throw createError
          }

          setProfile(createdProfile)
          toast.success('Profile created successfully!')
          return
        }
        throw error
      }

      setProfile(profileData)

      // Parse settings
      if (profileData.privacy_settings) {
        setPrivacySettings({
          ...privacySettings,
          ...profileData.privacy_settings,
        })
      }

      if (profileData.content_preferences) {
        setContentPreferences({
          ...contentPreferences,
          ...profileData.content_preferences,
        })
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAgeVerification = async () => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          age_verified: true,
          age_verified_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              age_verified: true,
              age_verified_at: new Date().toISOString(),
            }
          : null
      )

      toast.success('Age verification completed!')
    } catch (error: any) {
      toast.error('Failed to verify age: ' + error.message)
    }
  }

  const saveSettings = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          privacy_settings: privacySettings,
          content_preferences: contentPreferences,
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Settings saved successfully!')
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
          <div className='animate-pulse'>
            <div className='mb-6 h-8 rounded bg-gray-200'></div>
            <div className='rounded-lg bg-white p-8'>
              <div className='space-y-4'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className='h-4 rounded bg-gray-200'></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h2 className='mb-4 text-2xl font-bold text-gray-900'>
            Profile Not Found
          </h2>
          <p className='text-gray-600'>Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent'>
            Account Settings
          </h1>
          <p className='mt-2 text-gray-600'>
            Manage your account preferences and privacy settings
          </p>
        </div>

        {/* Age Verification Alert */}
        {!profile.age_verified && (
          <div className='mb-8 rounded-lg border border-red-200 bg-red-50 p-6'>
            <div className='flex items-start gap-4'>
              <Shield className='mt-1 h-6 w-6 text-red-600' />
              <div className='flex-1'>
                <h3 className='mb-2 font-semibold text-red-800'>
                  Age Verification Required
                </h3>
                <p className='mb-4 text-sm text-red-700'>
                  You must verify that you are 18 years or older to access adult
                  content on this platform.
                </p>
                <button
                  onClick={handleAgeVerification}
                  className='rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700'
                >
                  Verify I am 18+
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className='rounded-lg bg-white shadow-sm'>
          <div className='border-b border-gray-200'>
            <nav className='flex space-x-8 px-6'>
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'privacy', label: 'Privacy', icon: Shield },
                { id: 'preferences', label: 'Content', icon: Settings },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className='h-4 w-4' />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className='p-6'>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className='space-y-6'>
                <div>
                  <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                    Account Information
                  </h3>

                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div>
                      <label className='mb-2 block text-sm font-medium text-gray-700'>
                        Email Address
                      </label>
                      <input
                        type='email'
                        value={profile.email}
                        disabled
                        className='w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500'
                      />
                    </div>

                    <div>
                      <label className='mb-2 block text-sm font-medium text-gray-700'>
                        Points Balance
                      </label>
                      <div className='flex items-center gap-2'>
                        <CreditCard className='h-5 w-5 text-indigo-600' />
                        <span className='text-lg font-semibold text-gray-900'>
                          {profile.points} points
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='mb-3 font-medium text-gray-900'>
                    Verification Status
                  </h4>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between rounded-lg bg-gray-50 p-3'>
                      <div className='flex items-center gap-3'>
                        <Shield
                          className={`h-5 w-5 ${profile.age_verified ? 'text-green-600' : 'text-gray-400'}`}
                        />
                        <span className='font-medium text-gray-900'>
                          Age Verification
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          profile.age_verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {profile.age_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div className='flex items-center justify-between rounded-lg bg-gray-50 p-3'>
                      <div className='flex items-center gap-3'>
                        <User
                          className={`h-5 w-5 ${profile.creator_verified ? 'text-green-600' : 'text-gray-400'}`}
                        />
                        <span className='font-medium text-gray-900'>
                          Content Creator
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          profile.is_content_creator
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {profile.is_content_creator ? 'Active' : 'Not Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className='space-y-6'>
                <div>
                  <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                    Privacy Settings
                  </h3>
                  <p className='mb-6 text-sm text-gray-600'>
                    Control how your information is displayed and used on the
                    platform.
                  </p>

                  <div className='space-y-4'>
                    {[
                      {
                        key: 'discrete_billing' as keyof PrivacySettings,
                        label: 'Discrete Billing',
                        description:
                          'Use generic descriptions on billing statements',
                      },
                      {
                        key: 'anonymous_reviews' as keyof PrivacySettings,
                        label: 'Anonymous Reviews',
                        description: 'Post reviews anonymously by default',
                      },
                      {
                        key: 'hide_purchase_history' as keyof PrivacySettings,
                        label: 'Private Purchase History',
                        description:
                          'Hide your purchase history from other users',
                      },
                      {
                        key: 'marketing_emails' as keyof PrivacySettings,
                        label: 'Marketing Emails',
                        description: 'Receive promotional emails and updates',
                      },
                    ].map(({ key, label, description }) => (
                      <div
                        key={key}
                        className='flex items-center justify-between rounded-lg border border-gray-200 p-4'
                      >
                        <div>
                          <h4 className='font-medium text-gray-900'>{label}</h4>
                          <p className='text-sm text-gray-600'>{description}</p>
                        </div>
                        <label className='relative inline-flex cursor-pointer items-center'>
                          <input
                            type='checkbox'
                            checked={privacySettings[key]}
                            onChange={(e) =>
                              setPrivacySettings((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            className='peer sr-only'
                          />
                          <div className='peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[""] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300'></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className='space-y-6'>
                <div>
                  <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                    Content Preferences
                  </h3>
                  <p className='mb-6 text-sm text-gray-600'>
                    Customize how adult content is displayed and filtered.
                  </p>

                  <div className='space-y-4'>
                    {[
                      {
                        key: 'content_warnings_enabled' as keyof ContentPreferences,
                        label: 'Content Warnings',
                        description:
                          'Show content warning overlays before viewing explicit content',
                      },
                      {
                        key: 'blur_explicit_content' as keyof ContentPreferences,
                        label: 'Blur Explicit Content',
                        description:
                          'Blur explicit content thumbnails until clicked',
                      },
                    ].map(({ key, label, description }) => (
                      <div
                        key={key}
                        className='flex items-center justify-between rounded-lg border border-gray-200 p-4'
                      >
                        <div>
                          <h4 className='font-medium text-gray-900'>{label}</h4>
                          <p className='text-sm text-gray-600'>{description}</p>
                        </div>
                        <label className='relative inline-flex cursor-pointer items-center'>
                          <input
                            type='checkbox'
                            checked={contentPreferences[key] as boolean}
                            onChange={(e) =>
                              setContentPreferences((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            className='peer sr-only'
                          />
                          <div className='peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[""] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300'></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className='mt-8 border-t border-gray-200 pt-6'>
              <button
                onClick={saveSettings}
                disabled={saving}
                className='inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50'
              >
                <Save className='h-4 w-4' />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
