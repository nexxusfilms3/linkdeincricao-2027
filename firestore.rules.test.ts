/**
 * Security Rules Verification Suite (Dirty Dozen Adversarial Payloads)
 * Reference specification for /registrations and /admins collections.
 */

export const DIRTY_DOZEN_CASES = [
  {
    name: '1. Unauthenticated list on /registrations',
    expected: 'PERMISSION_DENIED',
    reason: 'allow list requires isAdmin()',
  },
  {
    name: '2. Unauthenticated get on /registrations/{id}',
    expected: 'PERMISSION_DENIED',
    reason: 'allow get requires isAdmin()',
  },
  {
    name: '3. Non-admin verified user read on /registrations/{id}',
    expected: 'PERMISSION_DENIED',
    reason: 'PII restricted strictly to bootstrapped or registered admins',
  },
  {
    name: '4. Ghost field injection on create (isAdmin: true)',
    expected: 'PERMISSION_DENIED',
    reason: 'isValidRegistration enforces keys().hasOnly(...)',
  },
  {
    name: '5. Client-spoofed createdAt timestamp',
    expected: 'PERMISSION_DENIED',
    reason: 'allow create requires incoming().createdAt == request.time',
  },
  {
    name: '6. Invalid status on create (status: "vip_hacked")',
    expected: 'PERMISSION_DENIED',
    reason: 'allow create enforces incoming().status == "confirmada"',
  },
  {
    name: '7. Oversized fullName (> 120 chars)',
    expected: 'PERMISSION_DENIED',
    reason: 'isValidRegistration enforces fullName.size() <= 120',
  },
  {
    name: '8. Malformed email string',
    expected: 'PERMISSION_DENIED',
    reason: 'isValidRegistration enforces email regex',
  },
  {
    name: '9. Script injection in whatsapp field',
    expected: 'PERMISSION_DENIED',
    reason: 'isValidRegistration enforces whatsapp numeric/phone regex',
  },
  {
    name: '10. Invalid document ID containing special characters',
    expected: 'PERMISSION_DENIED',
    reason: 'isValidId enforces ^[a-zA-Z0-9_\\-]+$',
  },
  {
    name: '11. Admin email spoof with email_verified == false',
    expected: 'PERMISSION_DENIED',
    reason: 'isVerifiedUser enforces request.auth.token.email_verified == true',
  },
  {
    name: '12. Privilege escalation write to /admins/{uid}',
    expected: 'PERMISSION_DENIED',
    reason: 'allow create on /admins requires isAdmin()',
  },
] as const;
