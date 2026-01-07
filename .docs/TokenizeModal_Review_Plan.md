# TokenizeModal Review & Improvement Plan

> **Component**: `components/graph/TokenizeModal.tsx`
> **Date**: 2026-01-06
> **Status**: Pending Implementation
> **Related**: Aligns with `MiniAppTokenizeModal.tsx` improvements

---

## Executive Summary

Comprehensive review of `TokenizeModal.tsx` identified **14 issues** across UI, UX, wording, and accessibility. This plan aligns the desktop modal with the recently updated `MiniAppTokenizeModal.tsx` to ensure consistency.

---

## Priority Levels

| Level | Definition | Timeline |
|-------|------------|----------|
| **P0 - Critical** | Accessibility violations, CLAUDE.md non-compliance | Immediate |
| **P1 - High** | Poor UX, confusing wording | Next |
| **P2 - Medium** | Error recovery, transaction visibility | After P1 |

---

## P0 - Critical Issues (Accessibility)

### P0-1: Missing ARIA Attributes on Modal

**Problem**: Modal lacks proper accessibility markup for screen readers.

**Location**: Line 302-303

**Current**:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
  <div className="relative w-full max-w-md border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
```

**Fix**:
```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  role="presentation"
>
  <div
    ref={modalRef}
    role="dialog"
    aria-modal="true"
    aria-labelledby="tokenize-modal-title"
    className="relative w-full max-w-md border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
  >
```

---

### P0-2: Missing aria-label on Close Button

**Problem**: Close button uses icon only without accessible label.

**Location**: Line 306-311

**Current**:
```tsx
<button
  onClick={handleClose}
  className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
>
  <X size={20} />
</button>
```

**Fix**:
```tsx
<button
  onClick={handleClose}
  aria-label="Close tokenize modal"
  className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
>
  <X size={20} aria-hidden="true" />
</button>
```

---

### P0-3: No Focus Trap in Modal

**Problem**: Users can tab outside the modal during interaction.

**Location**: Component-level

**Fix**: Add `modalRef` and focus trap effect (same as MiniAppTokenizeModal):

```tsx
// Add ref
const modalRef = useRef<HTMLDivElement>(null);

// Add effect after escape handler
useEffect(() => {
  if (!isOpen) return;

  const modal = modalRef.current;
  if (!modal) return;

  const focusableElements = modal.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  setTimeout(() => firstElement?.focus(), 0);

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  document.addEventListener("keydown", handleTab);
  return () => document.removeEventListener("keydown", handleTab);
}, [isOpen, step]);
```

---

### P0-4: Progress Steps Not Accessible

**Problem**: Progress indicator uses visual-only numbers without screen reader context.

**Location**: Line 315-340

**Fix**:
```tsx
<div
  className="mb-6 flex items-center justify-between pr-8"
  role="group"
  aria-label={`Step ${currentStepIndex + 1} of ${STEPS.length - 1}`}
>
  {STEPS.slice(0, -1).map((s, i) => (
    <div key={s.id} className="flex items-center">
      <div
        aria-current={i === currentStepIndex ? "step" : undefined}
        aria-label={`${s.label}: ${i < currentStepIndex ? "completed" : i === currentStepIndex ? "current" : "pending"}`}
        className={`flex h-6 w-6 items-center justify-center border text-[10px] font-medium sm:h-8 sm:w-8 sm:text-xs ${...}`}
      >
        {i < currentStepIndex ? <Check size={12} className="sm:h-3.5 sm:w-3.5" aria-hidden="true" /> : i + 1}
      </div>
      {i < STEPS.length - 2 && (
        <div
          className={`hidden h-px w-4 sm:block sm:w-8 ${...}`}
          aria-hidden="true"
        />
      )}
    </div>
  ))}
</div>
```

---

### P0-5: Icons Missing aria-hidden

**Problem**: Decorative icons are announced by screen readers.

**Locations**: Lines 397, 412, 423, 438, 454, 464, 506, 508, 530, 541

**Fix**: Add `aria-hidden="true"` to all decorative `Loader2`, `Check`, `AlertCircle`, `ExternalLink`, `Copy` icons.

---

## P1 - High Priority (UX & Wording)

### P1-1: Differentiate "Check your wallet" Messages

**Problem**: Same message used for payment and coin creation - confusing.

**Current vs Fixed**:

| Step | Current | Fixed |
|------|---------|-------|
| Payment (pending) | "Check your wallet" | "Confirm fee payment" |
| Payment (confirming) | "Sending fee..." | "Confirming payment..." |
| Creating (pending) | "Check your wallet" | "Confirm coin creation" |
| Creating (confirming) | "Minting your coin..." | "Creating coin on Zora..." |
| Registering (pending) | "One more signature" | "Final step: confirm registration" |
| Registering (confirming) | "Adding to gallery..." | "Registering in gallery..." |

---

### P1-2: Generic Error Title

**Problem**: "Something Went Wrong" doesn't tell user what failed.

**Location**: Line 543

**Fix**: Add contextual error title helper:

```tsx
const getErrorTitle = () => {
  if (feeError) return "Payment Failed";
  if (coinError) return "Coin Creation Failed";
  return "Transaction Failed";
};

