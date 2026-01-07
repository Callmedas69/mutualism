Exporting/downloading an image from a Farcaster Mini App is not something the platform does “for you”; you implement it yourself in the web app that runs as the Mini App, using normal web techniques plus the Mini App SDK where helpful.[1][2]

Below are the main approaches that work today.

## Clarifying the context

“Farcaster Mini App” = a regular web app (HTML/JS/CSS) loaded inside Farcaster clients via the Mini App SDK.[2]
So downloading/exporting an image is done the same way you would in a normal mobile‑web app, subject to sandbox and browser limitations.[1][2]

## Easiest: Direct image download link

If your Mini App serves an image at some URL, you can:

- Render the image with a normal `<img src="...">`, and below it add an `<a>` tag with `href` pointing to the same image and `download` set.  
- Example pattern: `"<a href='https://yourapp.xyz/image.png' download='my-image.png'>Download</a>"` lets most mobile browsers open/save the file from the in‑app webview.[3][1]

Limitations:

- Some in‑app browsers ignore the `download` attribute and will just open the image in a new tab, from where the user can long‑press and “Save Image”.[3]

## Programmatic export with a data URL

If the image is generated client‑side (canvas, generated frame, etc.):

- Draw or load the image into a `<canvas>`, then call `canvas.toDataURL('image/png')` to get a base64 data URL.  
- Create a hidden `<a>` element, set `href` to that data URL and `download="filename.png"`, then trigger `click()` in response to a user action (button press). This triggers a download or opens the image in the browser so the user can save it.[4]

Notes:

- Must happen in a user‑initiated event (e.g., the button’s `onClick`), otherwise most browsers block it.  
- Large images can hit data‑URL limits; consider serving the rendered image from your backend instead.  

## “Export via share sheet” pattern

If your goal is “get this image out of Farcaster” (e.g., share to other apps), not strictly “save to Camera Roll”:

- After generating or hosting the image at a stable URL, show a button like “Open Image”.  
- When clicked, navigate the Mini App to that URL (`window.location.href = imageUrl`) so the client opens it in an external browser or fullscreen view.[2][1]
- From there, the user can use the OS share sheet or “Save Image” UX.  

This avoids some webview download quirks and is generally reliable on iOS/Android.

## If you need true Camera Roll export

If you want a 1‑tap “save to photos” experience:

- Today this typically requires native code or PWA-level integration; Mini Apps themselves run in a webview and cannot directly write to the Camera Roll without user interaction.[4][2]
- The realistic pattern is:
  - Offer the image as a file or open it in a separate tab.
  - Rely on OS “Save Image” / “Add to Photos” from the browser/preview UI.  

There is no Mini App–specific SDK method like `miniApp.saveImageToCameraRoll()` documented at this time; all examples treat images as regular web resources.[1][2]

## Practical implementation checklist

- Decide where the image comes from:
  - Static asset: host under `/public` and link directly.[1]
  - Generated (e.g., canvas, Satori/OG image): render server‑side or client‑side and expose a URL or data URL.[5][3]
- Add a clear, user‑initiated control:
  - “Download”, “Open image”, or “Share image”.  
- Implement one of:
  - `<a href="..." download>…</a>` for direct save.  
  - `canvas.toDataURL` + synthetic `click` on a download link.  
  - Redirect/open the image URL and rely on the OS share/save UI.  

If you describe your specific Mini App stack (Next.js/React, Nuxt/Vue, vanilla) and whether the image is static or dynamic (e.g., generated from user input), a minimal code snippet tailored to that setup can be sketched.

[1](https://docs.monad.xyz/templates/farcaster-miniapp/getting-started)
[2](https://github.com/farcasterxyz/miniapps)
[3](https://wanderloots.xyz/digital-garden/tutorials/how-to-convert-your-website-into-a-farcaster-mini-app-obsidian-digital-garden-example/)
[4](https://stackoverflow.com/questions/39753741/save-pictures-that-was-taken-through-the-apps-camera-to-devices-camera-roll-wi)
[5](https://dtech.vision/farcaster/frames/quickstart-farcasterframes/)
[6](https://lab.rosebud.ai/blog/create-a-warpcast-mini-app-with-rosebud-ai)
[7](https://github.com/farcasterxyz/protocol/discussions/205)
[8](https://x.com/Chuksdakingz/status/2000189872691093928)
[9](https://www.youtube.com/watch?v=O6k6Hpzek4g)
[10](https://www.youtube.com/watch?v=anVED0U7DeY)