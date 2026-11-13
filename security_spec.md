# Security Specification & Red Team Audit — Sobur Ali Khan Portfolio

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every undefined path defaults to `allow read, write: if false;`.
2. **Owner/Admin Isolation (Zero Client Claims)**: Only verified owner emails (`gpthorof@gmail.com`, `sobur@owner.com` with `email_verified == true`) or UIDs registered in `/admins/{uid}` may mutate public portfolio collections, site configuration, or read/manage PII submissions.
3. **Draft Content Protection**: Non-published documents (`status == 'draft'` or `'archived'`) are strictly unreadable by public visitors (`resource.data.status == 'published'`).
4. **PII Split & Strict Write Boundaries**:
   - `/student_registrations`, `/collaboration_inquiries`, and `/contact_messages` contain visitor PII (`email`, `phone`, `fullName`).
   - Visitors may ONLY `create` a valid initial submission (`status == 'pending' | 'new' | 'unread'`). Visitors can NEVER `get`, `list`, `update`, or `delete` any submission.
5. **Path & Payload Hardening**:
   - All document IDs are validated with `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
   - Every string field enforces `.size()` limits; every list enforces `.size() <= MAX`; every `create` enforces `hasAll(...) && hasOnly(...)`; every `update` enforces `isValid[Entity](incoming())` + `affectedKeys().hasOnly(...)` + immutable `ownerId` and `createdAt`.
   - Cost optimization: `allow list` never invokes `get()` or `exists()`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Unauthenticated Portfolio Write**: Anonymous `create` on `/portfolio_projects/hack-1` -> `PERMISSION_DENIED`.
2. **Unverified Admin Email Spoof**: User with `email: "gpthorof@gmail.com"` and `email_verified: false` attempts `update` on `/courses/course-1` -> `PERMISSION_DENIED`.
3. **Self-Assigned Admin Escalation**: Non-admin user attempts `set` on `/admins/<their_uid>` with `role: "owner"` -> `PERMISSION_DENIED`.
4. **Draft Data Scraping**: Anonymous visitor attempts `get` or `list` on `/portfolio_projects` where `status == "draft"` -> `PERMISSION_DENIED`.
5. **PII Collection Read / List Leak**: Authenticated non-owner visitor attempts `get` or `list` on `/student_registrations` or `/contact_messages` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection ("Ghost Key")**: Visitor submits `/contact_messages/msg-1` including extra field `isAdmin: true` -> `PERMISSION_DENIED` (`hasOnly` rejection).
7. **Status Shortcutting on Submission**: Visitor submits `/student_registrations/reg-1` with pre-approved `status: "approved"` -> `PERMISSION_DENIED` (must equal `"pending"`).
8. **ID Poisoning**: Write attempt with 300-character or path-traversal ID `../../etc/passwd` -> `PERMISSION_DENIED` (`isValidId` rejection).
9. **Resource Exhaustion / Denial of Wallet**: Visitor submits `/contact_messages/msg-2` with 20,000-char message -> `PERMISSION_DENIED` (`message.size() <= 4000`).
10. **Type Poisoning on Update**: Owner or user sends `featured: "yes"` (string instead of bool) on `/portfolio_projects/proj-1` -> `PERMISSION_DENIED` (`isValidPortfolioProject` check).
11. **OwnerId Hijack on Update**: Admin/user attempts to mutate `ownerId` or `createdAt` during `update` -> `PERMISSION_DENIED` (immortality check + `affectedKeys().hasOnly(...)`).
12. **Terminal State / Client-Side Submission Tampering**: Visitor attempts `update` or `delete` on `/collaboration_inquiries/inq-1` -> `PERMISSION_DENIED`.
