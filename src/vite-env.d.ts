/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_API_KEY: string
  readonly VITE_DEMO_API_KEY?: string
  readonly VITE_ALCHEMY_NETWORK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
