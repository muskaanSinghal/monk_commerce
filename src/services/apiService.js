const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const fetchProducts = async ({ search, page = 20, limit = 10 } = {}) => {
    try {
        const url = new URL(`${API_URL}/products/search`);

        if (search) url.searchParams.append("search", search);
        if (page) url.searchParams.append("page", page);
        url.searchParams.append("limit", limit);

        const headers = new Headers();
        headers.append("x-api-key", API_KEY);

        const response = await fetch(url.toString(), {
            headers,
        });

        if (!response || !response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const products = await response.json();
        if (!products) {
            console.log("No more products");
            return null;
        }
        return products;
    } catch (err) {
        console.error("Error while fetching products: " + err.message);
        throw err;
    }
}