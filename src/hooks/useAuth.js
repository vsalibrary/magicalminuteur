import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../firebase/config'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    if (!auth) { setUser(null); return }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null)
    })
    return unsubscribe
  }, [])

  const signIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Sign-in error:', err)
      }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (err) {
      console.error('Sign-out error:', err)
    }
  }

  return { user, signIn, signOut }
}
