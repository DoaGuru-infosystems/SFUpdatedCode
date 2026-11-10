export const API_URL = process.env.REACT_APP_API_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8080" : "https://sf.doaguru.com");
