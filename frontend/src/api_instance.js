import axios from "axios";
import store from "./redux/store"; 

const localhost = "http://127.0.0.1:8000/v1/";
const serverhost = "http://111.118.189.10/v1/";
const testhost = "http://49.50.109.23/v1/";

const host =
  process.env.NODE_ENV === "development"
    ? localhost
    : `${window.location.origin}/v1/`;

const instance = axios.create({
  baseURL: host,
});

// attach headers dynamically before each request
instance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.login?.session_token || localStorage.getItem("session_token");
  const session_id = state.login?.session_id || localStorage.getItem("session_id");

  if (session_id) config.headers["Session-Id"] = session_id;
  if (token) config.headers["Session-Token"] = token;

  return config;
});

export { host };
export default instance;
