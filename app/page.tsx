'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Cliente {
  id: number
  nombre: string
}

export default function Home() {
  const [clientes, setClientes] = useState<Cliente[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('clientes').select('*')
      setClientes(data || [])
    }
    fetchData()
  }, [])

  return (
    <main className="text-white bg-black min-h-screen p-10">
      <h1 className="text-3xl font-bold mb-4">Clientes:</h1>
      <ul>
        {clientes.map((c) => (
          <li key={c.id}>{c.nombre}</li>
        ))}
      </ul>
    </main>
  )
} 