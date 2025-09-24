import axios from "axios";
import { useEffect, useState } from "react";

const useFetch = ({ url }) => {
    const [gifUrl, setGifUrl] = useState("");

    const fetchGifs = async () => {
        const controller = new AbortController();
        try {
            const imageUrl = await axios(url,{headers:{
                responseType: "arraybuffer", 
                signal: controller.signal,
            }});
            console.log(imageUrl);
            const blobUrl = imageUrl.data
            setGifUrl(blobUrl);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (url) fetchGifs();
    }, [url]);

    return gifUrl;
};

export default useFetch;