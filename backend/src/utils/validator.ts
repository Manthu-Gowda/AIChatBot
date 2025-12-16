import { z } from 'zod'

export const emailSchema = z.string().email()

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  name: z.string().min(1, 'Full name is required'),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
})

export const forgotSchema = z.object({ email: emailSchema })

export const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(8) })

export const settingsSchema = z.object({
  defaultProvider: z.enum(['OPENAI', 'DEEPSEEK', 'GEMINI', 'PERPLEXITY', 'ANTHROPIC', 'MISTRAL', 'OPENROUTER', 'GROQ']).optional(),
  apiKeys: z
    .object({
      openai: z.string().optional(),
      deepseek: z.string().optional(),
      gemini: z.string().optional(),
      perplexity: z.string().optional(),
      anthropic: z.string().optional(),
      mistral: z.string().optional(),

      openrouter: z.string().optional(),
      groq: z.string().optional(),
    })
    .optional(),
})

export const projectCreateSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  responsibilities: z.string().optional(),
  description: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  provider: z.enum(['OPENAI', 'DEEPSEEK', 'GEMINI', 'PERPLEXITY', 'ANTHROPIC', 'MISTRAL', 'OPENROUTER', 'GROQ']).optional(),
  apiKey: z.string().optional(),
})

export const folderCreateSchema = z.object({ name: z.string().min(1), parentId: z.string().optional() })

export const chatSchema = z.object({
  message: z.string().min(1),
  provider: z.enum(['OPENAI', 'DEEPSEEK', 'GEMINI', 'PERPLEXITY', 'ANTHROPIC', 'MISTRAL', 'OPENROUTER', 'GROQ']).optional(),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
})
