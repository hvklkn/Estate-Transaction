# Stage Policy Module

Purpose:
- Centralize allowed transaction stage transitions.
- Centralize stage lifecycle rules used during both creation and stage updates.

Guideline:
- Keep stage transition policy in one service/policy layer.
- Controllers should delegate validation to this module.
- New transactions can only start at `agreement`.
- Allowed order: `agreement` -> `earnest_money` -> `title_deed` -> `completed`.
- `completed` is terminal and cannot transition further.
- Rejected: skipped stages, backward moves, and same-stage updates.
