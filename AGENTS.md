<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Resolve tenant identity server-side from authenticated membership for admin work and from active business slug for public work; never trust a client-supplied `business_id`.
- Keep `business_id` nullable until the dedicated schema-hardening phase, preserving compatibility while all current reads and writes are tenant-scoped.
- Use the authenticated request client for membership resolution and ordinary admin operations so tenant RLS applies; privileged checkout writes remain behind server validation.
- Keep RLS membership helpers in the non-API app_private schema with fixed search paths to avoid recursion and direct RPC exposure.
