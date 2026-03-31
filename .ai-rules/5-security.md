# Security rules

- Contraseñas:
  - hash bcrypt (cost razonable).
- JWT:
  - exp corto + refresh si aplica.
- CORS:
  - permitir solo origins necesarios.
- Rate limiting:
  - login y endpoints sensibles.
- Sanitización:
  - siempre queries parametrizadas (evitar SQL injection).
- Secrets:
  - nunca commitear .env con credenciales reales.