# MiniAppTokenizeModal Review & Improvement Plan

> **Component**: `components/graph/MiniAppTokenizeModal.tsx`
> **Date**: 2026-01-06
> **Status**: Pending Implementation

---

## Executive Summary

Comprehensive review of `MiniAppTokenizeModal.tsx` identified **17 issues** across UI, UX, wording, and architecture. This plan prioritizes fixes by critical level to ensure CLAUDE.md compliance.

---

## Priority Levels

| Level | Definition | Timeline |
|-------|------------|----------|
| **P0 - Critical** | Accessibility violations, misleading UI | Immediate |
| **P1 - High** | Poor UX, confusing wording | Next |
| **P2 - Medium** | Error recovery, edge cases | After P1 |
| **P3 - Low** | Architecture, nice-to-haves | Backlog |

---

## P0 - Critical Issues (Accessibility & Compliance)

### P0-1: Missing ARIA Attributes on Modal

**Problem**: Modal lacks proper accessibility markup. Screen readers cannot identify it as a dialog.

**Location**: Line 286-287

**Current**:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
  <div className="relative w-full max-w-sm border border-zinc-200 ...">
```

**Fix**:
```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
  role="presentation"
>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="tokenize-modal-title"
    className="relative w-full max-w-sm border border-zinc-200 ..."
  >
```

**CLAUDE.md Rule**: "Keyboard accessibility is mandatory"

---

### P0-2: Missing aria-label on Close Button

**Problem**: Close button uses icon only without accessible label.

**Location**: Line 290-295

**Current**:
```tsx
<button
  onClick={handleClose}
  className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
>
  <X size={18} />
</button>
```

**Fix**:
```tsx
<button
  onClick={handleClose}
  aria-label="Close tokenize modal"
  className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
>
  <X size={18} />
</button>
```

---

### P0-3: No Focus Trap in Modal

**Problem**: Users can tab outside the modal during interaction, breaking accessibility standards.

**Location**: Component-level

**Fix**: Add focus trap using a lightweight hook or library.

```tsx
// Add at top of component
const modalRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!isOpen) return;

  const modal = modalRef.current;
  if (!modal) return;

  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  firstElement?.focus();

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  document.addEventListener('keydown', handleTab);
  return () => document.removeEventListener('keydown', handleTab);
}, [isOpen]);
```

---

### P0-4: Progress Steps Not Accessible

**Problem**: Progress indicator uses visual-only numbers without screen reader context.

**Location**: Line 299-318

**Fix**: Add ARIA markup for step progress.

```tsx
<div
  className="mb-5 flex items-center justify-center gap-2"
  role="group"
  aria-label={`Step ${currentStepIndex + 1} of ${STEPS.length - 1}`}
>
  {STEPS.slice(0, -1).map((s, i) => (
    <div key={s.id} className="flex items-center gap-2">
      <div
        aria-current={i === currentStepIndex ? "step" : undefined}
        aria-label={`${s.label}: ${i < currentStepIndex ? 'completed' : i === currentStepIndex ? 'current' : 'pending'}`}
        className={`flex h-6 w-6 items-center justify-center text-[10px] font-bold ${
          i < currentStepIndex
            ? "bg-green-500 text-white"
            : i === currentStepIndex
            ? "bg-[#f25b28] text-white"
            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
        }`}
      >
        {i < currentStepIndex ? <Check size={12} aria-hidden="true" /> : i + 1}
      </div>
      {/* ... connector line ... */}
    </div>
  ))}
</div>
```

---

### P0-5: Registry Failure Shows Success (Misleading UI)

**Problem**: If registry fails, user sees "success" but coin isn't registered. This violates CLAUDE.md rule: "If the UI can mislead a user, it is a bug."

**Location**: Line 229-231

**Current**:
```tsx
if (registryError) {
  setStep("success"); // Silent failure - misleading!
}
```

**Fix**: Show partial success with warning.

```tsx
// Add new state
const [registryFailed, setRegistryFailed] = useState(false);

// Update error handler
if (registryError) {
  setRegistryFailed(true);
  setStep("success"); // Still proceed but flag the issue
}

