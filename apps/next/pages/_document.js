import React from 'react'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head />
      <body className="relative bg-gray-200 dark:bg-[#06090E] text-gray-900 dark:text-gray-50">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
