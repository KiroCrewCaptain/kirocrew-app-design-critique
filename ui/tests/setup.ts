import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { bindAppApi } from '../src/appApi'
import { resetStubSdk, useAppApi } from './stubs/app-sdk'

beforeEach(() => {
  // The page root binds the host's scoped client; a test that calls the API
  // module directly gets the stub's, which runs over the stubbed `fetch`.
  bindAppApi(useAppApi())
})

afterEach(() => {
  cleanup()
  resetStubSdk()
})
