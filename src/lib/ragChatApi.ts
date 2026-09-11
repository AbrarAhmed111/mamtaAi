/**
 * Client utility for mamtaai-rag chat API integration
 * Handles communication with the RAG backend's /chat endpoint
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

export interface UsageInfo {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ProviderStatusEvent {
  type: string
  status: string
  message: string
  provider: string
}

export interface ChatResponse {
  reply: string
  provider: string
  model: string
  usage: UsageInfo
  intent?: string | null
  status_events: ProviderStatusEvent[]
}

/**
 * Sends a chat request to the mamtaai-rag backend and returns the response.
 * Does NOT support streaming - gets the full response at once.
 *
 * @param messages - Array of chat messages (conversation history)
 * @param temperature - Optional temperature setting (0-2)
 * @param maxTokens - Optional max tokens to generate
 * @param apiUrl - Optional API base URL (defaults to NEXT_PUBLIC_BACKEND_RAG_URL env var)
 * @returns Promise<ChatResponse>
 */
export async function chatWithRag(
  messages: ChatMessage[],
  temperature?: number,
  maxTokens?: number,
  apiUrl?: string,
): Promise<ChatResponse> {
  const baseUrl = apiUrl || process.env.NEXT_PUBLIC_BACKEND_RAG_URL || 'http://localhost:8000'
  const endpoint = `${baseUrl}/api/chat`

  const request: ChatRequest = {
    messages,
    ...(temperature !== undefined && { temperature }),
    ...(maxTokens !== undefined && { max_tokens: maxTokens }),
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`RAG Chat API Error (${response.status}): ${error}`)
  }

  return response.json() as Promise<ChatResponse>
}
