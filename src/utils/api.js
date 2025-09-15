import Axios from "axios";
let urls = {
    test: `http://localhost:5000`,
    development: 'http://localhost:5000',
    production: 'http://185.146.232.78:5000'
}
const api = Axios.create({
    baseURL: urls[process.env.NODE_ENV],
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

export default api;