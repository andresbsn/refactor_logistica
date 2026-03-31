const tokenRepository = require('../repositories/token.repository');

const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;
const DEFAULT_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const YPF_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const CORDOBA_TIME_ZONE = 'America/Argentina/Cordoba';
const TIMESTAMP_WITH_TIMEZONE_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;
const TIMESTAMP_WITHOUT_TIMEZONE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

const PROVIDERS = {
    locationWorldAuth0: 'location_world_auth0',
    ypf: 'ypf_access_token',
    locationWorldSession: 'location_world_session',
};

const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const toExpiryDate = (expiresInSeconds) => new Date(Date.now() + (Number(expiresInSeconds) || DEFAULT_TOKEN_TTL_SECONDS) * 1000);

const getTokenCreatedAtMs = (tokenRow) => (tokenRow?.created_at ? new Date(tokenRow.created_at).getTime() : null);

const getTokenExpiresAtMs = (tokenRow) => (tokenRow?.expires_at ? new Date(tokenRow.expires_at).getTime() : null);

const shouldRefreshToken = (tokenRow) => {
    if (!tokenRow || !tokenRow.access_token || !tokenRow.expires_at || !tokenRow.created_at) {
        return true;
    }

    const createdAtMs = getTokenCreatedAtMs(tokenRow);
    const expiresAtMs = getTokenExpiresAtMs(tokenRow);

    if (!Number.isFinite(createdAtMs) || !Number.isFinite(expiresAtMs)) {
        return true;
    }

    return createdAtMs + TOKEN_MAX_AGE_MS <= Date.now() || expiresAtMs <= Date.now() + TOKEN_REFRESH_BUFFER_MS;
};

const isTokenValid = (tokenRow) => {
    return !shouldRefreshToken(tokenRow);
};

const TOKEN_KEY_PATTERN = /(^|[_-])(access)?token$|^jwt$|^session(token)?$|^id(token)?$/i;
const TOKEN_VALUE_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$|^[A-Za-z0-9-_=+/]{24,}$/;

const isLikelyTokenValue = (value) => typeof value === 'string' && TOKEN_VALUE_PATTERN.test(value.trim());

const extractTokenValue = (payload, visited = new Set()) => {
    if (typeof payload === 'string') {
        const trimmed = payload.trim();
        return trimmed || null;
    }

    if (!payload || typeof payload !== 'object' || visited.has(payload)) {
        return null;
    }

    visited.add(payload);

    if (Array.isArray(payload)) {
        for (const item of payload) {
            const nestedToken = extractTokenValue(item, visited);
            if (nestedToken) {
                return nestedToken;
            }
        }
        return null;
    }

    for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) {
            continue;
        }

        if (TOKEN_KEY_PATTERN.test(key) && String(value).trim()) {
            return String(value).trim();
        }

        if (typeof value === 'string' && /token|jwt|session|bearer|auth/i.test(key) && value.trim()) {
            return value.trim();
        }

        if (typeof value === 'string' && isLikelyTokenValue(value)) {
            return value.trim();
        }

        if (typeof value === 'object') {
            const nestedToken = extractTokenValue(value, visited);
            if (nestedToken) {
                return nestedToken;
            }
        }
    }

    return null;
};

const extractLocationWorldSessionToken = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const directCandidates = [
        payload.access_token,
        payload.accessToken,
        payload.session_token,
        payload.sessionToken,
        payload.token,
        payload.jwt,
        payload.id_token,
        payload.idToken,
        payload.client_id,
        payload.clientId,
        payload.user_id,
        payload.userId,
    ];

    for (const candidate of directCandidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }

    const nestedCandidates = [
        payload.data,
        payload.result,
        payload.response,
        payload.session,
        payload.payload,
    ];

    for (const candidate of nestedCandidates) {
        if (!candidate || typeof candidate !== 'object') {
            continue;
        }

        const nestedToken = extractLocationWorldSessionToken(candidate);
        if (nestedToken) {
            return nestedToken;
        }
    }

    return null;
};

