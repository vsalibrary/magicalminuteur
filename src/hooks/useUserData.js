import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, getDoc, setDoc, addDoc, deleteDoc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { supabase } from '../supabase/client'

const BUCKET = 'sounds'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

async function validateAudioFile(file) {
  if (!file.type.startsWith('audio/')) return 'Only audio files are allowed.'
  if (file.size > MAX_FILE_SIZE) return 'File must be under 10MB.'
  const buf = await file.slice(0, 12).arrayBuffer()
  const b = new Uint8Array(buf)
  const isMP3  = (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) || (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33)
  const isWAV  = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
  const isOGG  = b[0] === 0x4F && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53
  const isFLAC = b[0] === 0x66 && b[1] === 0x4C && b[2] === 0x61 && b[3] === 0x43
  const isM4A  = b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70
  const isAIFF = b[0] === 0x46 && b[1] === 0x4F && b[2] === 0x52 && b[3] === 0x4D
  if (!isMP3 && !isWAV && !isOGG && !isFLAC && !isM4A && !isAIFF) return 'File does not appear to be a valid audio file.'
  return null
}

const DEFAULT_SETTINGS = {
  correctSoundId: 'default',
  incorrectSoundId: 'default',
  timesUpSoundId: 'default',
  soundboardSlot0: 'default',
  soundboardSlot1: 'default',
  soundboardSlot2: 'default',
  soundboardSlot3: 'default',
  volume: 0.8,
}

const SLOT_TO_FIELD = {
  correct: 'correctSoundId',
  incorrect: 'incorrectSoundId',
  timesup: 'timesUpSoundId',
  slot0: 'soundboardSlot0',
  slot1: 'soundboardSlot1',
  slot2: 'soundboardSlot2',
  slot3: 'soundboardSlot3',
}

export function useUserData(uid) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [sounds, setSounds] = useState([])
  const [games, setGames] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState(null)

  useEffect(() => {
    if (!uid) {
      setSettings(DEFAULT_SETTINGS)
      setSounds([])
      setGames([])
      return
    }

    const settingsRef = doc(db, 'users', uid, 'settings', 'main')
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      setSettings(snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS)
    })

    const soundsRef = collection(db, 'users', uid, 'sounds')
    const unsubSounds = onSnapshot(soundsRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
      setSounds(list)
    })

    const gamesRef = collection(db, 'users', uid, 'games')
    const unsubGames = onSnapshot(gamesRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0))
      setGames(list)
    })

    return () => { unsubSettings(); unsubSounds(); unsubGames() }
  }, [uid])

  const uploadSound = useCallback(async (file) => {
    if (!uid || !supabase) return
    if (sounds.length >= 4) return
    setUploadError(null)
    const validationError = await validateAudioFile(file)
    if (validationError) { setUploadError(validationError); return }
    setUploading(true)
    setUploadProgress(0)

    const path = `users/${uid}/sounds/${file.name}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
    if (error) {
      console.error('Upload error:', error)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

    await addDoc(collection(db, 'users', uid, 'sounds'), {
      name: file.name.replace(/\.[^.]+$/, ''),
      filename: file.name,
      storagePath: path,
      url: publicUrl,
      createdAt: serverTimestamp(),
    })

    setUploadProgress(100)
    setUploading(false)
  }, [uid, sounds])

  const deleteSound = useCallback(async (soundId, storagePath) => {
    if (!uid) return
    if (supabase) {
      const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
      if (error) console.warn('Storage delete error:', error)
    }
    await deleteDoc(doc(db, 'users', uid, 'sounds', soundId))

    const settingsRef = doc(db, 'users', uid, 'settings', 'main')
    const snap = await getDoc(settingsRef)
    if (snap.exists()) {
      const data = snap.data()
      const updates = {}
      for (const field of Object.values(SLOT_TO_FIELD)) {
        if (data[field] === soundId) updates[field] = 'default'
      }
      if (Object.keys(updates).length > 0) {
        await setDoc(settingsRef, updates, { merge: true })
      }
    }
  }, [uid])

  const assignSound = useCallback(async (slot, soundId) => {
    if (!uid) return
    const field = SLOT_TO_FIELD[slot]
    if (!field) return
    const settingsRef = doc(db, 'users', uid, 'settings', 'main')
    await setDoc(settingsRef, { [field]: soundId }, { merge: true })
  }, [uid])

  const saveGame = useCallback(async ({ teamA, teamB, scoreA, scoreB, cells }) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'games'), {
      teamA, teamB, scoreA, scoreB, cells: cells || null, date: serverTimestamp(),
    })
  }, [uid])

  const deleteGame = useCallback(async (gameId) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'games', gameId))
  }, [uid])

  const deleteAllGames = useCallback(async (gamesList) => {
    if (!uid || !gamesList?.length) return
    await Promise.all(gamesList.map(g => deleteDoc(doc(db, 'users', uid, 'games', g.id))))
  }, [uid])

  return { settings, sounds, games, uploadSound, deleteSound, assignSound, saveGame, deleteGame, deleteAllGames, uploading, uploadProgress, uploadError }
}
