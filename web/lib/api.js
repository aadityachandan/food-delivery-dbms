// Helpers shared by all route handlers: errors, input parsing, JSON replies.
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const fail = (status, message) => { throw new ApiError(status, message); };

export function int(value, name) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) fail(400, `Invalid ${name}`);
  return n;
}

export function text(value, name, { max = 200, required = true } = {}) {
  const s = value == null ? '' : String(value).trim();
  if (required && !s) fail(400, `${name} is required`);
  if (s.length > max) fail(400, `${name} is too long (max ${max} characters)`);
  return s;
}

export async function readJson(req) {
  try { return await req.json(); } catch { return {}; }
}

export const round2 = x => Math.round((x + Number.EPSILON) * 100) / 100;

// Wraps a route handler: returns JSON and turns errors into friendly replies.
export function route(fn) {
  return async (req, ctx) => {
    try {
      const data = await fn(req, ctx);
      return Response.json(data ?? { ok: true });
    } catch (e) {
      return errorReply(e);
    }
  };
}

function errorReply(e) {
  if (e instanceof ApiError) return Response.json({ error: e.message }, { status: e.status });
  // SIGNAL SQLSTATE '45000' raised by our triggers and stored procedures
  if (e.sqlState === '45000') return Response.json({ error: e.sqlMessage }, { status: 400 });
  const known = {
    ER_DUP_ENTRY: [409, 'This already exists'],
    ER_ROW_IS_REFERENCED_2: [409, 'This record is used by other data (for example past orders), so it cannot be deleted'],
    ER_NO_REFERENCED_ROW_2: [400, 'A referenced record does not exist'],
    ER_CHECK_CONSTRAINT_VIOLATED: [400, null],
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: [400, 'Invalid value'],
    WARN_DATA_TRUNCATED: [400, 'Invalid value'],
  };
  if (known[e.code]) {
    const [status, msg] = known[e.code];
    return Response.json({ error: msg || `Rejected by the database: ${e.sqlMessage}`, detail: e.sqlMessage }, { status });
  }
  if (['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(e.code)) {
    return Response.json({ error: `Cannot reach MySQL (${e.code}). Check web/.env.local and that the SQL scripts were run.` }, { status: 503 });
  }
  console.error(e);
  return Response.json({ error: 'Something went wrong on the server' }, { status: 500 });
}
