/**
 * Thin client for the FastAPI backend (see backend/auth.py).
 *
 * In dev, requests go to a relative /api path that Vite proxies to the
 * backend. In production set VITE_API_BASE_URL if the API is served from a
 * different origin than the frontend.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export type User = {
  id: number;
  /** The address this account signs in with. */
  email: string;
  created_at: string;
};

export type Token = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

/** An error carrying the HTTP status, so callers can react to 401 vs 409. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** FastAPI reports errors as `detail`: a string, or a list for 422s. */
async function toApiError(response: Response): Promise<ApiError> {
  let message = `Request failed (${response.status})`;
  try {
    const body = await response.json();
    const detail = body?.detail;
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      message = detail
        .map((d: { loc?: (string | number)[]; msg?: string }) => {
          const field = d.loc?.filter((p) => p !== 'body').join('.');
          return field ? `${field}: ${d.msg}` : d.msg;
        })
        .filter(Boolean)
        .join('\n');
    }
  } catch {
    /* non-JSON error body — keep the status-based message */
  }
  return new ApiError(message, response.status);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new ApiError('Could not reach the server. Is the backend running?', 0);
  }
  if (!response.ok) throw await toApiError(response);
  return response.json() as Promise<T>;
}

/**
 * POST /api/auth/login — OAuth2 password flow, so the body must be
 * form-encoded rather than JSON.
 *
 * The form field is called `username` because the OAuth2 spec says so; the
 * value it carries is the account's email.
 */
