export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Test Page</h1>
      <p>If you can see this, deployment is working!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      <p className="mt-2 text-green-600">🔄 Testing automatic Git push deployment - Aug 6, 2025</p>
      <p className="mt-2 text-blue-600">✅ ESLint fixes completed - pre-commit hook test</p>
    </div>
  )
}