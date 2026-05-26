import { z } from 'zod'

export const suggestionDataSchema = z.object({
  suggestion: z.string(),
})

export type SuggestionData = z.infer<typeof suggestionDataSchema>