export function login(email: string, password: string): Promise<Token> {
  const body = new URLSearchParams({ username: email, password });
  return request<Token>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

/** POST /api/auth/register — JSON body; 409 when the email is taken. */
export function register(email: string, password: string): Promise<User> {
  return request<User>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

/** GET /api/auth/me — validates a stored token and returns its owner. */
export function me(token: string): Promise<User> {
  return request<User>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/* -------------------------------------------------------------------------
 * Analysis
 * ---------------------------------------------------------------------- */

/**
 * Shape produced by ResumeAnalysisAgent.semantic_skill_analysis in
 * backend/agents.py. Scores are 0-10 per skill; `overall_score` is 0-100.
 */
export type AnalysisResult = {
  overall_score: number;
  skill_scores: Record<string, number>;
  skill_reasoning: Record<string, string>;
  selected: boolean;
  reasoning: string;
  missing_skills: string[];
  strengths: string[];
  improvement_areas?: string[];
  detailed_weaknesses?: {
    skill: string;
    score: number;
    detail: string;
    suggestions?: string[];
    example?: string;
  }[];
};

export type AppConfig = {
  roles: Record<string, string[]>;
  cutoff_score: number;
  question_types: string[];
  /** Subject areas per role — system design, data modelling, and so on. */
  role_topics: Record<string, string[]>;
  /** Topics every interview covers: the person, their projects, challenges. */
  common_topics: string[];
  /** Level name -> what that level is actually probed on. */
  seniority_levels: Record<string, string>;
  improvement_areas: string[];
  server_has_api_key: boolean;
};

function authed(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** One slice of a longer list — see backend/pagination.py. */
export type Page<T> = {
  items: T[];
  /** Rows matching the filters across every page, which drives the pager. */
  total: number;
  limit: number;
  offset: number;
};

/** Drops empty values so a blank filter never reaches the server as `?q=`. */
function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === false) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * GET /api/analysis — the latest analysis for this session. The backend keeps
 * it in memory, so it is null until a resume has been analysed.
 */
export async function getAnalysis(token: string): Promise<AnalysisResult | null> {
  const body = await request<{ analysis_result: AnalysisResult | null }>(
    '/api/analysis',
    authed(token),
  );
  return body.analysis_result;
}

/** GET /api/config — role catalogue and server-side settings. */
export function getConfig(token: string): Promise<AppConfig> {
  return request<AppConfig>('/api/config', authed(token));
}

/** Suggestions keyed by improvement area, from POST /api/improvements. */
export type Improvements = Record<
  string,
  {
    description?: string;
    specific?: string[];
    before_after?: { before: string; after: string };
  }
>;

/** An OpenAI key is only needed when the server has none of its own. */
function withKey(token: string, apiKey?: string): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (apiKey) headers['X-OpenAI-Api-Key'] = apiKey;
  return headers;
}

/**
 * POST /api/analyze — multipart upload. Requires either a `role` from the
 * config catalogue or a job-description file, never neither.
 */
export function analyze(
  token: string,
  options: { resume: File; role?: string; jobDescription?: File | null; apiKey?: string },
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append('resume', options.resume);
  if (options.jobDescription) form.append('job_description', options.jobDescription);
  else if (options.role) form.append('role', options.role);

  return request<AnalysisResult>('/api/analyze', {
    method: 'POST',
    headers: withKey(token, options.apiKey),
    body: form,
  });
}

/** GET /api/improvements — the cached areas, shared across pages. */
export async function getCachedImprovements(token: string): Promise<Improvements | null> {
  const body = await request<{ improvements: Improvements | null }>(
    '/api/improvements',
    authed(token),
  );
  return body.improvements;
}

/**
 * POST /api/improvements — 409 if no resume has been analysed yet.
 *
 * Omitting `improvementAreas` lets the server offer the whole catalogue and
 * keep only the areas the model judges relevant to this resume.
 */
export async function getImprovements(
  token: string,
  options: { improvementAreas?: string[]; targetRole?: string; apiKey?: string } = {},
): Promise<Improvements> {
  const payload: Record<string, unknown> = { target_role: options.targetRole ?? '' };
  if (options.improvementAreas?.length) payload.improvement_areas = options.improvementAreas;

  const body = await request<{ improvements: Improvements }>('/api/improvements', {
    method: 'POST',
    headers: { ...withKey(token, options.apiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return body.improvements;
}

/* -------------------------------------------------------------------------
 * Rewrite
 * ---------------------------------------------------------------------- */

/** GET /api/resume — plain text of the uploaded resume, for the diff view. */
export async function getResumeText(token: string): Promise<string | null> {
  const body = await request<{ resume_text: string | null }>('/api/resume', authed(token));
  return body.resume_text;
}

/** GET /api/improved-resume — the cached rewrite, or null if none yet. */
/**
 * GET /api/improved-resume — the cached rewrite and its stored PDF.
 *
 * Falls back to the copy saved against the resume row, so a rewrite survives
 * the server-side session expiring.
 */
export function getImprovedResume(token: string): Promise<GeneratedResume> {
  return request<GeneratedResume>('/api/improved-resume', authed(token));
}

export type GeneratedResume = {
  improved_resume: string | null;
  /** The saved row it was attached to, if the analysis was persisted. */
  resume_id: number | null;
  /** S3 link to the generated PDF, or null when storage is off. */
  download_url: string | null;
};

/**
 * POST /api/improved-resume — runs the LLM, caches the result server-side,
 * and stores a typeset PDF of it in S3.
 */
export async function generateImprovedResume(
  token: string,
  options: { targetRole?: string; highlightSkills?: string; apiKey?: string },
): Promise<GeneratedResume> {
  return request<GeneratedResume>('/api/improved-resume', {
    method: 'POST',
    headers: { ...withKey(token, options.apiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_role: options.targetRole ?? '',
      highlight_skills: options.highlightSkills ?? '',
    }),
  });
}

/**
 * POST /api/improved-resume/apply — adopts the rewrite as the current resume
 * and re-scores it against the same skills, so the scores are comparable.
 */
export function applyImprovedResume(
  token: string,
  apiKey?: string,
): Promise<{ previous_score: number | null; analysis_result: AnalysisResult }> {
  return request('/api/improved-resume/apply', {
    method: 'POST',
    headers: withKey(token, apiKey),
  });
}

/* -------------------------------------------------------------------------
 * Interview preparation
 * ---------------------------------------------------------------------- */

export type InterviewQuestion = {
  type: string;
  /** Subject area, e.g. "System Design" or "Challenges & Failures". */
  topic: string;
  /** The skill this question targets; may be blank on the fallback path. */
  skill: string;
  question: string;
  /** Blank when the model's JSON couldn't be parsed and the old path ran. */
  expected_answer: string;
  hint: string;
  difficulty?: string;
};

/** GET /api/interview-questions — the cached set, or null before generating. */
export async function getCachedInterviewQuestions(
  token: string,
): Promise<InterviewQuestion[] | null> {
  const body = await request<{ questions: InterviewQuestion[] | null }>(
    '/api/interview-questions',
    authed(token),
  );
  return body.questions;
}

/** POST /api/interview-questions — generates and caches a new set. */
export async function generateInterviewQuestions(
  token: string,
  options: {
    questionTypes: string[];
    difficulty: string;
    numQuestions: number;
    focusSkills?: string[];
    /** Empty lets the server use the role's full topic catalogue. */
    topics?: string[];
    seniority?: string;
    targetRole?: string;
    apiKey?: string;
  },
): Promise<InterviewQuestion[]> {
  const body = await request<{ questions: InterviewQuestion[] }>('/api/interview-questions', {
    method: 'POST',
    headers: { ...withKey(token, options.apiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_types: options.questionTypes,
      difficulty: options.difficulty,
      num_questions: options.numQuestions,
      focus_skills: options.focusSkills ?? [],
      topics: options.topics ?? [],
      seniority: options.seniority ?? '',
      target_role: options.targetRole ?? '',
    }),
  });
  return body.questions;
}

/* -------------------------------------------------------------------------
 * Resume Q&A
 * ---------------------------------------------------------------------- */

export type QaMessage = {
  role: 'user' | 'assistant';
  content: string;
  /** ISO timestamp from the server. */
  at: string;
};

/** GET /api/qa-history — the stored transcript for this session. */
export async function getQaHistory(token: string): Promise<QaMessage[]> {
  const body = await request<{ history: QaMessage[] }>('/api/qa-history', authed(token));
  return body.history ?? [];
}

/** DELETE /api/qa-history — 204, so there's no body to parse. */
export async function clearQaHistory(token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/qa-history`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {
    throw new ApiError('Could not reach the server.', 0);
  });
  if (!response.ok) throw await toApiError(response);
}

/** POST /api/ask — answers from the analysed resume; 409 before any analysis. */
export async function ask(token: string, question: string, apiKey?: string): Promise<string> {
  const body = await request<{ answer: string }>('/api/ask', {
    method: 'POST',
    headers: { ...withKey(token, apiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  return body.answer;
}

/* -------------------------------------------------------------------------
 * Saved resumes
 * ---------------------------------------------------------------------- */

export type SavedResume = {
  id: number;
  filename: string;
  role: string;
  overall_score: number | null;
  selected: boolean;
  favourite: boolean;
  /** Strongest skills first, for the card's chips. */
  tags: string[];
  skill_count: number;
  /**
   * Short-lived S3 links, minted per request by the backend. Null when the
   * file was never stored — S3 is optional, and rows predating it have none.
   * Treat them as expiring: fetch a fresh list rather than caching a URL.
   */
  resume_url: string | null;
  jd_url: string | null;
  improved_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SavedResumeDetail = SavedResume & {
  resume_text: string;
  analysis_result: AnalysisResult | null;
  improved_text: string | null;
};

/** GET /api/resumes — one page, favourites first, then most recently updated. */
export function listResumes(
  token: string,
  options: { limit?: number; offset?: number; q?: string } = {},
): Promise<Page<SavedResume>> {
  const query = queryString({ limit: options.limit, offset: options.offset, q: options.q });
  return request<Page<SavedResume>>(`/api/resumes${query}`, authed(token));
}

export function readResume(token: string, id: number): Promise<SavedResumeDetail> {
  return request<SavedResumeDetail>(`/api/resumes/${id}`, authed(token));
}

/** PATCH /api/resumes/{id} — rename, change role, or toggle the star. */
export function updateResume(
  token: string,
  id: number,
  patch: { filename?: string; role?: string; favourite?: boolean },
): Promise<SavedResume> {
  return request<SavedResume>(`/api/resumes/${id}`, {
    method: 'PATCH',
    headers: { ...authed(token).headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

/** DELETE /api/resumes/{id} — 204, so there is no body to parse. */
export async function deleteResume(token: string, id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/resumes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {
    throw new ApiError('Could not reach the server.', 0);
  });
  if (!response.ok) throw await toApiError(response);
}

/**
 * POST /api/resumes/{id}/activate — make a saved resume the session's current
 * one, rebuilding its retrieval index so the other pages work against it.
 */
export function activateResume(
  token: string,
  id: number,
  apiKey?: string,
): Promise<{ analysis_result: AnalysisResult; resume_id: number }> {
  return request(`/api/resumes/${id}/activate`, {
    method: 'POST',
    headers: withKey(token, apiKey),
  });
}

/* -------------------------------------------------------------------------
 * Profile & account
 * ---------------------------------------------------------------------- */

export type Preferences = {
  email_analysis_complete: boolean;
  email_weekly_tips: boolean;
  email_product_updates: boolean;
  default_role: string;
  default_difficulty: string;
  default_question_count: number;
};

export type Profile = {
  /** The login address; changed through the account, not the profile form. */
  email: string;
  member_since: string;
  full_name: string;
  headline: string;
  location: string;
  linkedin: string;
  website: string;
  about: string;
  preferences: Preferences;
  saved_resume_count: number;
};

export function getProfile(token: string): Promise<Profile> {
  return request<Profile>('/api/profile', authed(token));
}

/** PATCH /api/profile — send only the fields being changed. */
export function updateProfile(
  token: string,
  patch: Partial<Omit<Profile, 'email' | 'member_since' | 'saved_resume_count' | 'preferences'>> & {
    preferences?: Partial<Preferences>;
  },
): Promise<Profile> {
  return request<Profile>('/api/profile', {
    method: 'PATCH',
    headers: { ...authed(token).headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

/** POST /api/profile/password — 204, or 401 when the current password is wrong. */
export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/profile/password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  }).catch(() => {
    throw new ApiError('Could not reach the server.', 0);
  });
  if (!response.ok) throw await toApiError(response);
}

/** GET /api/profile/export — everything stored about the account. */
export function exportAccount(token: string): Promise<unknown> {
  return request<unknown>('/api/profile/export', authed(token));
}

/** POST /api/profile/delete — irreversible; the password is the confirmation. */
export async function deleteAccount(token: string, password: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/profile/delete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).catch(() => {
    throw new ApiError('Could not reach the server.', 0);
  });
  if (!response.ok) throw await toApiError(response);
}

/* -------------------------------------------------------------------------
 * Job match
 * ---------------------------------------------------------------------- */

export type RoleSummary = {
  company: string;
  title: string;
  experience: string;
  employment_type: string;
  key_skills: string[];
  nice_to_have: string[];
};

export type JobMatch = {
  id: number;
  company: string;
  title: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  role_summary: RoleSummary;
  has_optimized_resume: boolean;
  /** Measured by re-scoring the tailored resume, not predicted. */
  optimized_score: number | null;
  /** Short-lived S3 link to the tailored resume PDF; see SavedResume. */
  optimized_url: string | null;
  created_at: string;
  updated_at: string;
};

export type JobMatchDetail = JobMatch & {
  jd_text: string;
  optimized_resume: string | null;
};

/**
 * GET /api/job-match — one page of matches, most recently updated first.
 *
 * `optimizedOnly` narrows it to the postings a tailored resume was actually
 * generated for, which is what the job-specific resume list shows.
 */
export function listJobMatches(
  token: string,
  options: { limit?: number; offset?: number; optimizedOnly?: boolean; q?: string } = {},
): Promise<Page<JobMatch>> {
  const query = queryString({
    limit: options.limit,
    offset: options.offset,
    optimized_only: options.optimizedOnly,
    q: options.q,
  });
  return request<Page<JobMatch>>(`/api/job-match${query}`, authed(token));
}

export function readJobMatch(token: string, id: number): Promise<JobMatchDetail> {
  return request<JobMatchDetail>(`/api/job-match/${id}`, authed(token));
}

/**
 * POST /api/job-match — scores the already-analysed resume against one posting.
 * A typed company/title wins over whatever the model reads from the posting.
 */
export function analyzeJobMatch(
  token: string,
  options: { jobDescription: string; company?: string; title?: string; apiKey?: string },
): Promise<JobMatch> {
  return request<JobMatch>('/api/job-match', {
    method: 'POST',
    headers: { ...withKey(token, options.apiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_description: options.jobDescription,
      company: options.company ?? '',
      title: options.title ?? '',
    }),
  });
}

/** PATCH /api/job-match/{id} — correct the company or role after the fact. */
export function renameJobMatch(
  token: string,
  id: number,
  patch: { company?: string; title?: string },
): Promise<JobMatch> {
  return request<JobMatch>(`/api/job-match/${id}`, {
    method: 'PATCH',
    headers: { ...authed(token).headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

/** POST /api/job-match/{id}/generate — tailor and re-score for that posting. */
export function generateJobResume(
  token: string,
  id: number,
  apiKey?: string,
): Promise<JobMatch> {
  return request<JobMatch>(`/api/job-match/${id}/generate`, {
    method: 'POST',
    headers: withKey(token, apiKey),
  });
}

export async function deleteJobMatch(token: string, id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/job-match/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {
    throw new ApiError('Could not reach the server.', 0);
  });
  if (!response.ok) throw await toApiError(response);
}

/* -------------------------------------------------------------------------
 * Library — the merged Saved Resumes feed
 * ---------------------------------------------------------------------- */

export type LibrarySource = 'all' | 'base' | 'tailored';
export type LibrarySort = 'modified' | 'score' | 'name';

/**
 * One row of the Saved Resumes list, from either source.
 *
 * Exactly one of `base` / `match` is set and carries what the row's actions
 * operate on. The headings come from the server because they are what its
 * name sort and search run against.
 */
export type LibraryItem = {
  key: string;
  kind: 'base' | 'tailored';
  heading: string;
  subheading: string;
  company: string;
  role: string;
  score: number | null;
  good: boolean;
  favourite: boolean;
  updated_at: string;
  base: SavedResume | null;
  match: JobMatch | null;
};

export type LibraryPage = Page<LibraryItem> & {
  /** Every role in the library, not just on this page — the filter's options. */
  roles: string[];
  /** Rows before any filter, which tells an empty search from an empty library. */
  total_all: number;
};

/**
 * GET /api/library — analysed and tailored resumes interleaved under one sort.
 *
 * Sorting, filtering and paging all happen server-side: the list spans two
 * tables, so a page of it is not a page of either one.
 */
export function readLibrary(
  token: string,
  options: {
    limit?: number;
    offset?: number;
    source?: LibrarySource;
    role?: string;
    sort?: LibrarySort;
    q?: string;
  } = {},
): Promise<LibraryPage> {
  const query = queryString({
    limit: options.limit,
    offset: options.offset,
    source: options.source === 'all' ? undefined : options.source,
    role: options.role,
    sort: options.sort === 'modified' ? undefined : options.sort,
    q: options.q,
  });
  return request<LibraryPage>(`/api/library${query}`, authed(token));
}
