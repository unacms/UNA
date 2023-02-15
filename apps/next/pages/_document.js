import React from 'react'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head />
      <body className="bg-gray-200 dark:bg-[#06090E] text-gray-800 dark:text-gray-200">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
