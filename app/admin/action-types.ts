export type AdminActionResult =
    | { ok: true }
    | {
          ok: false;
          reason:
              | 'invalid_input'
              | 'not_found'
              | 'primary_admin_protected'
              | 'last_admin_protected'
              | 'self_protected';
          message: string;
      };

