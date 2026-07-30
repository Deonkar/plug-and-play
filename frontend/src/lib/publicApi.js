/**
 * Public-API client — issues + caches an anonymous session token for /public/* endpoints.
 * The token is IP-bound and lasts 30 min; we lazily refresh once on 401.
 */
import axios from "axios";
import { API } from "./api";

const publicApi = axios.create({ baseURL: API });

let anonToken = null;
let anonPromise = null;

async function fetchAnonToken() {
  if (anonPromise) return anonPromise;
  anonPromise = axios
    .post(`${API}/public/session`)
    .then((r) => { anonToken = r.data.token; return anonToken; })
    .finally(() => { anonPromise = null; });
  return anonPromise;
}

publicApi.interceptors.request.use(async (config) => {
  if (!anonToken) await fetchAnonToken();
  if (anonToken) config.headers.Authorization = `Bearer ${anonToken}`;
  return config;
});

// One retry on 401 (token expired / refreshed IP)
publicApi.interceptors.response.use(
  (r) => r,
  async (err) => {
    const cfg = err.config || {};
    if (err.response?.status === 401 && !cfg.__retried) {
      cfg.__retried = true;
      anonToken = null;
      await fetchAnonToken();
      if (anonToken) cfg.headers.Authorization = `Bearer ${anonToken}`;
      return axios(cfg);
    }
    return Promise.reject(err);
  }
);

export default publicApi;
