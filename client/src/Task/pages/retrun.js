return (
  <div>
    <div>
      <label>Country: </label>
      <select value={selectedCountry} onChange={handleCountryChange}>
        <option value="">Select Country</option>
        {countries.map(country => (
          <option key={country.id} value={country.id}>{country.name}</option>
        ))}
      </select>
    </div>

    <div>
      <label>State: </label>
      <select value={selectedState} onChange={handleStateChange} disabled={!selectedCountry}>
        <option value="">Select State</option>
        {states.map(state => (
          <option key={state.id} value={state.id}>{state.name}</option>
        ))}
      </select>
    </div>

    <div>
      <label>District: </label>
      <select value={selectedState} onChange={handleStateChange} disabled={!selectedState}>
        <option value="">Select District</option>
        {districts.map(district => (
          <option key={district.id} value={district.id}>{district.name}</option>
        ))}
      </select>
    </div>
  </div>
);
}