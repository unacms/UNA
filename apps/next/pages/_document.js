import React from 'react'
import { Html, Head, Main, NextScript } from 'next/document'


export default function Document() {
  return (
    <Html>
      <Head />
      <body className="relative bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
