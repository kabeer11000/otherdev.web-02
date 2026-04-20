'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const contactFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  companyName: z.string().min(1, {
    message: 'Company name is required.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  subject: z.string().min(1, {
    message: 'Subject is required.',
  }),
  message: z.string().min(10, {
    message: 'Message must be at least 10 characters.',
  }),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const [step, setStep] = useState<'intro' | 'form'>('intro')

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  const [isPending, setIsPending] = useState(false)

  const onSubmit = async (data: ContactFormValues) => {
    setIsPending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        if (res.status === 429) {
          form.setError('root', { message: error.error })
        } else {
          form.setError('root', { message: error.error?.formErrors?.[0]?.message || 'Failed to submit.' })
        }
        return
      }
      form.reset()
      setStep('intro')
      onOpenChange(false)
    } catch {
      form.setError('root', { message: 'Something went wrong. Please try again.' })
    } finally {
      setIsPending(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('intro')
      form.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="mt-[57px] ml-[12px] bg-background p-[10px] sm:p-[12px] w-[calc(100vw-24px)] sm:w-[450px] rounded-[5px] overflow-hidden border-0 shadow-none translate-x-0 translate-y-0 top-0 left-0 gap-0"
        showCloseButton={false}
      >
        {step === 'intro' ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Contact Us</DialogTitle>
            </DialogHeader>
            <p className="whitespace-pre-line text-[12px] sm:text-[13px] text-foreground font-twk font-normal leading-[1.4] sm:leading-[1.5]">
              {`Thank you for expressing interest in collaborating with us.

We specialize in working with brands and agencies to deliver unique web experiences. Please provide your information below to begin discussions of potential projects.

Kindly note that we do not provide our services to insurance companies or military contractors.

We will reach out to you with the next steps as soon as possible.`}
            </p>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full mt-[12px] sm:mt-[15px] h-8 sm:h-9 flex items-center justify-center rounded-md backdrop-blur-sm bg-card text-[11px] font-twk font-normal text-muted-foreground transition-colors hover:text-foreground"
            >
              <p>Next</p>
            </button>
          </>
        ) : (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Contact Form</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1.5 sm:space-y-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Name" {...field} className="bg-card" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Company Name" {...field} className="bg-card" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} className="bg-card" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Subject" {...field} className="bg-card" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Message"
                          className="resize-none min-h-[70px] sm:min-h-[80px] bg-card"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  className="w-full mt-[12px] sm:mt-[15px] h-8 sm:h-9 flex items-center justify-center rounded-md backdrop-blur-sm bg-card text-[11px] font-twk font-normal text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending}
                >
                  <p>{isPending ? 'Submitting...' : 'Submit'}</p>
                </button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
