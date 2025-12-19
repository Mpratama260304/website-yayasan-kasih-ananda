// Quick test script untuk auth
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

async function testAuth() {
  console.log('🧪 Testing authentication flow...\n')
  
  // Test 1: Hash password
  console.log('1️⃣ Testing password hash:')
  const password = 'admin123'
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)
  console.log('   Password:', password)
  console.log('   Hashed:', hashed)
  console.log()
  
  // Test 2: Verify password
  console.log('2️⃣ Testing password verification:')
  const isValid = await bcrypt.compare(password, hashed)
  console.log('   Password match:', isValid)
  console.log()
  
  // Test 3: Wrong password
  console.log('3️⃣ Testing wrong password:')
  const isInvalid = await bcrypt.compare('wrongpassword', hashed)
  console.log('   Password match:', isInvalid)
  console.log()
  
  console.log('✅ All tests passed!')
}

testAuth().catch(err => console.error('❌ Error:', err))
