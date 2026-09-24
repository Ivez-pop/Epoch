'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export async function getUser() {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function signIn(formData: { email: string; password: string }) {
  const email = formData.email?.trim()
  const password = formData.password

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signUp(formData: { email: string; password: string }) {
  const email = formData.email?.trim()
  const password = formData.password

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data.user) {
    // Insert minimal profile record
    await supabase.from('profiles').insert([
      {
        id: data.user.id,
        display_name: email.split('@')[0],
      },
    ])
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  if (supabase) {
    await supabase.auth.signOut()
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}