// In success UI, show warning if registry failed
{step === "success" && (
  <div className="space-y-4 text-center">
    {/* ... existing success content ... */}

    {registryFailed && (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-3 text-left dark:bg-amber-900/20 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Coin created but registry failed. Your coin works but won't appear in the gallery.
        </p>
      </div>
    )}
  </div>
)}
```

---

## P1 - High Priority (UX & Wording)

### P1-1: Vague Processing Messages

**Problem**: Users don't understand what's happening during each phase.

**Location**: Line 361-366

**Current vs Fixed**:

| Step | Current | Fixed |
|------|---------|-------|
| Payment (pending) | "Confirm in wallet" | "Confirm fee payment in wallet" |
| Payment (processing) | "Processing..." | "Confirming payment..." |
| Uploading | "Uploading..." | "Uploading to IPFS..." |
| Creating (pending) | "Confirm in wallet" | "Confirm coin creation in wallet" |
| Creating (processing) | "Creating..." | "Creating coin on Zora..." |
| Registering (pending) | "One more..." | "Final step: Confirm registration" |
| Registering (processing) | "Registering..." | "Registering in gallery..." |

**Implementation**:
```tsx
{isProcessing && (
  <div className="space-y-4 py-4 text-center">
    <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#f25b28]" />
    <h2 className="text-base font-bold">
      {step === "payment" && (isFeePending ? "Confirm fee payment" : "Confirming payment...")}
      {step === "uploading" && "Uploading to IPFS..."}
      {step === "creating" && (isCoinPending ? "Confirm coin creation" : "Creating coin on Zora...")}
      {step === "registering" && (isRegistryPending ? "Final step: confirm registration" : "Registering in gallery...")}
    </h2>
    <p className="text-xs text-zinc-500">
      {step === "payment" && "This covers the platform fee"}
      {step === "uploading" && "Storing your graph image"}
      {step === "creating" && "Deploying your coin contract"}
      {step === "registering" && "Adding to the gallery"}
    </p>
  </div>
)}
```

---

### P1-2: Generic Error Message

**Problem**: "Failed" doesn't tell user what failed.

**Location**: Line 414

**Fix**: Show contextual error title.

```tsx
// Add helper to determine error context
const getErrorTitle = () => {
  if (feeError) return "Payment Failed";
  if (coinError) return "Coin Creation Failed";
  return "Transaction Failed";
};

// Update error UI
{step === "error" && (
  <div className="space-y-4 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-red-500">
      <AlertCircle className="h-6 w-6 text-white" />
    </div>
    <h2 className="text-base font-bold">{getErrorTitle()}</h2>
    <p className="text-sm text-red-500">{error}</p>
    {/* ... buttons ... */}
  </div>
)}
```

---

### P1-3: Success Message Assumes Registry Success

**Problem**: "Live on Zora!" displays even if registry failed.

**Location**: Line 376

**Fix**:
```tsx
<h2 className="text-base font-bold">
  {registryFailed ? "Coin Created" : "Live on Zora!"}
</h2>
```

---

### P1-4: Modal Title Needs ID for ARIA

**Problem**: `aria-labelledby` needs a matching element ID.

**Location**: Line 323

**Fix**:
```tsx
<h2 id="tokenize-modal-title" className="text-center text-base font-bold">
  Tokenize Graph
</h2>
```

Apply same pattern to all step titles.

---

## P2 - Medium Priority (Error Recovery & Edge Cases)

### P2-1: Retry After Payment Loss

**Problem**: If creation fails after payment, user clicks "Retry" and must pay again. Fee is lost.

**Location**: Line 424-428

**Current Behavior**: Retry resets to preview, requiring new payment.

**Fix Options**:

**Option A (Recommended)**: Track payment state and resume from upload
```tsx
const [feePaid, setFeePaid] = useState(false);

// After fee confirmed
useEffect(() => {
  if (isFeeConfirmed) {
    setFeePaid(true);
  }
}, [isFeeConfirmed]);