const normalizeTokenPayload = (payload, fallbackExpiresInSeconds, expiresInSecondsOverride = null) => {
    const accessToken = extractTokenValue(payload);
    if (!accessToken) {
        throw new Error('Token response does not contain an access token');
    }

    const expiresInSeconds = expiresInSecondsOverride ?? payload.expires_in ?? fallbackExpiresInSeconds;

    return {
        accessToken,
        tokenType: payload.token_type || payload.tokenType || null,
        scope: payload.scope || null,
        expiresAt: toExpiryDate(expiresInSeconds),
        metadata: payload,
    };
};

const requestJson = async (url, options) => {
    const response = await fetch(url, options);
    const text = await response.text();
    let payload = {};

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (error) {
            if (response.ok) {
                throw new Error(`Invalid JSON response from ${url}`);
            }
            payload = { raw: text };
        }
    }

    if (!response.ok) {
        const message = payload.error_description || payload.error || response.statusText || 'Request failed';
        throw new Error(`${url} responded with ${response.status}: ${message}`);
    }

    return payload;
};

const buildLocationWorldUrl = (path, query = {}) => {
    const safePath = path
        .split('/')
        .map((segment) => (segment.startsWith('{') && segment.endsWith('}')) ? segment : encodeURIComponent(segment))
        .join('/');
    const url = new URL(`https://customer-api.location-world.com${safePath}`);

    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });

    return url;
};

