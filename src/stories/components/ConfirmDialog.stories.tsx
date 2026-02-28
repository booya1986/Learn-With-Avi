import React, { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { ConfirmDialog } from '@/components/admin/common/ConfirmDialog'
import { Button } from '@/components/ui/button'

const meta: Meta = {
  title: 'Components/ConfirmDialog',
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

const ConfirmDialogDemo = ({
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant,
}: {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}) => {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 40,
        minHeight: '60vh',
        background: '#1b1b1b',
        fontFamily: 'Rubik, system-ui, sans-serif',
      }}
    >
      <Button
        variant={variant === 'destructive' ? 'destructive' : 'orbyto-primary'}
        size="orbyto"
        onClick={() => { setOpen(true); setResult(null) }}
      >
        {variant === 'destructive' ? 'Delete Video' : 'Confirm Action'}
      </Button>

      {result ? (
        <p
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: result === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
            border: result === 'confirmed' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.1)',
            color: result === 'confirmed' ? '#4ade80' : '#888',
            fontSize: 13,
          }}
        >
          Action {result}
        </p>
      ) : null}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600))
          setResult('confirmed')
        }}
      />
    </div>
  )
}

export const Default: Story = {
  name: 'Default Confirm',
  render: () => (
    <ConfirmDialogDemo
      title="Publish Course?"
      description="This will make the course visible to all students. You can unpublish it at any time."
      confirmLabel="Publish"
      cancelLabel="Cancel"
    />
  ),
}

export const Destructive: Story = {
  name: 'Destructive — Delete',
  render: () => (
    <ConfirmDialogDemo
      title="Delete Video?"
      description="This action cannot be undone. The video and all associated data (transcripts, chat history) will be permanently deleted."
      confirmLabel="Delete"
      cancelLabel="Keep Video"
      variant="destructive"
    />
  ),
}

const PreviewOpenDemo = () => {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ background: '#1b1b1b', minHeight: '100vh', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Course?"
        description="This will permanently delete the course and all 12 videos inside it. Students will lose access immediately."
        confirmLabel="Delete Course"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => { await new Promise((r) => setTimeout(r, 800)) }}
      />
    </div>
  )
}

export const PreviewOpen: Story = {
  name: 'Preview — Open State',
  render: () => <PreviewOpenDemo />,
}
