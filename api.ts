import Axios from "axios";

const ApiClient = Axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_ENDPOINT}/api/`,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

export default ApiClient;
