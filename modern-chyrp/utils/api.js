import axios from "axios";

const api = axios.create({
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

});

export default api;
