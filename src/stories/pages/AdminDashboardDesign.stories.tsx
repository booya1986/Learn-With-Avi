/* eslint-disable max-lines */
import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'
import { Home, Play, BookOpen, Users, LogOut, Plus, CheckCircle } from 'lucide-react'

const meta: Meta = {
  title: 'Design System/Pages/Admin — Dashboard',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

const G = '#22c55e'
const G_SOFT = '#4ade80'
const G_GLOW_SM = '0 0 10px rgba(34,197,94,0.45)'

const mockStats = [
  { title: 'Total Courses', value: '8', icon: BookOpen },
  { title: 'Total Videos', value: '47', icon: Play },
  { title: 'Published', value: '6c / 38v', icon: CheckCircle },
  { title: 'Students', value: '124', icon: Users },
]

const mockVideos = [
  { id: 1, title: 'Introduction to React Hooks', course: 'React Fundamentals', duration: '12:34', published: true },
  { id: 2, title: 'Advanced useEffect Patterns', course: 'React Fundamentals', duration: '18:20', published: true },
  { id: 3, title: 'Node.js Event Loop Deep Dive', course: 'Node.js Advanced', duration: '24:15', published: false },
  { id: 4, title: 'Building REST APIs with Express', course: 'Node.js Advanced', duration: '31:00', published: true },
  { id: 5, title: 'Vector Embeddings Explained', course: 'AI Integration', duration: '20:45', published: true },
]

const navItems = [
  { name: 'Dashboard', icon: Home, active: true },
  { name: 'Videos', icon: Play, active: false },
  { name: 'Courses', icon: BookOpen, active: false },
  { name: 'Students', icon: Users, active: false },
]

const AdminDashboardMockup = () => {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#1b1b1b',
        fontFamily: 'Rubik, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#e5e5e5',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: '#141414',
          borderRight: `1px solid rgba(34,197,94,0.1)`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            borderBottom: `1px solid rgba(34,197,94,0.1)`,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 12px',
              background: 'rgba(34,197,94,0.07)',
              border: `1px solid rgba(34,197,94,0.25)`,
              borderRadius: 7,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: G,
                display: 'inline-block',
                boxShadow: G_GLOW_SM,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: G_SOFT }}>LearnWithAvi</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: item.active ? `1px solid rgba(34,197,94,0.25)` : '1px solid transparent',
                  background: item.active ? 'rgba(34,197,94,0.08)' : 'transparent',
                  color: item.active ? G_SOFT : '#555',
                  fontSize: 13,
                  fontWeight: item.active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {item.name}
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div
          style={{
            padding: '14px 12px',
            borderTop: `1px solid rgba(34,197,94,0.08)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              color: '#444',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <LogOut style={{ width: 15, height: 15 }} />
            Logout
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e5e5e5', margin: 0 }}>Dashboard</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                background: G,
                color: '#0a2812',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              Add Video
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                background: 'transparent',
                color: G_SOFT,
                border: `1px solid rgba(34,197,94,0.35)`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              Create Course
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {mockStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.title}
                style={{
                  background: '#161616',
                  border: `1px solid rgba(34,197,94,0.1)`,
                  borderRadius: 12,
                  padding: '22px 24px',
                  cursor: 'pointer',
                  transition: 'all 250ms',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(34,197,94,0.3)'
                  el.style.boxShadow = G_GLOW_SM
                  el.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(34,197,94,0.1)'
                  el.style.boxShadow = 'none'
                  el.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      {stat.title}
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#e5e5e5', lineHeight: 1 }}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(34,197,94,0.08)',
                      border: `1px solid rgba(34,197,94,0.2)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: G_SOFT,
                    }}
                  >
                    <Icon style={{ width: 16, height: 16 }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Videos */}
        <div
          style={{
            background: '#161616',
            border: `1px solid rgba(34,197,94,0.1)`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: `1px solid rgba(34,197,94,0.08)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e5e5e5', margin: 0 }}>Recent Videos</h2>
            <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>
              {mockVideos.length} videos
            </span>
          </div>

          {mockVideos.map((video, i) => (
            <div
              key={video.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 24px',
                borderBottom: i < mockVideos.length - 1 ? `1px solid rgba(34,197,94,0.06)` : 'none',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(34,197,94,0.03)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              {/* Thumbnail placeholder */}
              <div
                style={{
                  width: 80,
                  height: 46,
                  borderRadius: 6,
                  background: 'rgba(34,197,94,0.06)',
                  border: `1px solid rgba(34,197,94,0.1)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: G_SOFT,
                  flexShrink: 0,
                  fontSize: 16,
                }}
              >
                ▶
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#e5e5e5', margin: '0 0 4px' }}>
                  {video.title}
                </p>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#555' }}>
                  <span>{video.course}</span>
                  <span>·</span>
                  <span style={{ fontFamily: 'monospace' }}>{video.duration}</span>
                  <span>·</span>
                  <span style={{ color: video.published ? G_SOFT : '#555', fontWeight: video.published ? 600 : 400 }}>
                    {video.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const AdminDashboard: Story = {
  name: 'Admin Dashboard',
  render: () => <AdminDashboardMockup />,
}
