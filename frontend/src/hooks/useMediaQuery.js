import { useState, useEffect } from "react";

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = globalThis.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener); // Better than resize listener

        // Initial check
        setMatches(media.matches);

        return () => media.removeEventListener("change", listener);
    }, [query]); // Removed matches from deps to prevent loop

    return matches;
};

export default useMediaQuery;
