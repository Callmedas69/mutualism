# Graph Performance Optimization

This document captures **practical, production-tested optimizations** to make a `react-force-graph-2d` visualization feel **seamless / Arkham-smooth** in **Next.js**.

Target scale: **25–100 nodes**

---

## 1. Core Performance Principles

Before touching code, align on these rules:

* **Never animate node positions manually** (let d3-force own physics)
* **Freeze the simulation as early as possible**
* **Reduce draw calls per frame**
* **Cull details when zoomed out**
* **Separate runtime rendering from export logic**

Most stutter is caused by **overdraw**, not node count.

---

## 2. Force Simulation Optimization (CRITICAL)

### Aggressively stop the engine

```tsx
<ForceGraph2D
  cooldownTicks={80}
  warmupTicks={40}
  onEngineStop={() => {
    graphRef.current?.pauseAnimation()
    graphRef.current?.zoomToFit(300, 80)
  }}
/>
```

Why:

* Arkham-style graphs **do not run forces continuously**
* Once layout stabilizes, the engine should stop

---

## 3. Level-of-Detail (LOD) Rendering

### Hide labels when zoomed out (HUGE FPS win)

```ts
const showLabel = globalScale > 1.2
```

Only render:

* usernames
* label backgrounds

when zoomed in.

Arkham aggressively hides text until focus.

---

## 4. Avatar Rendering Optimization (VERY IMPORTANT)

### Problem

Calling `ctx.drawImage()` for every node on every frame is expensive.

### Solution: Offscreen Canvas Caching

Pre-render avatars **once**, reuse forever.

```ts
const avatarCache = new Map<string, HTMLCanvasElement>()

function getAvatarCanvas(img: HTMLImageElement, size: number) {
  const key = `${img.src}-${size}`
  if (avatarCache.has(key)) return avatarCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size * 2
  const ctx = canvas.getContext('2d')!

  ctx.beginPath()
  ctx.arc(size, size, size, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(img, 0, 0, size * 2, size * 2)

  avatarCache.set(key, canvas)
  return canvas
}
```

Then in render loop:

```ts
ctx.drawImage(cachedCanvas, node.x - size, node.y - size)
```

This removes repeated clipping + image decoding per frame.

---

## 5. Reduce Canvas Overdraw

### Do

* Flat colors only
* Minimal alpha blending
* Thin links

### Avoid

* Shadows
* Gradients
* Filters
* Text backgrounds when zoomed out

Canvas overdraw is the #1 silent FPS killer.

---

## 6. Lock React Re-renders

Ensure the graph component **does not re-render** after mount.

```ts
export default React.memo(ConnectionGraph)
```

Avoid:

* Inline object props
* Inline functions passed to `<ForceGraph2D />`

All graph mutations should happen via refs.

---

## 7. Device Pixel Ratio Control

High DPR destroys mobile performance.

```tsx
<ForceGraph2D dpr={window.devicePixelRatio > 1 ? 1.5 : 1} />
```

This is one of the **highest ROI tweaks** on mobile.

---

## 8. Interaction Optimization

### Disable unnecessary features

```tsx
enableNodeDrag={false}
```

Enable only if needed.

Reduce pointer hit areas where possible.

---

## 9. GSAP: Camera Polish (Recommended)

GSAP should be used **only for camera movement and UI polish**, never for node physics.

### Smooth camera focus on node

```ts
import gsap from 'gsap'

function focusNode(node) {
  const graph = graphRef.current
  if (!graph) return

  const camera = graph.camera()
  const target = {
    x: node.x,
    y: node.y,
    zoom: 3
  }

  gsap.to(camera, {
    duration: 0.8,
    x: target.x,
    y: target.y,
    zoom: target.zoom,
    ease: 'power3.out',
    onUpdate: () => graph.refresh()
  })
}
```

### Best GSAP Use Cases

* Node focus / zoom-in
* Reset view (zoomToFit replacement)
* Graph entrance animation
* Tooltip fade / scale

### Do NOT use GSAP for

* Node positions
* Edge positions
* Physics values

GSAP + d3-force = jitter.

---

### ✅ Correct GSAP Use Cases

#### Smooth camera transitions

```ts
import gsap from 'gsap'

gsap.to(camera, {
  duration: 0.8,
  zoom: 3,
  x: node.x,
  y: node.y,
  ease: 'power3.out',
  onUpdate: () => graphRef.current.camera().refresh()
})
```

#### UI polish

* Graph fade-in
* Legend animations
* Tooltip transitions

GSAP is for **UI & camera**, not simulation.

---

## 10. SVG Export via Second Render Pass (Professional Approach)

Canvas should be treated as **runtime-only**.

SVG export must be a **separate render pipeline** using frozen node positions.

### Export Flow

```txt
1. Run force simulation (Canvas)
2. Freeze layout
3. Extract node + edge positions
4. Re-render graph as SVG
```

### Example SVG Generator

```ts
function exportToSVG(nodes, links) {
  const size = 1024

  const nodeSVG = nodes.map(n => `
    <g transform="translate(${n.x}, ${n.y})">
      <circle r="18" fill="#111" stroke="#4af" stroke-width="2" />
      <text y="36" text-anchor="middle" font-size="12">${n.label}</text>
    </g>
  `).join('')

  const linkSVG = links.map(l => `
    <line x1="${l.source.x}" y1="${l.source.y}" x2="${l.target.x}" y2="${l.target.y}" stroke="#333" />
  `).join('')

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    ${linkSVG}
    ${nodeSVG}
  </svg>
  `
}
```

### Why This Works

* SVG stays sharp at any zoom
* Easy sharing / embedding
* On-chain compatible
* Deterministic output

Never attempt to convert the live canvas.

---

## 11. Priority Checklist

If you do nothing else, do these **in order**:

1. Freeze force simulation early
2. Hide labels when zoomed out
3. Cache avatars via offscreen canvas
4. Reduce DPR on mobile
5. Lock React re-renders

These alone make the graph feel **buttery smooth**.

---

## 12. Final Note

Your current architecture is **correct and scalable**.

With these optimizations, Canvas will feel:

* Stable
* Responsive
* Polished

Equivalent to what large analytics tools do **before** moving to WebGL.
