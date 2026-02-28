import React, { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { SearchInput } from '@/components/admin/common/SearchInput'

const meta: Meta = {
  title: 'Components/SearchInput',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#1b1b1b' }],
    },
  },
}

export default meta
type Story = StoryObj

const SearchDemo = ({ placeholder, width = 320 }: { placeholder?: string; width?: number }) => {
  const [value, setValue] = useState('')
  const [results, setResults] = useState<string[]>([])

  const allItems = [
    'Introduction to React Hooks',
    'Advanced useEffect Patterns',
    'Node.js Event Loop Deep Dive',
    'Building REST APIs',
    'Vector Embeddings Explained',
    'TypeScript Generics',
    'RAG Pipeline from Scratch',
  ]

  const handleChange = (v: string) => {
    setValue(v)
    if (v.trim()) {
      setResults(allItems.filter((item) => item.toLowerCase().includes(v.toLowerCase())))
    } else {
      setResults([])
    }
  }

  return (
    <div style={{ width, position: 'relative' }}>
      <SearchInput
        value={value}
        onChange={handleChange}
        placeholder={placeholder || 'Search videos...'}
      />
      {results.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#161616',
            border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 10,
          }}
        >
          {results.map((item) => (
            <div
              key={item}
              style={{
                padding: '9px 14px',
                fontSize: 13,
                color: '#e5e5e5',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(34,197,94,0.05)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <div style={{ padding: 40, background: '#1b1b1b', minHeight: '100vh', fontFamily: 'Rubik, system-ui, sans-serif' }}>
      <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, fontFamily: 'monospace' }}>
        Search Input
      </p>
      <SearchDemo />
    </div>
  ),
}

export const WithResults: Story = {
  name: 'With Search Results',
  render: () => (
    <div style={{ padding: 40, background: '#1b1b1b', minHeight: '100vh', fontFamily: 'Rubik, system-ui, sans-serif' }}>
      <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, fontFamily: 'monospace' }}>
        Type to search &mdash; try &quot;react&quot; or &quot;node&quot;
      </p>
      <SearchDemo />
    </div>
  ),
}

const mockVideos = [
  { id: 1, title: 'Introduction to React Hooks', course: 'React Fundamentals', duration: '12:34', published: true },
  { id: 2, title: 'Advanced useEffect Patterns', course: 'React Fundamentals', duration: '18:20', published: true },
  { id: 3, title: 'Node.js Event Loop Deep Dive', course: 'Node.js Advanced', duration: '24:15', published: false },
  { id: 4, title: 'Building REST APIs', course: 'Node.js Advanced', duration: '31:00', published: true },
  { id: 5, title: 'Vector Embeddings Explained', course: 'AI Integration', duration: '20:45', published: true },
]

const AdminToolbarDemo = () => {
  const [search, setSearch] = useState('')
  const filtered = search
    ? mockVideos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()) || v.course.toLowerCase().includes(search.toLowerCase()))
    : mockVideos

  return (
    <div
      style={{
        background: '#1b1b1b',
        minHeight: '100vh',
        padding: 32,
        fontFamily: 'Rubik, system-ui, sans-serif',
        color: '#e5e5e5',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Videos</h2>
        <SearchInput value={search} onChange={setSearch} placeholder="Search videos..." className="w-64" />
      </div>
      <div style={{ background: '#161616', borderRadius: 12, border: '1px solid rgba(34,197,94,0.1)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#555', fontSize: 13 }}>
            No videos match your search
          </div>
        ) : (
          filtered.map((video, i) => (
            <div
              key={video.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(34,197,94,0.06)' : 'none',
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 3px' }}>{video.title}</p>
                <p style={{ fontSize: 11, color: '#555', margin: 0, fontFamily: 'monospace' }}>{video.course} · {video.duration}</p>
              </div>
              <span style={{ fontSize: 11, color: video.published ? '#4ade80' : '#555', fontWeight: video.published ? 600 : 400 }}>
                {video.published ? 'Published' : 'Draft'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export const AdminToolbar: Story = {
  name: 'Admin Toolbar Context',
  render: () => <AdminToolbarDemo />,
}

export const Placeholders: Story = {
  name: 'Different Placeholders',
  render: () => (
    <div
      style={{
        padding: 40,
        background: '#1b1b1b',
        minHeight: '100vh',
        fontFamily: 'Rubik, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 4 }}>
        Various contexts
      </p>
      <SearchDemo placeholder="Search videos..." />
      <SearchDemo placeholder="Search courses..." />
      <SearchDemo placeholder="Search students..." />
      <SearchDemo placeholder="Filter by name..." width={400} />
    </div>
  ),
}
