"use client"

import { useState, useEffect } from "react"

export const useUserNames = () => {
  const [user1Name, setUser1Name] = useState("Usuario 1")
  const [user2Name, setUser2Name] = useState("Usuario 2")

  useEffect(() => {
    // Cargar nombres personalizados
    const savedUser1Name = localStorage.getItem("user1_custom_name")
    const savedUser2Name = localStorage.getItem("user2_custom_name")

    if (savedUser1Name) setUser1Name(savedUser1Name)
    if (savedUser2Name) setUser2Name(savedUser2Name)

    // Escuchar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user1_custom_name" && e.newValue) {
        setUser1Name(e.newValue)
      }
      if (e.key === "user2_custom_name" && e.newValue) {
        setUser2Name(e.newValue)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // También escuchar cambios en la misma pestaña
    const checkForUpdates = () => {
      const currentUser1 = localStorage.getItem("user1_custom_name")
      const currentUser2 = localStorage.getItem("user2_custom_name")

      if (currentUser1 && currentUser1 !== user1Name) {
        setUser1Name(currentUser1)
      }
      if (currentUser2 && currentUser2 !== user2Name) {
        setUser2Name(currentUser2)
      }
    }

    const interval = setInterval(checkForUpdates, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [user1Name, user2Name])

  return { user1Name, user2Name }
}
