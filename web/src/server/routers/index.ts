import { router } from '../trpc'
import { contactRouter } from './contact'
import { contentRouter } from './content'

export const appRouter = router({
  contact: contactRouter,
  content: contentRouter,
})

export type AppRouter = typeof appRouter
