import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import { userTable, professorTable, alunoTable, departamentoTable, cursoTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

async function createTestUser() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  console.log('🔄 Connecting to database...')
  const sql = postgres(process.env.DATABASE_URL)
  const db = drizzle(sql)

  try {
    // Test database connection
    await sql`SELECT 1`
    console.log('✅ Database connection successful')

    console.log('🔐 Hashing password...')
    const passwordHash = await bcrypt.hash('password123', 10)

    // Create or get test department
    console.log('🏢 Creating test department...')
    let departamento = await db
      .select()
      .from(departamentoTable)
      .where(eq(departamentoTable.nome, 'Departamento de Ciência da Computação'))
      .limit(1)

    if (departamento.length === 0) {
      const [newDept] = await db
        .insert(departamentoTable)
        .values({
          unidadeUniversitaria: 'Instituto de Computação',
          nome: 'Departamento de Ciência da Computação',
          sigla: 'DCC',
          email: 'dcc@ufba.br',
        })
        .returning()
      departamento = [newDept]
      console.log('✅ Test department created')
    } else {
      console.log('✅ Test department already exists')
    }

    // Create or get test course
    console.log('📚 Creating test course...')
    let curso = await db
      .select()
      .from(cursoTable)
      .where(eq(cursoTable.nome, 'Bacharelado em Ciência da Computação'))
      .limit(1)

    if (curso.length === 0) {
      const [newCourse] = await db
        .insert(cursoTable)
        .values({
          nome: 'Bacharelado em Ciência da Computação',
          codigo: 101,
          tipo: 'BACHARELADO',
          modalidade: 'PRESENCIAL',
          duracao: 8,
          departamentoId: departamento[0].id,
          cargaHoraria: 3000,
          status: 'ATIVO',
        })
        .returning()
      curso = [newCourse]
      console.log('✅ Test course created')
    } else {
      console.log('✅ Test course already exists')
    }

    // Create ADMIN user
    console.log('\n👨‍💼 Creating ADMIN test user...')
    const adminUser = await db.select().from(userTable).where(eq(userTable.email, 'admin@ufba.br')).limit(1)

    if (adminUser.length === 0) {
      const [newAdmin] = await db
        .insert(userTable)
        .values({
          username: 'admin_test',
          email: 'admin@ufba.br',
          passwordHash,
          role: 'admin',
          emailVerifiedAt: new Date(),
        })
        .returning()

      console.log('✅ Admin user created successfully!')
      console.log('📧 Email: admin@ufba.br')
      console.log('🔑 Password: password123')
      console.log('👤 User ID:', newAdmin.id)
    } else {
      console.log('✅ Admin user already exists')
      console.log('📧 Email: admin@ufba.br')
    }

    // Create PROFESSOR user
    console.log('\n👨‍🏫 Creating PROFESSOR test user...')
    const professorUser = await db.select().from(userTable).where(eq(userTable.email, 'professor@ufba.br')).limit(1)

    if (professorUser.length === 0) {
      const [newProfessorUser] = await db
        .insert(userTable)
        .values({
          username: 'professor_test',
          email: 'professor@ufba.br',
          passwordHash,
          role: 'professor',
          emailVerifiedAt: new Date(),
        })
        .returning()

      // Create professor profile
      await db.insert(professorTable).values({
        userId: newProfessorUser.id,
        nomeCompleto: 'João Silva Professor',
        departamentoId: departamento[0].id,
        matriculaSiape: '1234567',
        regime: 'DE',
        emailInstitucional: 'professor@ufba.br',
      })

      console.log('✅ Professor user created successfully!')
      console.log('📧 Email: professor@ufba.br')
      console.log('🔑 Password: password123')
      console.log('👤 User ID:', newProfessorUser.id)
      console.log('👨‍🏫 SIAPE: 1234567')
    } else {
      console.log('✅ Professor user already exists')
      console.log('📧 Email: professor@ufba.br')
    }

    // Create STUDENT user
    console.log('\n👨‍🎓 Creating STUDENT test user...')
    const studentUser = await db.select().from(userTable).where(eq(userTable.email, 'student@ufba.br')).limit(1)

    if (studentUser.length === 0) {
      const [newStudentUser] = await db
        .insert(userTable)
        .values({
          username: 'student_test',
          email: 'student@ufba.br',
          passwordHash,
          role: 'student',
          emailVerifiedAt: new Date(),
        })
        .returning()

      // Create student profile
      await db.insert(alunoTable).values({
        userId: newStudentUser.id,
        nomeCompleto: 'Maria Santos Estudante',
        matricula: '202301234',
        cr: 8.5,
        cursoId: curso[0].id,
        emailInstitucional: 'student@ufba.br',
      })

      console.log('✅ Student user created successfully!')
      console.log('📧 Email: student@ufba.br')
      console.log('🔑 Password: password123')
      console.log('👤 User ID:', newStudentUser.id)
      console.log('🎓 Matrícula: 202301234')
    } else {
      console.log('✅ Student user already exists')
      console.log('📧 Email: student@ufba.br')
    }

    // Legacy test users
    console.log('\n👤 Checking legacy test users...')
    const existingUser = await db.select().from(userTable).where(eq(userTable.email, 'test@example.com')).limit(1)

    if (existingUser.length === 0) {
      await db.insert(userTable).values({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash,
        role: 'student',
        emailVerifiedAt: new Date(),
      })
      console.log('✅ Legacy test user created (test@example.com)')
    } else {
      console.log('✅ Legacy test user exists (test@example.com)')
    }

    const existingE2EUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, 'e2e-test@example.com'))
      .limit(1)

    if (existingE2EUser.length === 0) {
      await db.insert(userTable).values({
        username: 'e2etestuser',
        email: 'e2e-test@example.com',
        passwordHash,
        role: 'student',
        emailVerifiedAt: new Date(),
      })
      console.log('✅ Legacy E2E test user created (e2e-test@example.com)')
    } else {
      console.log('✅ Legacy E2E test user exists (e2e-test@example.com)')
    }

    console.log('\n✨ All test users created successfully!')
    console.log('\n📋 Summary:')
    console.log('  Admin: admin@ufba.br / password123')
    console.log('  Professor: professor@ufba.br / password123')
    console.log('  Student: student@ufba.br / password123')
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string }
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to database. Make sure PostgreSQL is running and DATABASE_URL is correct.')
    } else if (err.message?.includes('relation') && err.message?.includes('does not exist')) {
      console.error('❌ Database table does not exist. Run migrations first: npm run drizzle:push')
    } else {
      console.error('❌ Error creating test users:', err.message || String(error))
    }
    throw error
  } finally {
    await sql.end()
  }
}

// Run if called directly
if (require.main === module) {
  createTestUser().catch((error) => {
    console.error('Failed to create test user:', error)
    process.exit(1)
  })
}

export { createTestUser }
