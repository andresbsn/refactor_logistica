const db = require('../config/db');

const TABLE_NAME = 'integration_tokens';
let tableReadyPromise = null;

const ensureTable = async () => {
    if (!tableReadyPromise) {
        tableReadyPromise = db.query(`
            CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
                provider text PRIMARY KEY,
                access_token text NOT NULL,
                token_type text,
                scope text,
                expires_at timestamptz NOT NULL,
                metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
                created_at timestamptz NOT NULL DEFAULT now(),
                updated_at timestamptz NOT NULL DEFAULT now()
            )
        `);
    }

    await tableReadyPromise;
};

const findByProvider = async (provider) => {
    await ensureTable();

    const { rows } = await db.query(
        `SELECT provider, access_token, token_type, scope, expires_at, metadata, created_at, updated_at
         FROM ${TABLE_NAME}
         WHERE provider = $1`,
        [provider]
    );

    return rows[0] || null;
};

const upsert = async ({ provider, accessToken, tokenType, scope, expiresAt, metadata = {} }) => {
    await ensureTable();

    const { rows } = await db.query(
        `INSERT INTO ${TABLE_NAME} (
            provider,
            access_token,
            token_type,
            scope,
            expires_at,
            metadata,
            created_at,
            updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, now(), now())
        ON CONFLICT (provider)
        DO UPDATE SET
            access_token = EXCLUDED.access_token,
            token_type = EXCLUDED.token_type,
            scope = EXCLUDED.scope,
            expires_at = EXCLUDED.expires_at,
            metadata = EXCLUDED.metadata,
            created_at = EXCLUDED.created_at,
            updated_at = now()
        RETURNING provider, access_token, token_type, scope, expires_at, metadata, created_at, updated_at`,
        [provider, accessToken, tokenType || null, scope || null, expiresAt, JSON.stringify(metadata)]
    );

    return rows[0];
};

module.exports = {
    findByProvider,
    upsert,
};