const normalizeComparableText = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const parseLocationWorldDate = (value) => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    }

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            return null;
        }

        return new Date(value < 1e12 ? value * 1000 : value);
    }

    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    if (TIMESTAMP_WITH_TIMEZONE_PATTERN.test(trimmed)) {
        const date = new Date(trimmed);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const match = trimmed.match(TIMESTAMP_WITHOUT_TIMEZONE_PATTERN);
    if (match) {
        return null;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatLocationWorldTimestamp = (value) => {
    const date = parseLocationWorldDate(value);
    if (!date || Number.isNaN(date.getTime())) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            const match = trimmed.match(TIMESTAMP_WITHOUT_TIMEZONE_PATTERN);
            if (match) {
                const [, year, month, day, hour, minute, second = '00', millisecond = ''] = match;
                const ms = millisecond ? String(millisecond).padEnd(3, '0') : '';
                return `${year}-${month}-${day}T${hour}:${minute}:${second}${ms ? `.${ms}` : ''}`;
            }

            return trimmed || null;
        }

        return null;
    }

    const parts = new Intl.DateTimeFormat('sv-SE', {
        timeZone: CORDOBA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`;
};

const extractDevicesItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const candidates = [
        payload.data,
        payload.devices,
        payload.items,
        payload.content,
        payload.records,
        payload.result,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (candidate && typeof candidate === 'object') {
            const nestedItems = extractDevicesItems(candidate);
            if (nestedItems.length > 0) return nestedItems;
        }
    }

    return [];
};

const extractDeviceIdentifier = (device) => {
    if (!device || typeof device !== 'object') return null;

    const candidateFields = [
        'deviceId',
        'device_id',
        'id',
        'identifier',
    ];

    for (const field of candidateFields) {
        const value = device[field];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }

    return null;
};

const getCachedToken = async (provider) => {
    const cachedToken = await tokenRepository.findByProvider(provider);
    return isTokenValid(cachedToken) ? cachedToken : null;
};

const cacheToken = async (
    provider,
    payload,
    fallbackExpiresInSeconds = DEFAULT_TOKEN_TTL_SECONDS,
    explicitAccessToken = null,
    expiresInSecondsOverride = null,
) => {
    const normalized = explicitAccessToken
        ? {
            accessToken: explicitAccessToken,
            tokenType: payload?.token_type || payload?.tokenType || null,
            scope: payload?.scope || null,
            expiresAt: toExpiryDate(expiresInSecondsOverride ?? payload?.expires_in ?? fallbackExpiresInSeconds),
            metadata: payload,
        }
        : normalizeTokenPayload(payload, fallbackExpiresInSeconds, expiresInSecondsOverride);

    return tokenRepository.upsert({
        provider,
        accessToken: explicitAccessToken || normalized.accessToken,
        tokenType: normalized.tokenType,
        scope: normalized.scope,
        expiresAt: normalized.expiresAt,
        metadata: normalized.metadata,
    });
};

const getLocationWorldSessionToken = async () => {
    // Para las llamadas a Customer API, el token de Bearer correcto es el de Auth0 (Paso A)
    // Sin embargo, Step C (Session) es necesario para activar el contexto de YPF
    // y resolver el userId.
    return getLocationWorldAuthToken();
};

/**
 * Step a: Obtención de Token Location World (Auth0)
 */
const getLocationWorldAuthToken = async ({ forceRefresh = false } = {}) => {
    if (!forceRefresh) {
        const cachedToken = await getCachedToken(PROVIDERS.locationWorldAuth0);
        if (cachedToken) {
            return cachedToken.access_token;
        }
    }

    const payload = await requestJson('https://location-world.auth0.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: getRequiredEnv('LW_CLIENT_ID'),
            client_secret: getRequiredEnv('LW_CLIENT_SECRET'),
            audience: 'https://customer-api.location-world.com',
            grant_type: 'client_credentials',
        }),
    });

    const storedToken = await cacheToken(PROVIDERS.locationWorldAuth0, payload);
    return storedToken.access_token;
};

/**
 * Step b: Obtención de Token YPF
 */
const getYpfToken = async ({ forceRefresh = false } = {}) => {
    if (!forceRefresh) {
        const cachedToken = await getCachedToken(PROVIDERS.ypf);
        if (cachedToken) {
            return cachedToken.access_token;
        }
    }

    const formData = new URLSearchParams({
        grant_type: 'password',
        client_id: getRequiredEnv('YPF_CLIENT_ID'),
        client_secret: getRequiredEnv('YPF_CLIENT_SECRET'),
        scope: getRequiredEnv('YPF_SCOPE'),
        username: getRequiredEnv('YPF_USERNAME'),
        password: getRequiredEnv('YPF_PASSWORD'),
    });

    const payload = await requestJson('https://mag.ypf.com/auth/oauth/v2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    const storedToken = await cacheToken(PROVIDERS.ypf, payload, DEFAULT_TOKEN_TTL_SECONDS, null, YPF_TOKEN_TTL_SECONDS);
    return storedToken.access_token;
};

/**
 * Step c: Creación de Session en API Location World
 */
const createLocationWorldSession = async ({ forceYpfRefresh = false } = {}) => {
    const locationWorldAuthToken = await getLocationWorldAuthToken();
    const ypfToken = await getYpfToken({ forceRefresh: forceYpfRefresh });

    const payload = await requestJson('https://customer-api.location-world.com/v1/fleet/ypfruta/sessions/3party-jwtm', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${locationWorldAuthToken}`,
        },
        body: JSON.stringify({
            thirdPartyAccessToken: ypfToken,
            username: getRequiredEnv('YPF_USERNAME'),
        }),
    });

    const sessionToken = extractLocationWorldSessionToken(payload);
    if (!sessionToken) {
        console.error('[ypf.session] Create session failed - payload does not contain required fields (clientId/userId)');
        throw new Error('Location World session response does not contain a session token');
    }

    console.log('[ypf.session] Session created successfully');

    const storedToken = await cacheToken(PROVIDERS.locationWorldSession, payload, DEFAULT_TOKEN_TTL_SECONDS, sessionToken);
    return sessionToken || storedToken.access_token;
};

