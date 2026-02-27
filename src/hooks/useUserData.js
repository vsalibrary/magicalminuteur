import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject
} from 'firebase/storage'
import { db, storage } from '../firebase/config'

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

    // Listen to settings
    const settingsRef = doc(db, 'users', uid, 'settings', 'main')
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() })
      } else {
        setSettings(DEFAULT_SETTINGS)
      }
    })

    // Listen to sounds
    const soundsRef = collection(db, 'users', uid, 'sounds')
    const unsubSounds = onSnapshot(soundsRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
      setSounds(list)
    })

    // Listen to games
    const gamesRef = collection(db, 'users', uid, 'games')
    const unsubGames = onSnapshot(gamesRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0))
      setGames(list)
    })

    return () => {
      unsubSettings()
      unsubSounds()
      unsubGames()
    }
  }, [uid])

  const uploadSound = useCallback(async (file) => {
    if (!uid) return
    setUploading(true)
    setUploadProgress(0)

    const path = `users/${uid}/sounds/${file.name}`
    const sRef = storageRef(storage, path)
    const task = uploadBytesResumable(sRef, file)

    return new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        },
        (err) => {
          console.error('Upload error:', err)
          setUploading(false)
          reject(err)
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref)
            const soundsRef = collection(db, 'users', uid, 'sounds')
            await addDoc(soundsRef, {
              name: file.name.replace(/\.[^.]+$/, ''),
              filename: file.name,
              storagePath: path,
              url,
              createdAt: serverTimestamp(),
            })
            setUploading(false)
            setUploadProgress(0)
            resolve()
          } catch (err) {
            console.error('Firestore write error:', err)
            setUploading(false)
            reject(err)
          }
        }
      )
    })
  }, [uid])

  const deleteSound = useCallback(async (soundId, storagePath) => {
    if (!uid) return
    try {
      const sRef = storageRef(storage, storagePath)
      await deleteObject(sRef)
    } catch (err) {
      console.warn('Storage delete error (may already be gone):', err)
    }
    await deleteDoc(doc(db, 'users', uid, 'sounds', soundId))

    // If this sound was assigned, reset to default
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

  const saveGame = useCallback(async ({ teamA, teamB, scoreA, scoreB }) => {
    if (!uid) return
    const gamesRef = collection(db, 'users', uid, 'games')
    await addDoc(gamesRef, {
      teamA,
      teamB,
      scoreA,
      scoreB,
      date: serverTimestamp(),
    })
  }, [uid])

  return { settings, sounds, games, uploadSound, deleteSound, assignSound, saveGame, uploading, uploadProgress }
}
