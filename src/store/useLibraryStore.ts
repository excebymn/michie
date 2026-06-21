import { create } from 'zustand'
import type { Track, Album } from '../types/track'

interface LibraryStore {
  tracks: Track[]
  albums: Album[]
  isScanning: boolean
  scanProgress: { current: number; total: number } | null
  searchQuery: string
  sortBy: 'title' | 'artist' | 'album' | 'dateAdded'
  sortOrder: 'asc' | 'desc'
  view: 'tracks' | 'albums' | 'artists'

  setTracks: (tracks: Track[]) => void
  setAlbums: (albums: Album[]) => void
  setScanning: (v: boolean) => void
  setScanProgress: (p: { current: number; total: number } | null) => void
  setSearch: (q: string) => void
  setSort: (by: LibraryStore['sortBy'], order?: LibraryStore['sortOrder']) => void
  setView: (v: LibraryStore['view']) => void
  
  filteredTracks: () => Track[]
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  tracks: [],
  albums: [],
  isScanning: false,
  scanProgress: null,
  searchQuery: '',
  sortBy: 'dateAdded',
  sortOrder: 'desc',
  view: 'tracks',

  setTracks: (tracks) => set({ tracks }),
  setAlbums: (albums) => set({ albums }),
  setScanning: (isScanning) => set({ isScanning }),
  setScanProgress: (scanProgress) => set({ scanProgress }),
  setSearch: (searchQuery) => set({ searchQuery }),
  setSort: (sortBy, sortOrder = 'asc') => set({ sortBy, sortOrder }),
  setView: (view) => set({ view }),

  filteredTracks: () => {
    const { tracks, searchQuery, sortBy, sortOrder } = get()
    let result = tracks

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      )
    }

    return [...result].sort((a, b) => {
      const va = String(a[sortBy] ?? '')
      const vb = String(b[sortBy] ?? '')
      return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  },
}))