import Axios from "axios";
let urls = {
    test: `http://localhost:8080`,
    development: 'http://localhost:8080',
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