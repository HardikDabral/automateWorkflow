import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '../components/providers'

export const metadata: Metadata = {
  title: 'Workflow Platform',
  description: 'AI-powered workflow automation',
}

const themeScript = `(function(){try{var t=localStorage.getItem('wf-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
