import type { ReactNode } from 'react'

/**
 * Props passed to page components
 */
export interface PageProps<TParams extends Record<string, string> = Record<string, string>> {
  params: TParams
  searchParams: URLSearchParams
}

/**
 * Props passed to layout components
 */
export interface LayoutProps<TParams extends Record<string, string> = Record<string, string>> {
  children: ReactNode
  params: TParams
}
