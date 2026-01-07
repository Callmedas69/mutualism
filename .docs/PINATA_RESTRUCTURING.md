# Mutualism – Pinata Restructuring & History Index Plan

> **Purpose**
> Lock a clean, non-analytic foundation for Mutualism snapshots, history, and future minting.
>
> This document defines **how snapshots are stored, named, indexed, and retrieved** without introducing scores, rankings, or behavioral analytics.

---

## Core Principles (Non‑Negotiable)

* **A snapshot is immutable**
  If anything changes, it is a new snapshot.

* **The PNG is the truth**
  History stores what the user *saw*, not how it was computed.

* **Pinata stores artifacts**
  The database stores pointers.

* **History is a gallery, not analytics**
  No metrics, no deltas, no explanations.

---

## Part 1 — Pinata Restructuring

### 1. Folder‑Per‑Snapshot (Required)

Each snapshot **must live in its own folder**.

**Rule**

```
1 snapshot = 1 folder = 1 PNG + 1 JSON
```

No shared folders. No overwrites. No reuse.

---

### 2. Folder Naming Convention (Locked)

```
{view}_fid{FID}_{timeWindow}_{ISO-datetime}
```

**Examples**

```
mutual-circle_fid22420_last30d_2026-01-05T18-42
attention-circle_fid22420_last30d_2026-01-05T18-45
```

**Allowed views**

* `mutual-circle`
* `attention-circle`
* `influence-circle`

---

### 3. Folder Contents (Strict)

Inside each snapshot folder:

```
/
 ├─ image.png
 └─ metadata.json
```

**Rules**

* Always exactly one PNG
* Always exactly one JSON
* No extra files
* Never overwrite

---

### 4. PNG Rules

* Filename inside folder is always:

```
image.png
```

Why:

* Identity lives in the folder name
* PNG stays a pure artifact
* No duplicated naming logic

---

### 5. Metadata Structure (v1 Locked)

`metadata.json`

```json
{
  "name": "Mutual Circle of @0xd",
  "description": "A snapshot of real interactions on Farcaster, showing the people @0xd actually interacts with.",
  "image": "ipfs://<PNG_CID>",
  "properties": {
    "category": "mutualism",
    "fid": 22420,
    "view": "mutual_circle",
    "timeWindow": "last_30d",
    "generatedAt": "2026-01-05T18:42:00Z",
    "graphVersion": "v1",
    "source": "Quotient API"
  }
}
```

**Explicitly forbidden fields**

* `nodeCount`
* totals
* rankings
* scores
* hidden lists

> **Rule**: If it’s not visible in the PNG, it does not belong in metadata.

---

### 6. Existing Pins Policy

* ❌ Do **not** delete existing pins
* Treat them as **legacy (v0)**
* Apply this structure **only going forward**

History does not require cleanup — it requires **consistency from now on**.

---

## Part 2 — Database (Snapshot Index Only)

The database is **not** a computation layer.
It is a **pointer index**.

---

### Minimal Table Schema

```ts
SnapshotIndex {
  snapshot_id     // uuid
  user_fid        // number
  view            // mutual_circle | attention_circle | influence_circle
  time_window     // last_7d | last_30d | all_time
  cid             // IPFS CID (folder or metadata CID)
  generated_at    // timestamp
  graph_version   // v1
}
```

That’s it.

---

### What the DB Must NEVER Store

* Node lists
* Interaction counts
* Scores
* Rankings
* Deltas
* Explanations

If users cannot *see* it in the image, it must not exist in the DB.

---

## Part 3 — How History Works (Later)

> History is **not shipped yet**.
> This plan prepares for it without exposing it.

### Flow

1. Snapshot generated
2. Folder uploaded to Pinata
3. CID returned
4. One row inserted into `SnapshotIndex`

### When History UI is added

* Query DB by `user_fid`
* Order by `generated_at`
* Render thumbnails via IPFS

No recomputation. No comparison logic.

---

## Operational Rules (Write These in Code Comments)

```txt
- A snapshot is immutable
- If anything changes, it is a new snapshot
- Pinata stores artifacts
- The database stores pointers
- History is a gallery, not analytics
```

---

## Final Checklist

### Pinata

* [ ] Folder per snapshot
* [ ] PNG + JSON in same folder
* [ ] Strict naming convention
* [ ] Stop using generic names (graph.png, metadata.json alone)

### Database

* [ ] Create SnapshotIndex table
* [ ] Store only pointers + context
* [ ] Do not expose History UI yet

---

## Final Note

This structure ensures Mutualism remains:

* observational
* human‑scale
* non‑toxic
* future‑proof

Once this is in place, history, minting, and provenance become **inevitable**, not forced.
