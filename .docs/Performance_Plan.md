# Graph Performance Optimization Plan

## Status: COMPLETED

All optimizations implemented on 2025-12-29.

---

## Implementation Summary

| Optimization | Doc Section | Status | Line # |
|--------------|-------------|--------|--------|
| Offscreen avatar canvas cache | §4 | **DONE** | 44-86 |
| LOD - Hide labels when zoomed out | §3 | **DONE** | 104, 305-327 |
| DPR control for mobile | §7 | **DONE** | 106-110, 434 |
| React.memo wrapper | §6 | **DONE** | 458 |
| pauseAnimation on engine stop | §2 | **DONE** | 344-373 |
| GSAP camera transitions | §9 | **DONE** | 218-248, 354-372 |
| Reduce cooldownTicks (150 → 80) | §2 | **DONE** | 428 |
| Reduce warmupTicks (50 → 40) | §2 | **DONE** | 429 |
| Disable node drag | §8 | **DONE** | 431 |
| Stabilize inline functions | §6 | **DONE** | 99-101, 332-342 |

---

## What Was Implemented

### Phase 1: Critical Performance

#### 1.1 Offscreen Canvas Avatar Cache
```ts
// Cache for pre-rendered circular avatar canvases
const avatarCanvasCache = new Map<string, HTMLCanvasElement>();

function getAvatarCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const key = `${img.src}-${size}`;
  if (avatarCanvasCache.has(key)) {
    return avatarCanvasCache.get(key)!;
  }
  // Pre-render clipped avatar ONCE
  const canvas = document.createElement("canvas");
  ctx.arc(size, size, size, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 0, 0, diameter, diameter);
  avatarCanvasCache.set(key, canvas);
  return canvas;
}
```

#### 1.2 LOD Rendering
```ts
const LOD_LABEL_THRESHOLD = 1.2;

// In nodeCanvasObject:
if (globalScale > LOD_LABEL_THRESHOLD) {
  // Only draw labels when zoomed in
}
```

#### 1.3 DPR Control
```ts
const getOptimalDPR = () => {
  if (typeof window === "undefined") return 1;
  return window.devicePixelRatio > 1 ? 1.5 : 1;
};

<ForceGraph2D devicePixelRatio={dpr} />
```

---

### Phase 2: React Optimizations

#### 2.1 React.memo
```ts
export default React.memo(ConnectionGraph);
```

#### 2.2 Stabilized Callbacks
```ts
// Stable link color (not inline)
const LINK_COLOR = "rgba(113, 113, 122, 0.2)";
const getLinkColor = () => LINK_COLOR;

// Stable pointer area paint
const nodePointerAreaPaint = useCallback(...);
```

---

### Phase 3: Simulation Tuning

#### 3.1 Optimized Force Settings
```ts
cooldownTicks={80}   // was 150
warmupTicks={40}     // was 50
```

#### 3.2 Pause on Engine Stop
```ts
const handleEngineStop = useCallback(() => {
  graph.pauseAnimation();  // Critical for CPU idle
  // GSAP smooth zoom to fit
  gsap.to(camera, { ... });
}, []);
```

---

### Phase 4: Polish

#### 4.1 GSAP Camera Transitions

**On Node Click** - Smooth zoom to node before opening profile:
```ts
gsap.to(camera, {
  duration: 0.6,
  x: node.x,
  y: node.y,
  zoom: 2.5,
  ease: "power2.out",
  onUpdate: () => {
    graph.centerAt(camera.x, camera.y);
    graph.zoom(camera.zoom);
  },
  onComplete: () => {
    window.open(`${URLS.warpcast}/${node.username}`, "_blank");
  },
});
```

**On Engine Stop** - Smooth zoom to fit:
```ts
gsap.to(camera, {
  duration: 0.5,
  zoom: 0.9,
  x: 0,
  y: 0,
  ease: "power2.out",
  onUpdate: () => {
    graph.centerAt(camera.x, camera.y);
    graph.zoom(camera.zoom);
  },
});
```

#### 4.2 Node Drag Disabled
```ts
enableNodeDrag={false}
```

---

## Performance Gains

| Metric | Before | After |
|--------|--------|-------|
| Avatar render cost | clip() per frame | Single drawImage() |
| Label draws (zoomed out) | 100/frame | 0/frame |
| Mobile pixel count | 9x (3x DPR) | 2.25x (1.5x DPR) |
| CPU after layout | Active | Idle (paused) |
| Camera feel | Instant jumps | Smooth GSAP easing |

---

## Files Modified

1. `components/dashboard/ConnectionGraph.tsx` - All optimizations

---

## Tuning Notes

- **LOD_LABEL_THRESHOLD**: Currently `1.2`. Increase if labels appear too late, decrease if they cause stutter.
- **DPR**: Currently `1.5`. Can increase to `2` if devices have sufficient GPU headroom.
- **cooldownTicks**: Currently `80`. Can reduce further if layout stabilizes faster.

---

## Reference

See `.docs/performance_opt.md` for the original optimization guide.
