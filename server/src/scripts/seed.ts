import '../loadEnv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectMongo, disconnectMongo } from '../services/mongoService'
import { Tenant, User, CustomerVocabulary } from '../models'
import { DEFAULT_ENTITY_EVENTS } from '@wf/shared'

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo1234'
const DEMO_COMPANY = 'Demo Co'
const DEMO_SLUG = 'demo-co'

async function main() {
  await connectMongo()

  // Find-or-create the tenant by slug (idempotent).
  let tenant = await Tenant.findOne({ slug: DEMO_SLUG }).setOptions({ skipTenantScope: true })
  if (!tenant) {
    tenant = await Tenant.create({ name: DEMO_COMPANY, slug: DEMO_SLUG })
    console.log(`[seed] created tenant ${tenant._id}`)
  } else {
    console.log(`[seed] tenant exists ${tenant._id}`)
  }

  // Find-or-create demo user.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  let user = await User.findOne({ email: DEMO_EMAIL }).setOptions({ skipTenantScope: true })
  if (!user) {
    user = await User.create({
      tenantId: tenant._id,
      email: DEMO_EMAIL,
      passwordHash,
      role: 'admin',
    })
    console.log(`[seed] created user ${user.email}`)
  } else {
    // Keep password in sync so the demo creds always work.
    user.passwordHash = passwordHash
    await user.save()
    console.log(`[seed] user exists, password reset`)
  }

  // Ensure vocabulary exists for the tenant.
  const vocab = await CustomerVocabulary.findOne({ tenantId: tenant._id })
  if (!vocab) {
    await CustomerVocabulary.create({
      tenantId: tenant._id,
      entityEvents: [...DEFAULT_ENTITY_EVENTS],
      pipelineStages: ['new', 'qualified', 'proposal', 'won', 'lost'],
      emailTemplates: [
        {
          id: 'welcome',
          name: 'Welcome email',
          subject: 'Welcome to {{company.name}}',
          html: '<p>Hi {{lead.firstName}}, thanks for signing up.</p>',
          variables: ['lead.firstName', 'company.name'],
        },
      ],
    })
    console.log('[seed] vocabulary seeded')
  }

  // Seed a small leads collection so activate-preview has something to count.
  const db = mongoose.connection.db
  if (db) {
    const existing = await db.collection('leads').countDocuments({ tenantId: tenant._id.toString() })
    if (existing === 0) {
      await db.collection('leads').insertMany([
        { tenantId: tenant._id.toString(), firstName: 'Ada', email: 'ada@example.com', stage: 'new', createdAt: new Date() },
        { tenantId: tenant._id.toString(), firstName: 'Linus', email: 'linus@example.com', stage: 'qualified', createdAt: new Date() },
        { tenantId: tenant._id.toString(), firstName: 'Grace', email: 'grace@example.com', stage: 'new', createdAt: new Date() },
      ])
      console.log('[seed] inserted 3 demo leads')
    }
  }

  console.log('')
  console.log('────────────────────────────────────────')
  console.log(' Demo account ready:')
  console.log(`   email:    ${DEMO_EMAIL}`)
  console.log(`   password: ${DEMO_PASSWORD}`)
  console.log('────────────────────────────────────────')

  await disconnectMongo()
}

main().catch((err) => {
  console.error('[seed] failed', err)
  process.exit(1)
})
