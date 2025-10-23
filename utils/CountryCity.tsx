import Constants from "expo-constants";

// Load local JSON file directly (fetch won't work for local project files)
// const countryCityJson = require("../../constant/data/CountryCity.json");

// export const getCountryOptions = async () => {
//   const data = countryCityJson;
//   const countriesData = data && data.data ? data.data : [];
//   // Ensure keys are strings (SelectList expects string keys)
//   return countriesData.map((country: any, index: number) => ({
//     key: String(index + 1),
//     value: country.country,
//   }));
// };

// export const getCityOptions = async (country: string) => {
//   const data = countryCityJson;
//   const countriesData = data && data.data ? data.data : [];
//   const countryData = countriesData.find((c: any) => c.country === country);
//   if (countryData) {
//     return countryData.cities.map((city: string, index: number) => ({
//       key: String(index + 1),
//       value: city,
//     }));
//   }
//   return [];
// };

// Fetch country and city data from external API
export const getCountryOptions = async () => {
  try {
    const response = await fetch(
      `https://data-api.oxilor.com/rest/countries?key=${Constants.expoConfig?.extra?.env.PROVINCE_API_KEY}`
    );
    const countriesData = await response.json();
    // console.log("Country API response:", countriesData); // Add logging to see the structure
    // Assuming the API returns an array directly, or adjust based on logging
    const countries = Array.isArray(countriesData)
      ? countriesData
      : countriesData.data || [];
    return countries.map((country: any) => ({
      key: country.id,
      value: country.name,
    }));
  } catch (error) {
    console.error("Error fetching country data:", error);
    return [];
  }
};

export const getCityOptions = async (countryId: string) => {
  try {
    const response = await fetch(
      `https://data-api.oxilor.com/rest/child-regions?key=${Constants.expoConfig?.extra?.env.PROVINCE_API_KEY}&parentId=${countryId}`
    );
    const data = await response.json();
    const cities = data.edges.map((edge: any) => ({
      name: edge.node.name,
      id: edge.node.id,
    }));
    return cities.map((city: any) => ({
      key: city.id,
      value: city.name,
    }));
  } catch (error) {
    console.error("Error fetching city data:", error);
    return [];
  }
};
