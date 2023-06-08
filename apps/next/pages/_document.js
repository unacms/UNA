import React from 'react'
import { Html, Head, Main, NextScript } from 'next/document'


function dedupe(bundles) {
  const files = new Set();
  const kept = [];

  for (const bundle of bundles) {
    if (files.has(bundle.file)) continue;
    files.add(bundle.file);
    kept.push(bundle);
  }
  return kept;
}

/**
 * Custom NextScript to defer loading of unnecessary JS.
 * Standard behavior is async. Compatible with Next.js 10.0.3
 */

class DeferNextScript extends NextScript {
  getDynamicChunks(files) {
    const {
      dynamicImports,
      assetPrefix,
      isDevelopment,
      devOnlyCacheBusterQueryString,
    } = this.context;
    //isDevelopment = false;

    return dedupe(dynamicImports).map((bundle) => {
      if (!bundle.file.endsWith('.js') || files.allFiles.includes(bundle.file))
        return null;

      return (
        <script
          ccc="ddd"
          defer={true}
          key={bundle.file}
          src={`${assetPrefix}/_next/${encodeURI(
            bundle.file
          )}${devOnlyCacheBusterQueryString}`}
          nonce={this.props.nonce}
          crossOrigin={
            this.props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN
          }
        />
      );
    });
  }
  getScripts(files) {
    const {
      assetPrefix,
      buildManifest,
      isDevelopment,
      devOnlyCacheBusterQueryString,
    } = this.context;
    //isDevelopment = false;

    const normalScripts = files.allFiles.filter((file) => file.endsWith('.js'));
    const lowPriorityScripts = buildManifest.lowPriorityFiles?.filter((file) =>
      file.endsWith('.js')
    );

    return [...normalScripts, ...lowPriorityScripts].map((file) => {
      return (
        <script
          key={file}
          src={`${assetPrefix}/_next/${encodeURI(
            file
          )}${devOnlyCacheBusterQueryString}`}
          nonce={this.props.nonce}
          defer={true}
          aaa="bbb"
          crossOrigin={
            this.props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN
          }
        />
      );
    });
  }
}


export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="relative bg-backgroundnavbar dark:bg-backgroundnavbar-dark text-neutral-900 dark:text-neutral-50">
        <Main />
        {/*< NextScript/>*/}
        <DeferNextScript />
      </body>
    </Html>
  )
}