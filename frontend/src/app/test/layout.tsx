export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <div>Test Layout</div>
        {children}
      </body>
    </html>
  )
}