// Update retry handler
const handleRetry = () => {
  setError(null);
  if (feePaid) {
    // Resume from upload if already paid
    handleUploadAndCreate();
  } else {
    setStep("preview");
  }
};
```

**Option B**: Show warning about lost fee
```tsx
<button
  onClick={() => {
    setError(null);
    setStep("preview");
  }}
  className="flex-1 bg-[#f25b28] py-2.5 text-xs font-medium uppercase tracking-wide text-white"
>
  {feePaid ? "Retry (No Additional Fee)" : "Retry"}
</button>
```

---

### P2-2: No Transaction Hash Display

**Problem**: Users can't verify transactions on explorer during pending states.

**Location**: Processing steps

**Fix**: Show truncated hash with explorer link.

```tsx
{isProcessing && (
  <div className="space-y-4 py-4 text-center">
    {/* ... existing loader and title ... */}

    {(feeHash || coinHash) && (
      <p className="font-mono text-xs text-zinc-500">
        {feeHash && step === "payment" && (
          <>Tx: {feeHash.slice(0, 8)}...{feeHash.slice(-6)}</>
        )}
        {coinHash && step === "creating" && (
          <>Tx: {coinHash.slice(0, 8)}...{coinHash.slice(-6)}</>
        )}
      </p>
    )}
  </div>
)}
```

---

### P2-3: No Cancel During Upload

**Problem**: Once upload starts, there's no way to cancel (user might realize they made a mistake).

**Recommendation**: This is acceptable behavior since:
1. Upload to IPFS is fast
2. User already confirmed intent
3. Adding cancel complexity may not be worth it

**Status**: Won't fix (acceptable UX tradeoff)

---

## P3 - Low Priority (Architecture & Polish)

### P3-1: Business Logic in UI Component

**Problem**: Component contains tokenization workflow logic (upload → create → register). Per CLAUDE.md architecture rules, this should be in a use-case layer.

**Location**: Lines 120-168, 178-210

**Recommendation**: Extract to `lib/tokenize/useTokenizeWorkflow.ts` hook that encapsulates:
- Step management
- IPFS upload orchestration
- Transaction sequencing
- Error handling

**Impact**: Improves testability and separation of concerns.

**Status**: Backlog (refactor when touching this code next)

---

### P3-2: Disabled Button Styling

**Problem**: Buttons during processing don't have visual disabled state.

**Impact**: Minor - buttons are hidden during processing, so this is informational.

**Status**: Won't fix (not visible to users)

---

### P3-3: Step Indicator Mismatch

**Problem**: UI shows 3 steps but internal state has 6 states.

**Analysis**: Current implementation maps multiple internal states to "Create" step visually. This is actually correct UX - users don't need to see uploading/registering as separate steps.

**Status**: Won't fix (current behavior is correct)

---

## Implementation Checklist

### Phase 1: Critical Fixes
- [ ] P0-1: Add ARIA attributes to modal
- [ ] P0-2: Add aria-label to close button
- [ ] P0-3: Implement focus trap
- [ ] P0-4: Add ARIA to progress steps
- [ ] P0-5: Handle registry failure with warning

### Phase 2: UX Improvements
- [ ] P1-1: Update all processing messages
- [ ] P1-2: Contextual error titles
- [ ] P1-3: Conditional success message
- [ ] P1-4: Add IDs for aria-labelledby

### Phase 3: Error Recovery
- [ ] P2-1: Smart retry after payment
- [ ] P2-2: Show transaction hashes

### Phase 4: Backlog
- [ ] P3-1: Extract business logic to hook

---

## Files to Modify

| File | Changes |
|------|---------|
| `components/graph/MiniAppTokenizeModal.tsx` | All fixes |

---

## Testing Checklist

- [ ] Screen reader announces modal correctly
- [ ] Tab navigation stays within modal
- [ ] Escape key works in allowed states
- [ ] All processing messages are clear
- [ ] Registry failure shows warning
- [ ] Error recovery works after payment
- [ ] Mobile layout unchanged

---

## Approval

- [ ] Plan reviewed
- [ ] Priority order confirmed
- [ ] Ready for implementation
