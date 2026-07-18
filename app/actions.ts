'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function loginAction(prevState: { error?: string; success?: string } | null, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required', success: '' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message, success: '' }
  }

  revalidatePath('/')
  redirect('/dashboard')
}

export async function signUpAction(prevState: { error?: string; success?: string } | null, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required', success: '' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message, success: '' }
  }

  return { error: '', success: 'Verification link sent if email not confirmed yet, or sign up complete!' }
}

export async function signOutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
  redirect('/')
}
