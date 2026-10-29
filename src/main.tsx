// Polyfill ReadableStream[Symbol.asyncIterator] for WebKit / Safari WKWebView
// Needed by PDF.js text layer streaming (pdf.mjs line 16040)
if (
  typeof ReadableStream !== 'undefined' &&
  !(Symbol.asyncIterator in ReadableStream.prototype)
) {
  (ReadableStream.prototype as any)[Symbol.asyncIterator] = function () {
    const reader = this.getReader();
    return {
      async next() {
        const { done, value } = await reader.read();
        if (done) {
          reader.releaseLock();
          return { done: true, value: undefined };
        }
        return { done: false, value };
      },
      async return() {
        await reader.cancel();
        reader.releaseLock();
        return { done: true, value: undefined };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  };
}

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
