import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, getDoc, setDoc, addDoc, deleteDoc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { supabase } from '../supabase/client'

const BUCKET = 'sounds'

const DEFAULT_SETTINGS = {
  correctSoundId: 'default',
  incorrectSoundId: 'default',
  volume: 0.8,
}

export function useUserData(uid) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [sounds, setSounds] = useState([])
  const [games, setGames] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
      if (data.correctSoundId === soundId) updates.correctSoundId = 'default'
      if (data.incorrectSoundId === soundId) updates.incorrectSoundId = 'default'
      if (Object.keys(updates).length > 0) {
        await setDoc(settingsRef, updates, { merge: true })
      }
    }
  }, [uid])

  const assignSound = useCallback(async (slot, soundId) => {
    if (!uid) return
    const settingsRef = doc(db, 'users', uid, 'settings', 'main')
    const field = slot === 'correct' ? 'correctSoundId' : 'incorrectSoundId'
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

  return { settings, sounds, games, uploadSound, deleteSound, assignSound, saveGame, deleteGame, deleteAllGames, uploading, uploadProgress }
}
