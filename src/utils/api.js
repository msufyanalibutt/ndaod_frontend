import Axios from "axios";
let urls = {
    test: `http://localhost:5000`,
    development: 'http://localhost:5000',
    production: 'https://api.ntradao.com'
}
const api = Axios.create({
    baseURL: urls[process.env.NODE_ENV],
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

export default api;