'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Card, Button, Input, EyebrowLabel } from '@/components'
import { loginAction, signUpAction, resetPasswordAction } from '@/app/actions'

const initialState = {
  error: '',
  success: '',
}

export function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [loginState, loginFormAction] = useFormState(loginAction, initialState)
  const [signUpState, signUpFormAction] = useFormState(signUpAction, initialState)
  const [resetState, resetFormAction] = useFormState(resetPasswordAction, initialState)

  const activeState = mode === 'signin' ? loginState : mode === 'signup' ? signUpState : resetState
  const activeAction = mode === 'signin' ? loginFormAction : mode === 'signup' ? signUpFormAction : resetFormAction

  return (
    <Card className="p-6 bg-surface border border-hairline shadow-card rounded-xl">
      <div className="flex border-b border-hairline pb-4 mb-6">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 text-center font-semibold text-sm pb-2 border-b-2 transition-all ${
            mode === 'signin'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-light hover:text-ink'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 text-center font-semibold text-sm pb-2 border-b-2 transition-all ${
            mode === 'signup'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-light hover:text-ink'
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

        {mode !== 'forgot' && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <EyebrowLabel>Password</EyebrowLabel>
              {mode === 'signin' && (
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')}
                  className="text-xs text-primary hover:text-primary-hover font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full"
            />
          </div>
        )}

        {activeState?.error && (
          <p className="text-sm text-data-down bg-data-down/10 border border-data-down/20 p-2.5 rounded font-sans">
            {activeState.error}
          </p>
        )}

        {activeState?.success && (
          <p className="text-sm text-data-up bg-data-up/10 border border-data-up/20 p-2.5 rounded font-sans">
            {activeState.success}
          </p>
        )}

        <Button type="submit" className="w-full justify-center">
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </Button>
        {mode === 'forgot' && (
          <button 
            type="button" 
            onClick={() => setMode('signin')}
            className="w-full text-center text-sm text-ink-light hover:text-ink mt-2 block"
          >
            Back to Sign In
          </button>
        )}
      </form>
    </Card>
  )
}
