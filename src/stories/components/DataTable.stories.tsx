import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { DataTable, type Column } from '@/components/admin/common/DataTable'
import { Badge } from '@/components/ui/badge'

const meta: Meta = {
  title: 'Components/DataTable',
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

/* ── Mock Data ── */
type VideoRow = {
  id: number
  title: string
  course: string
  duration: string
  status: 'published' | 'draft'
  views: number
}

const videoData: VideoRow[] = [
  { id: 1, title: 'Introduction to React Hooks', course: 'React Fundamentals', duration: '12:34', status: 'published', views: 1240 },
  { id: 2, title: 'Advanced useEffect Patterns', course: 'React Fundamentals', duration: '18:20', status: 'published', views: 980 },
  { id: 3, title: 'Node.js Event Loop Deep Dive', course: 'Node.js Advanced', duration: '24:15', status: 'draft', views: 0 },
  { id: 4, title: 'Building REST APIs with Express', course: 'Node.js Advanced', duration: '31:00', status: 'published', views: 756 },
  { id: 5, title: 'Vector Embeddings Explained', course: 'AI Integration', duration: '20:45', status: 'published', views: 2103 },
  { id: 6, title: 'RAG Pipeline from Scratch', course: 'AI Integration', duration: '35:10', status: 'draft', views: 0 },
  { id: 7, title: 'TypeScript Generics in Depth', course: 'TypeScript Mastery', duration: '22:05', status: 'published', views: 1567 },
  { id: 8, title: 'Custom Hooks Patterns', course: 'React Fundamentals', duration: '15:30', status: 'published', views: 890 },
]

const videoColumns: Column<VideoRow>[] = [
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    render: (item) => (
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#e5e5e5', margin: 0 }}>{item.title}</p>
        <p style={{ fontSize: 11, color: '#555', margin: '2px 0 0', fontFamily: 'monospace' }}>{item.course}</p>
      </div>
    ),
  },
  {
    key: 'duration',
    header: 'Duration',
    sortable: true,
    width: 'w-28',
    render: (item) => (
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{item.duration}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 'w-28',
    render: (item) => (
      <Badge variant={item.status === 'published' ? 'success' : 'default'} showDot={item.status === 'published'}>
        {item.status === 'published' ? 'Published' : 'Draft'}
      </Badge>
    ),
  },
  {
    key: 'views',
    header: 'Views',
    sortable: true,
    width: 'w-24',
    render: (item) => (
      <span style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>
        {item.views > 0 ? item.views.toLocaleString() : '—'}
      </span>
    ),
  },
]

type StudentRow = {
  id: number
  name: string
  email: string
  enrolled: number
  lastActive: string
}

const studentData: StudentRow[] = [
  { id: 1, name: 'Yael Cohen', email: 'yael@example.com', enrolled: 3, lastActive: '2 hours ago' },
  { id: 2, name: 'David Levy', email: 'david@example.com', enrolled: 1, lastActive: '1 day ago' },
  { id: 3, name: 'Shira Mizrahi', email: 'shira@example.com', enrolled: 5, lastActive: '3 hours ago' },
  { id: 4, name: 'Avi Peretz', email: 'avi@example.com', enrolled: 2, lastActive: 'Just now' },
  { id: 5, name: 'Noa Ben David', email: 'noa@example.com', enrolled: 4, lastActive: '5 days ago' },
]

const studentColumns: Column<StudentRow>[] = [
  {
    key: 'name',
    header: 'Student',
    sortable: true,
    render: (item) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#4ade80',
            flexShrink: 0,
          }}
        >
          {item.name.charAt(0)}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#e5e5e5', margin: 0 }}>{item.name}</p>
          <p style={{ fontSize: 11, color: '#555', margin: '2px 0 0' }}>{item.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'enrolled',
    header: 'Courses',
    sortable: true,
    width: 'w-24',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#e5e5e5', fontFamily: 'monospace' }}>{item.enrolled}</span>
    ),
  },
  {
    key: 'lastActive',
    header: 'Last Active',
    sortable: true,
    render: (item) => (
      <span style={{ fontSize: 12, color: '#888' }}>{item.lastActive}</span>
    ),
  },
]

export const VideoTable: Story = {
  name: 'Videos Table',
  render: () => (
    <div style={{ padding: 32, background: '#1b1b1b', minHeight: '100vh', fontFamily: 'Rubik, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e5e5e5', margin: '0 0 4px' }}>Videos</h2>
        <p style={{ fontSize: 12, color: '#555', margin: 0, fontFamily: 'monospace' }}>{videoData.length} total</p>
      </div>
      <div style={{ background: '#161616', borderRadius: 12, border: '1px solid rgba(34,197,94,0.1)' }}>
        <DataTable
          columns={videoColumns}
          data={videoData}
          onRowClick={(item) => console.log('Clicked:', item.title)}
        />
      </div>
    </div>
  ),
}

export const StudentsTable: Story = {
  name: 'Students Table',
  render: () => (
    <div style={{ padding: 32, background: '#1b1b1b', minHeight: '100vh', fontFamily: 'Rubik, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e5e5e5', margin: '0 0 4px' }}>Students</h2>
        <p style={{ fontSize: 12, color: '#555', margin: 0, fontFamily: 'monospace' }}>{studentData.length} enrolled</p>
      </div>
      <div style={{ background: '#161616', borderRadius: 12, border: '1px solid rgba(34,197,94,0.1)' }}>
        <DataTable
          columns={studentColumns}
          data={studentData}
          pageSize={5}
        />
      </div>
    </div>
  ),
}

export const EmptyTable: Story = {
  name: 'Empty State',
  render: () => (
    <div style={{ padding: 32, background: '#1b1b1b', minHeight: '100vh', fontFamily: 'Rubik, system-ui, sans-serif' }}>
      <div style={{ background: '#161616', borderRadius: 12, border: '1px solid rgba(34,197,94,0.1)' }}>
        <DataTable
          columns={videoColumns}
          data={[]}
          emptyMessage="No videos found. Add your first video to get started."
        />
      </div>
    </div>
  ),
}

export const PaginatedTable: Story = {
  name: 'With Pagination',
  render: () => (
    <div style={{ padding: 32, background: '#1b1b1b', minHeight: '100vh', fontFamily: 'Rubik, system-ui, sans-serif' }}>
      <div style={{ background: '#161616', borderRadius: 12, border: '1px solid rgba(34,197,94,0.1)' }}>
        <DataTable
          columns={videoColumns}
          data={videoData}
          pageSize={3}
        />
      </div>
    </div>
  ),
}
