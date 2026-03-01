/* eslint-disable max-lines */
'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'

import { Search, X, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CourseCard } from '@/components/CourseCard'
import { type Course } from '@/types'

interface CourseCatalogProps {
  courses: Course[]
}

type SortOption = 'default' | 'newest' | 'titleAZ'
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export const CourseCatalog = ({ courses }: CourseCatalogProps) => {
  const t = useTranslations('homepage.courses')

  const [searchInput, setSearchInput] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('default')
  const [sortOpen, setSortOpen] = useState(false)

  const debouncedSearch = useDebounce(searchInput, 300)
  const sortRef = useRef<HTMLDivElement>(null)

  // Close sort dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && sortOpen) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sortOpen])

  // Derive unique topics from all courses
  const allTopics = useMemo<string[]>(() => {
    const topicSet = new Set<string>()
    for (const course of courses) {
      for (const topic of course.topics) {
        topicSet.add(topic)
      }
    }
    return Array.from(topicSet).sort()
  }, [courses])

  const difficultyOptions: DifficultyFilter[] = ['all', 'beginner', 'intermediate', 'advanced']
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: t('sort.default') },
    { value: 'newest', label: t('sort.newest') },
    { value: 'titleAZ', label: t('sort.titleAZ') },
  ]

  const filteredCourses = useMemo<Course[]>(() => {
    let result = [...courses]

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      )
    }

    // Difficulty filter
    if (difficulty !== 'all') {
      result = result.filter((c) => c.difficulty === difficulty)
    }

    // Topic filter
    if (activeTopic !== null) {
      result = result.filter((c) => c.topics.includes(activeTopic))
    }

    // Sort
    if (sort === 'titleAZ') {
      result = result.slice().sort((a, b) => a.title.localeCompare(b.title))
    }
    // 'newest' and 'default' keep insertion order (newest would require a date field)

    return result
  }, [courses, debouncedSearch, difficulty, activeTopic, sort])

  const hasActiveFilters =
    searchInput.trim() !== '' || difficulty !== 'all' || activeTopic !== null || sort !== 'default'

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setDifficulty('all')
    setActiveTopic(null)
    setSort('default')
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
  }, [])

  const currentSortLabel = sortOptions.find((o) => o.value === sort)?.label ?? t('sort.default')

  return (
    <div>
      {/* Controls row */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Search bar */}
        <div className="relative">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: '#555' }}
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder={t('search.placeholder')}
            className="w-full rounded-lg ps-10 pe-10 py-2.5 text-sm outline-none transition-all duration-150"
            style={{
              background: '#161616',
              border: '1px solid rgba(34,197,94,0.15)',
              color: '#e5e5e5',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(34,197,94,0.15)'
            }}
            aria-label={t('search.placeholder')}
          />
          {searchInput ? <button
              onClick={handleClearSearch}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-opacity duration-150 hover:opacity-70"
              style={{ color: '#555' }}
              aria-label={t('search.clear')}
            >
              <X className="w-4 h-4" />
            </button> : null}
        </div>

        {/* Filter chips + sort */}
        <div className="flex items-start gap-3">
          {/* Scrollable chips area */}
          <div
            className="flex-1 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            <div className="flex items-center gap-2 w-max">
              {/* Difficulty chips */}
              <div role="group" aria-label={t('filter.difficulty')} className="flex items-center gap-2">
                {difficultyOptions.map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150"
                    style={
                      difficulty === level
                        ? {
                            background: 'rgba(34,197,94,0.18)',
                            border: '1px solid #22c55e',
                            color: '#4ade80',
                          }
                        : {
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#888',
                          }
                    }
                    aria-pressed={difficulty === level}
                  >
                    {level === 'all' ? t('filter.all') : t(`filter.${level}` as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>

              {/* Separator */}
              {allTopics.length > 0 && (
                <span
                  className="flex-shrink-0 w-px h-4 mx-1"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  aria-hidden="true"
                />
              )}

              {/* Topic chips */}
              {allTopics.length > 0 && (
                <div role="group" aria-label="Filter by topic" className="flex items-center gap-2">
                  {allTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setActiveTopic(activeTopic === topic ? null : topic)}
                      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150"
                      style={
                        activeTopic === topic
                          ? {
                              background: 'rgba(34,197,94,0.18)',
                              border: '1px solid #22c55e',
                              color: '#4ade80',
                            }
                          : {
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#888',
                            }
                      }
                      aria-pressed={activeTopic === topic}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sort dropdown */}
          <div className="relative flex-shrink-0" ref={sortRef}>
            <button
              onClick={() => setSortOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#888',
                minWidth: 110,
              }}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              aria-label={`${t('sort.label')}: ${currentSortLabel}`}
            >
              <span className="flex-1 text-start">{currentSortLabel}</span>
              <ChevronDown
                className="w-3 h-3 transition-transform duration-150"
                style={{ transform: sortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {sortOpen ? <div
                className="absolute end-0 mt-1 z-20 rounded-lg overflow-hidden"
                style={{
                  background: '#1e1e1e',
                  border: '1px solid rgba(34,197,94,0.2)',
                  minWidth: 140,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                role="listbox"
                aria-label={t('sort.label')}
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    role="option"
                    aria-selected={sort === option.value}
                    onClick={() => {
                      setSort(option.value)
                      setSortOpen(false)
                    }}
                    className="w-full text-start px-3 py-2 text-xs transition-colors duration-100"
                    style={
                      sort === option.value
                        ? { color: '#4ade80', background: 'rgba(34,197,94,0.1)' }
                        : { color: '#aaa' }
                    }
                    onMouseEnter={(e) => {
                      if (sort !== option.value) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.color = '#e5e5e5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (sort !== option.value) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#aaa'
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div> : null}
          </div>
        </div>
      </div>

      {/* Results count line */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs" style={{ color: '#555' }} aria-live="polite" aria-atomic="true">
          {filteredCourses.length}{' '}
          {filteredCourses.length === 1 ? 'course' : t('available')}
        </span>
        {hasActiveFilters ? <button
            onClick={clearFilters}
            className="text-xs transition-opacity duration-150 hover:opacity-70"
            style={{ color: '#4ade80' }}
          >
            {t('empty.clearFilters')}
          </button> : null}
      </div>

      {/* Course grid or empty state */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-4 py-20 rounded-xl"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Search className="w-10 h-10" style={{ color: '#333' }} aria-hidden="true" />
          <p className="text-sm font-medium" style={{ color: '#555' }}>
            {t('empty.title')}
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34,197,94,0.18)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34,197,94,0.1)'
            }}
          >
            {t('empty.clearFilters')}
          </button>
        </div>
      )}
    </div>
  )
}
