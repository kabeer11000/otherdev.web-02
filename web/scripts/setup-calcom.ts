/**
 * Cal.com Setup Script for ElevenLabs Agent
 *
 * Creates the "Sales Discovery Call" event type and outputs credentials
 * needed for the ElevenLabs Cal.com integration.
 *
 * Usage:
 *   bun run scripts/setup-calcom.ts
 *
 * Prerequisites:
 *   1. Cal.com account (free tier works)
 *   2. CALCOM_API_KEY environment variable
 *   3. CALCOM_USER_ID (your Cal.com user ID)
 *
 * Setup steps:
 *   1. Go to https://cal.com and create an account (or log in)
 *   2. Go to Settings → API Keys → Create new key → name it "ElevenLabs"
 *   3. Copy the API key → set CALCOM_API_KEY in .env.local
 *   4. Get your user ID from Settings → Profile → copy the username/id
 *   5. Set CALCOM_USER_ID in .env.local
 *   6. Run this script: bun run scripts/setup-calcom.ts
 */

import { google } from 'googleapis'

const CALCOM_API_KEY = process.env.CALCOM_API_KEY
const CALCOM_USER_ID = process.env.CALCOM_USER_ID

if (!CALCOM_API_KEY || !CALCOM_USER_ID) {
  console.error('Missing required env vars: CALCOM_API_KEY, CALCOM_USER_ID')
  console.error('\nSetup steps:')
  console.error('1. Create Cal.com account at https://cal.com')
  console.error('2. Go to Settings → API Keys → Create new key named "ElevenLabs"')
  console.error('3. Set CALCOM_API_KEY and CALCOM_USER_ID in .env.local')
  process.exit(1)
}

async function createSalesCallEventType() {
  // Cal.com REST API base
  const baseUrl = 'https://api.cal.com/v1'

  // Create event type: 30-min sales discovery call
  const response = await fetch(`${baseUrl}/event-types`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Sales Discovery Call',
      slug: 'sales-discovery-call',
      description:
        'A 30-minute call to understand your project and see if Other Dev is the right fit.',
      length: 30, // minutes
      type: 'SCHEDULED',
      scheduling_type: 'ROUND_ROBIN',
      slotInterval: 30,
      minHostBookingNotice: 24, // hours
      locations: [{ type: 'google_meet' }],
      metadata: {
        enabledSsoOrganizer: false,
      },
      customInputs: [
        {
          label: 'Company Name',
          placeholder: 'Your company',
          required: true,
          type: 'TEXT',
        },
        {
          label: 'Budget Range',
          placeholder: 'e.g. $10k–$50k',
          required: false,
          type: 'TEXT',
        },
        {
          label: 'Brief Description',
          placeholder: 'What are you looking to build?',
          required: true,
          type: 'TEXT',
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Cal.com API error: ${response.status} - ${error}`)
  }

  const eventType = await response.json()
  return eventType
}

async function main() {
  console.log('🔧 Setting up Cal.com event type for ElevenLabs agent...\n')

  try {
    const eventType = await createSalesCallEventType()

    console.log('✅ Event type created successfully!\n')
    console.log('='.repeat(50))
    console.log('📋 CALCOM EVENT TYPE ID:', eventType.id)
    console.log('🔗 Booking link: https://cal.com/' + CALCOM_USER_ID + '/' + eventType.slug)
    console.log('='.repeat(50))
    console.log('\nAdd these to your .env.local:')
    console.log('')
    console.log('CALCOM_API_KEY=' + CALCOM_API_KEY)
    console.log('CALCOM_USER_ID=' + CALCOM_USER_ID)
    console.log('CALCOM_EVENT_TYPE_ID=' + eventType.id)
    console.log('')
    console.log('Then go to ElevenLabs dashboard → Integrations → Cal.com')
    console.log('to connect your Cal.com account and get the tool IDs.')
    console.log('Then update agent_config.tool_ids with the Cal.com tool IDs.')
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

main()
