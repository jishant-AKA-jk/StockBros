# Security Documentation

## Current Authentication Model

The application uses **Supabase Authentication** as the primary identity provider.
- Users authenticate via Supabase to receive a session token (JWT).
- Row Level Security (RLS) policies in the database restrict access to user data (`watchlist_items`, `journal_entries`) ensuring users can only read, insert, update, and delete their own records.
- API routes validate incoming data schemas using Zod and ensure valid Supabase user sessions exist before performing actions.

## Angel One Integration

The integration with the **Angel One SmartAPI** is currently designed for a **single, global administrative account**.
- API keys, Client Code, MPIN/Password, and TOTP Secrets are provided as environment variables on the backend.
- These secrets are protected by `server-only` declarations ensuring they are never exposed to the client-side bundles.
- All requests to Angel One are proxy-routed through server actions or Next.js server components.

## What's Out of Scope (For Now)

- **Per-User Broker Linking**: Users cannot currently link their own Angel One, Dhan, or other broker accounts. The data fetched is global market data fetched on behalf of the single system account.
- **Two-Factor Authentication (2FA)**: Two-factor authentication for application users via Supabase is not currently enforced or implemented.
- **Strict API Rate Limiting for Client Requests**: The current setup assumes low usage, and rate limits have not been strictly enforced on individual client actions querying market data.
- **Fine-Grained Role Based Access Control (RBAC)**: All authenticated users currently have the same base privileges.

## Future Needs for Real User Onboarding

Before opening the platform up to real users beyond close testers, the following must be changed:

1. **Broker OAuth / Multi-Tenancy**: The application must move away from environment-variable-based broker secrets to an OAuth flow where individual users authenticate and link their respective broker accounts (e.g., Angel One, Dhan, Zerodha). Broker access tokens must be stored securely per-user.
2. **Robust Rate Limiting**: Implement strict rate limiting (e.g., using Upstash/Redis) on API routes and server actions that can trigger third-party API calls, preventing malicious users from hammering the broker APIs and exhausting the application's quota.
3. **Data Segregation for API Caching**: Cache key schemas need to ensure that cached data retrieved on behalf of one user's broker token does not leak sensitive account data to another user.
4. **Enforced 2FA & Hardened Auth**: Add support for 2FA on the Supabase side for user accounts to enhance security.
5. **Periodic Security Audits**: Conduct regular audits of client bundles to ensure zero secret leakage and regular updates of third-party dependencies to patch vulnerabilities.
6. **Detailed Audit Logging**: Implement logs for critical actions like broker trades, credential updates, or large data exports.