// In error step:
<h2 className="text-xl font-bold">{getErrorTitle()}</h2>
```

---

### P1-3: Add Title IDs for aria-labelledby

**Problem**: `aria-labelledby="tokenize-modal-title"` needs matching element IDs.

**Fix**: Add `id="tokenize-modal-title"` to each step's title `<h2>` or `<p>` element.

---

### P1-4: Copy Button Accessibility

**Problem**: Uses `title` attribute instead of `aria-label`.

**Location**: Line 500-510

**Fix**:
```tsx
<button
  onClick={handleCopy}
  aria-label={copied ? "Link copied" : "Copy link"}
  className="..."
>
  {copied ? (
    <Check size={14} className="text-green-500" aria-hidden="true" />
  ) : (
    <Copy size={14} aria-hidden="true" />
  )}
</button>
```

---

## P2 - Medium Priority (Error Recovery)

### P2-1: Smart Retry After Payment Loss

**Problem**: If creation fails after payment, user clicks "Try Again" and must pay again.

**Location**: Line 554-556

**Fix**: Add `feePaid` state tracking (same as MiniAppTokenizeModal):

```tsx
// Add state
const [feePaid, setFeePaid] = useState(false);

// Track in fee confirmation effect
useEffect(() => {
  if (isFeeConfirmed && step === "payment") {
    setFeePaid(true);
    handleUploadAndCreate();
  }
}, [isFeeConfirmed, step, handleUploadAndCreate]);

// Update retry handler
onClick={() => {
  setError(null);
  if (feePaid) {
    handleUploadAndCreate();
  } else {
    setStep("preview");
  }
}}

// Update button text
{feePaid ? "Retry (No Fee)" : "Try Again"}

// Reset on close
setFeePaid(false);
```

---

### P2-2: Transaction Hash Display

**Problem**: Users can't verify transactions on explorer during pending states.

**Fix**: Add transaction hash display in processing steps:

```tsx
{/* In Payment step */}
{feeHash && !isFeePending && (
  <p className="font-mono text-xs text-zinc-400">
    Tx: {feeHash.slice(0, 8)}...{feeHash.slice(-6)}
  </p>
)}

{/* In Creating step */}
{coinHash && !isCoinPending && (
  <p className="font-mono text-xs text-zinc-400">
    Tx: {coinHash.slice(0, 8)}...{coinHash.slice(-6)}
  </p>
)}
```

---

## Implementation Checklist

### Phase 1: Critical Fixes (P0)
- [ ] P0-1: Add ARIA attributes to modal container
- [ ] P0-2: Add aria-label to close button
- [ ] P0-3: Implement focus trap
- [ ] P0-4: Add ARIA to progress steps
- [ ] P0-5: Add aria-hidden to all decorative icons

### Phase 2: UX Improvements (P1)
- [ ] P1-1: Differentiate wallet confirmation messages
- [ ] P1-2: Add contextual error titles
- [ ] P1-3: Add IDs for aria-labelledby references
- [ ] P1-4: Fix copy button accessibility

### Phase 3: Error Recovery (P2)
- [ ] P2-1: Implement smart retry with feePaid tracking
- [ ] P2-2: Add transaction hash display

---

## Files to Modify

| File | Changes |
|------|---------|
| `components/graph/TokenizeModal.tsx` | All fixes |

---

## State Additions Required

```tsx
// New state variables
const [feePaid, setFeePaid] = useState(false);
const modalRef = useRef<HTMLDivElement>(null);
```

---

## Testing Checklist

- [ ] Screen reader announces modal correctly
- [ ] Tab navigation stays within modal
- [ ] Escape key works in allowed states
- [ ] All processing messages are clear and distinct
- [ ] Error recovery works after payment
- [ ] Copy button announces state changes
- [ ] Desktop and mobile layouts unchanged
- [ ] Consistent behavior with MiniAppTokenizeModal

---

## Consistency Check

After implementation, both modals should have:
- ✅ ARIA attributes on modal
- ✅ Focus trap
- ✅ Accessible progress steps
- ✅ Clear, contextual processing messages
- ✅ Smart retry with fee tracking
- ✅ Transaction hash display
- ✅ Contextual error titles

---

## Approval

- [ ] Plan reviewed
- [ ] Priority order confirmed
- [ ] Ready for implementation
