import React from 'react'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head />
      <body className="relative bg-backgroundBody dark:bg-backgroundBody-dark text-neutral-900 dark:text-neutral-50">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}