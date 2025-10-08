// Load local JSON file directly (fetch won't work for local project files)
const countryCityJson = require("../../constant/data/CountryCity.json");

export const getCountryOptions = async () => {
  const data = countryCityJson;
  const countriesData = data && data.data ? data.data : [];
  // Ensure keys are strings (SelectList expects string keys)
  return countriesData.map((country: any, index: number) => ({
    key: String(index + 1),
    value: country.country,
  }));
};

export const getCityOptions = async (country: string) => {
  const data = countryCityJson;
  const countriesData = data && data.data ? data.data : [];
  const countryData = countriesData.find((c: any) => c.country === country);
  if (countryData) {
    return countryData.cities.map((city: string, index: number) => ({
      key: String(index + 1),
      value: city,
    }));
  }
  return [];
};
