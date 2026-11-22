# Demo accounts (test data only)

All accounts share one demo password: `Demo-7Kq2xP9m`
Delete them before any real use (see the cleanup SQL at the bottom).

| Role | Email | Where to sign in |
|---|---|---|
| Admin | admin@repairhub.test | /admin-login |
| Owner, Pro, approved (John's Mobile Repair) | john@repairhub.test | /login |
| Owner, Basic, approved (Tech Hub Siniloan) | techhub@repairhub.test | /login |
| Owner, Basic, pending (Quick Fix Cellphone Care) | quickfix@repairhub.test | /login |
| Technician (John's shop) | tech@repairhub.test, tech2@repairhub.test | /login |
| Customer | customer@repairhub.test | /login |

## Cleanup
```sql
delete from auth.users where email like '%@repairhub.test';  -- cascades to profiles, shops, tickets, etc.
```
