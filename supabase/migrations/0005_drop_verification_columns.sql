-- Drop columns tied to the retired email-link verification flow.
-- After the OTP rewrite (subscribe + verify-otp), no participant row is
-- created until the code is verified, so `verified` is inherently true for
-- every row and the token columns are unused.
--
-- The index on verification_token is dropped automatically with the column.

alter table public.participants
  drop column if exists verified,
  drop column if exists verified_at,
  drop column if exists verification_token,
  drop column if exists token_expires_at;
