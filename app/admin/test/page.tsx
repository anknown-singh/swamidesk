export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Test Page</h1>
      <p>If you can see this, deployment is working!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}