---
title: ready
description: Hides the Splash Screen.
---

import { Caption } from '../../../../components/Caption.tsx';

# ready

Hides the Splash Screen. Read the [guide on loading your app](/docs/guides/loading) for best practices.

[If you're an AI agent or LLM, please read this.](/docs/guides/agents-checklist)

![calling ready to hide the splash screen](/ready_preview.png)

<Caption>
  Dismiss the Splash Screen with ready.
</Caption>

## Usage

```ts twoslash
import { sdk } from '@farcaster/miniapp-sdk'

await sdk.actions.ready()
```

## Parameters

### disableNativeGestures (optional)

- **Type:** `boolean`
- **Default:** `false`

Disable native gestures. Use this option if your frame uses gestures
that conflict with native gestures like swipe to dismiss.

## Return Value

`void`


Ask in ChatGPT

On this page
Overview
Requirements
Enable Developer Mode
Quick Start
Manual Setup
Package Manager
CDN
Making Your App Display
Troubleshooting
Node.js Version Issues
Building with AI
How does this work?
Next Steps
Getting Started
Overview
Mini apps are web apps built with HTML, CSS, and Javascript that can be discovered and used within Farcaster clients. You can use an SDK to access native Farcaster features, like authentication, sending notifications, and interacting with the user's wallet.

Requirements
Before getting started, make sure you have:

Node.js 22.11.0 or higher (LTS version recommended)
Check your version: node --version
Download from nodejs.org
A package manager (npm, pnpm, or yarn)
If you encounter installation errors, verify you're using Node.js 22.11.0 or higher. Earlier versions are not supported.

Enable Developer Mode
Developer mode gives you access to tools for Mini Apps, here's how to enable it:

Make sure you're logged in to Farcaster on either mobile or desktop
Click this link: https://farcaster.xyz/~/settings/developer-tools on either mobile or desktop.
Toggle on "Developer Mode"
Once enabled, a developer section will appear on the left side of your desktop display
Developer mode unlocks tools for creating manifests, previewing your mini app, auditing your manifests and embeds, and viewing analytics. We recommend using it on desktop for the best development experience.

Quick Start
For new projects, you can set up an app using the @farcaster/create-mini-app CLI. This will prompt you to set up a project for your app.

npm
pnpm
yarn

npm create @farcaster/mini-app
Remember, you can use whatever your favorite web framework is to build Mini Apps so if these options aren't appealing you can setup the SDK in your own project by following the instructions below.

Manual Setup
For existing projects, install the MiniApp SDK:

Package Manager
npm
pnpm
yarn

npm install @farcaster/miniapp-sdk
CDN
If you're not using a package manager, you can also use the MiniApp SDK via an ESM-compatible CDN such as esm.sh. Simply add a <script type="module"> tag to the bottom of your HTML file with the following content.


<script type="module">
  import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk'
</script>
Making Your App Display
After your app loads, you must call sdk.actions.ready() to hide the splash screen and display your content:


import { sdk } from '@farcaster/miniapp-sdk'
 
// After your app is fully loaded and ready to display
await sdk.actions.ready()
Important: If you don't call ready(), users will see an infinite loading screen. This is one of the most common issues when building Mini Apps.