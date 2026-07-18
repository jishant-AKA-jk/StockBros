'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Card, Button, Input, EyebrowLabel } from '@/components'
import { loginAction, signUpAction } from '@/app/actions'

const initialState = {
  error: '',
  success: '',
}

export function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loginState, loginFormAction] = useFormState(loginAction, initialState)
  const [signUpState, signUpFormAction] = useFormState(signUpAction, initialState)

  const activeState = mode === 'signin' ? loginState : signUpState
  const activeAction = mode === 'signin' ? loginFormAction : signUpFormAction

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-xl rounded-xl">
      <div className="flex border-b border-gray-100 pb-4 mb-6">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 text-center font-semibold text-sm pb-2 border-b-2 transition-all ${
            mode === 'signin'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 text-center font-semibold text-sm pb-2 border-b-2 transition-all ${
            mode === 'signup'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form action={activeAction} className="space-y-4">
        <div>
          <EyebrowLabel className="mb-1.5">Email Address</EyebrowLabel>
          <Input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="w-full"
          />
        </div>

        <div>
          <EyebrowLabel className="mb-1.5">Password</EyebrowLabel>
          <Input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="w-full"
          />
        </div>

        {activeState?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-2.5 rounded font-sans">
            {activeState.error}
          </p>
        )}

        {activeState?.success && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-100 p-2.5 rounded font-sans">
            {activeState.success}
          </p>
        )}

        <Button type="submit" className="w-full justify-center">
          {mode === 'signin' ? 'Sign In to StockBros' : 'Create Account'}
        </Button>
      </form>
    </Card>
  )
}
