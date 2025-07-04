import axios from "axios";
const api_path = "";

const http = axios.create({
    baseURL: api_path,
    headers: {
        "Content-type": "application/json"
    }
});

export { http };