const requestLocationWorldApi = async (path, { method = 'GET', query, body } = {}) => {
    const url = buildLocationWorldUrl(path, query);

    const execute = async (token) => requestJson(url.toString(), {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let token = await getLocationWorldAuthToken();

    try {
        return await execute(token);
    } catch (error) {
        if (!String(error.message).includes('401')) {
            throw error;
        }

        // Retry 1: Force refresh Auth0 Token
        token = await getLocationWorldAuthToken({ forceRefresh: true });

        try {
            return await execute(token);
        } catch (retryError) {
            if (!String(retryError.message).includes('401')) {
                throw retryError;
            }

            // Retry 2: Force refresh YPF + Session activation
            await createLocationWorldSession({ forceYpfRefresh: true });
            token = await getLocationWorldAuthToken({ forceRefresh: true });
            return execute(token);
        }
    }
};

const getSessionUserId = async () => {
    const session = await tokenRepository.findByProvider(PROVIDERS.locationWorldSession);
    if (!session || !isTokenValid(session)) {
        // No hay sesión válida, intentamos crearla
        await getLocationWorldSessionToken({ forceRefresh: true });
        const newSession = await tokenRepository.findByProvider(PROVIDERS.locationWorldSession);
        return newSession?.metadata?.userId || null;
    }
    return session.metadata?.userId || null;
};

const getDevices = async ({ domain = 'fleet', subdomain = 'ypfruta', userId, page = 0, pageSize = 200 } = {}) => {
    // Si no se proporciona userId, intentar obtenerlo de la sesión activa
    const targetUserId = userId || await getSessionUserId();
    
    if (!targetUserId) {
        throw new Error('UserId is required but not provided and no active session found');
    }

    return requestLocationWorldApi(
        `/v1/${domain}/${subdomain}/users/${targetUserId}/devices`,
        { query: { page, pageSize } }
    );
};

const getLastLocation = async ({ domain = 'fleet', subdomain = 'ypfruta', userId, deviceId } = {}) => {
    const targetUserId = userId || await getSessionUserId();
    
    if (!targetUserId) {
        throw new Error('UserId is required for getLastLocation but not provided and no active session found');
    }

    return requestLocationWorldApi(
        `/v1/${domain}/${subdomain}/users/${targetUserId}/devices/${deviceId}/last-location`
    );
};

const getHistory = async ({ domain = 'fleet', subdomain = 'ypfruta', userId, deviceId, from, to, page, pageSize } = {}) => {
    const targetUserId = userId || await getSessionUserId();
    
    if (!targetUserId) {
        throw new Error('UserId is required for getHistory but not provided and no active session found');
    }

    const query = { from, to };
    if (page !== undefined) {
        query.page = page;
    }
    if (pageSize !== undefined) {
        query.pageSize = pageSize;
    }

    return requestLocationWorldApi(
        `/v1/${domain}/${subdomain}/users/${targetUserId}/devices/${deviceId}/history`,
        { query }
    );
};

const getAllHistory = async ({ domain = 'fleet', subdomain = 'ypfruta', userId, deviceId, from, to, pageSize = 5000 } = {}) => {
    const targetUserId = userId || await getSessionUserId();

    if (!targetUserId) {
        throw new Error('UserId is required for getAllHistory but not provided and no active session found');
    }

    const payload = await getHistory({
        domain,
        subdomain,
        userId: targetUserId,
        deviceId,
        from,
        to,
        pageSize,
    });

    const items = extractDevicesItems(payload);
    return {
        ...payload,
        records: Number(payload?.records ?? items.length ?? 0),
        content: items,
    };
};

const getDeviceByAlias = async ({ domain = 'fleet', subdomain = 'ypfruta', userId, alias } = {}) => {
    const targetUserId = userId || await getSessionUserId();

    if (!targetUserId) {
        throw new Error('UserId is required for getDeviceByAlias but not provided and no active session found');
    }

    const devicesPayload = await getDevices({ domain, subdomain, userId: targetUserId });
    const devices = extractDevicesItems(devicesPayload);
    const targetAlias = normalizeComparableText(alias);

    if (!targetAlias) {
        return null;
    }

    return devices.find((device) => {
        const deviceAlias = normalizeComparableText(device?.alias ?? device?.label);
        return deviceAlias && deviceAlias === targetAlias;
    }) || null;
};

const getHistoryByRoutePlate = async ({ plate, startedAt, endedAt, domain = 'fleet', subdomain = 'ypfruta', userId } = {}) => {
    const targetUserId = userId || await getSessionUserId();

    if (!targetUserId) {
        throw new Error('UserId is required for getHistoryByRoutePlate but not provided and no active session found');
    }

    const device = await getDeviceByAlias({ domain, subdomain, userId: targetUserId, alias: plate });
    if (!device) {
        console.warn('[ypf.history] No device matched route plate', { plate, userId: targetUserId });
        return null;
    }

    const deviceId = extractDeviceIdentifier(device);
    if (!deviceId) {
        throw new Error(`Device found for plate ${plate} but has no ID`);
    }

    const from = formatLocationWorldTimestamp(startedAt);
    const to = formatLocationWorldTimestamp(endedAt);

    if (!from || !to) {
        throw new Error('Route timestamps are invalid and cannot be used for YPF history');
    }

    console.log('[ypf.history] Query window', { plate, from, to, deviceId });

    return getAllHistory({
        domain,
        subdomain,
        userId: targetUserId,
        deviceId,
        from,
        to,
    });
};

const getAuthStatus = async () => {
    const [locationWorldAuthToken, ypfToken, sessionToken] = await Promise.all([
        tokenRepository.findByProvider(PROVIDERS.locationWorldAuth0),
        tokenRepository.findByProvider(PROVIDERS.ypf),
        tokenRepository.findByProvider(PROVIDERS.locationWorldSession),
    ]);

    return {
        locationWorldAuth0: {
            cached: Boolean(locationWorldAuthToken),
            valid: isTokenValid(locationWorldAuthToken),
            expiresAt: locationWorldAuthToken?.expires_at || null,
        },
        ypf: {
            cached: Boolean(ypfToken),
            valid: isTokenValid(ypfToken),
            refreshRequired: shouldRefreshToken(ypfToken),
            createdAt: ypfToken?.created_at || null,
            expiresAt: ypfToken?.expires_at || null,
        },
        session: {
            cached: Boolean(sessionToken),
            valid: isTokenValid(sessionToken),
            expiresAt: sessionToken?.expires_at || null,
        },
    };
};

const refreshSession = async () => createLocationWorldSession();

const getHistoryByPlate = async ({ plate, from, to, domain = 'fleet', subdomain = 'ypfruta', userId }) => {
    const targetUserId = userId || await getSessionUserId();

    if (!targetUserId) {
        throw new Error('UserId is required for getHistoryByPlate but not provided and no active session found');
    }

    const device = await getDeviceByAlias({ domain, subdomain, userId: targetUserId, alias: plate });
    if (!device) {
        console.warn(`[ypf.service] No device found for plate: ${plate}`);
        return null;
    }

    const deviceId = extractDeviceIdentifier(device);
    if (!deviceId) {
        throw new Error(`Device found for plate ${plate} but has no ID`);
    }

    const formattedFrom = formatLocationWorldTimestamp(from);
    const formattedTo = formatLocationWorldTimestamp(to);
    if (!formattedFrom || !formattedTo) {
        throw new Error('History timestamps are invalid and cannot be used for YPF history');
    }

    return getHistory({
        domain,
        subdomain,
        userId: targetUserId,
        deviceId,
        from: formattedFrom,
        to: formattedTo,
    });
};

module.exports = {
    getLocationWorldAuthToken,
    getYpfToken,
    createLocationWorldSession,
    getLocationWorldSessionToken,
    getDevices,
    getLastLocation,
    getHistory,
    getAllHistory,
    getDeviceByAlias,
    getHistoryByRoutePlate,
    getHistoryByPlate,
    getSessionUserId, // Nuevo
    refreshSession,
    getAuthStatus,
    shouldRefreshToken,
};
