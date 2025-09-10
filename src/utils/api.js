import Axios from "axios";
let urls = {
    test: `http://localhost:80`,
    development: 'http://localhost:80',
    production: '/'
}
const api = Axios.create({
    baseURL: urls[process.env.NODE_ENV],
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

export default api;