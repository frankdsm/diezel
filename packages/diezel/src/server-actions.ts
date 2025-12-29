// Server Actions Registry and Handler

// Store for registered server actions
const actionRegistry = new Map<string, Function>()

/**
 * Register a server action
 */
export function registerAction(id: string, fn: Function) {
  actionRegistry.set(id, fn)
}

/**
 * Get a registered action
 */
export function getAction(id: string): Function | undefined {
  return actionRegistry.get(id)
}

/**
 * Handle a server action request
 */
export async function handleServerAction(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { actionId, args } = body as { actionId: string; args: unknown[] }

    const action = actionRegistry.get(actionId)
    if (!action) {
      return Response.json(
        { error: `Action not found: ${actionId}` },
        { status: 404 }
      )
    }

    const result = await action(...args)
    return Response.json({ result })
  } catch (error) {
    console.error('[Server Action Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 }
    )
  }
}

/**
 * Create a client-callable action reference
 * This is used by the transform plugin to replace server functions
 */
export function createActionReference(actionId: string) {
  return async (...args: unknown[]) => {
    // On server, call directly
    if (typeof window === 'undefined') {
      const action = actionRegistry.get(actionId)
      if (!action) throw new Error(`Action not found: ${actionId}`)
      return action(...args)
    }

    // On client, make fetch request
    const response = await fetch('/_server-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, args })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Server action failed')
    }

    const { result } = await response.json()
    return result
  }
}
