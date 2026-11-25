# Security Specification — Meu 2027 com Propósito

## 1. Data Invariants
1. **PII Protection**: Participant registrations contain Personally Identifiable Information (`fullName`, `whatsapp`, `email`, `cityState`). Only verified administrators (`isAdmin()`) may read (`get`, `list`), update, or delete registration records. Unauthenticated visitors can only submit (`create`) their own registration.
2. **Strict Schema Enforcement**: Registration creations must contain all required fields (`fullName`, `whatsapp`, `email`, `status`, `createdAt`) and no unallowed ghost fields.
3. **Server Timestamp Integrity**: `createdAt` on create must strictly equal `request.time`.
4. **Initial State Integrity**: Publicly created registrations must start with `status == 'confirmada'` (cannot self-promote to arbitrary status values).
5. **Path ID Hardening**: All document IDs (`registrationId`, `adminId`) must match `^[a-zA-Z0-9_\\-]+$` and have length `<= 128`.
6. **Privilege Escalation Prevention**: Only existing verified admins can read, create, update, or delete `/admins/{adminId}` documents.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated List PII**: Anonymous user runs `list` on `/registrations` -> `PERMISSION_DENIED`.
2. **Unauthenticated Get PII**: Anonymous user runs `get` on `/registrations/reg_1` -> `PERMISSION_DENIED`.
3. **Non-Admin Signed-In Read PII**: Random verified Google user (not admin) reads `/registrations/reg_1` -> `PERMISSION_DENIED`.
4. **Ghost Field Injection (Shadow Write)**: Visitor creates `/registrations/reg_2` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
5. **Client-Spoofed Timestamp**: Visitor creates registration with `createdAt` set to a past client date instead of `request.time` -> `PERMISSION_DENIED`.
6. **Invalid Status on Create**: Visitor creates registration with `status: 'vip_hacked'` -> `PERMISSION_DENIED`.
7. **Resource Exhaustion (Oversized Name)**: Visitor creates registration with `fullName` of 500 characters (`> 120`) -> `PERMISSION_DENIED`.
8. **Malformed Email**: Visitor creates registration with `email: 'not-an-email'` -> `PERMISSION_DENIED`.
9. **Malformed WhatsApp**: Visitor creates registration with `whatsapp: '<script>alert(1)</script>'` -> `PERMISSION_DENIED`.
10. **Path Variable Poisoning**: Visitor creates `/registrations/bad$id..hack` -> `PERMISSION_DENIED`.
11. **Unverified Admin Email Spoof**: User with `email == 'contato.yadastudio@gmail.com'` and `email_verified == false` attempts to list `/registrations` -> `PERMISSION_DENIED`.
12. **Self-Admin Escalation**: Non-admin user writes to `/admins/{theirUid}` -> `PERMISSION_DENIED`.
