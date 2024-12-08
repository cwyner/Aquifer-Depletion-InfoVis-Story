// Define diverging color scale
const minDropoff = -20; // Define the minimum dropoff value
const maxDropoff = 40; // Adjust the maximum dropoff value to cover Ohio's 36.68

const colorScale = d3.scaleLinear()
  .domain([minDropoff, 0, maxDropoff]) // Ensure domain spans actual data range
  .range(["red", "white", "green"]); // Diverging color scheme

// Load the data and GeoJSON
Promise.all([
  d3.csv("yearly_avg_water_depth.csv"),
  d3.json("us-states-simple.json")
]).then(([data, geojson]) => {
  console.log("Data and GeoJSON loaded");

  // Preprocess data by decade
  const processedData = preprocessDataByDecade(data, geojson);
  console.log("Processed Data:", processedData);

  // Create the map
  createMap(processedData, geojson);
}).catch(error => {
  console.error("Error loading or processing data:", error);
});

// Function to preprocess data by decade
function preprocessDataByDecade(data, geojson) {
  console.log("Starting preprocessing...");
  const stateGeo = new Map(
    geojson.features.map(f => [f.properties.NAME, f])
  );

  // Group data by state and decade
  const wellDataByDecade = [];
  const wellsById = d3.group(data, d => d.station_nm);

  wellsById.forEach((records, wellId) => {
    const state = findState(records[0], stateGeo);
    if (!state) return; // Skip wells outside defined states

    // Group records by decade (based on the year)
    const groupedByDecade = d3.group(records, d => Math.floor(+d.year / 10) * 10);

    groupedByDecade.forEach((decadeRecords, decade) => {
      // Get the min and max year within the decade range
      const minYear = d3.min(decadeRecords, d => +d.year);
      const maxYear = d3.max(decadeRecords, d => +d.year);

      // Find the corresponding water depths for the start and end years
      const minDepth = +decadeRecords.find(d => +d.year === minYear).water_depth_ft;
      const maxDepth = +decadeRecords.find(d => +d.year === maxYear).water_depth_ft;

      // Calculate the dropoff for the well in this decade
      wellDataByDecade.push({
        state,
        decade,
        dropoff: maxDepth - minDepth
      });
    });
  });

  // Aggregate dropoffs by state and decade
  const aggregated = d3.rollup(
    wellDataByDecade,
    v => d3.mean(v, d => d.dropoff), // Take the mean dropoff for each state and decade
    d => d.state, // Group by state
    d => d.decade // Group by decade
  );

  console.log("Preprocessing completed");
  return aggregated;
}

// Find state for a record based on latitude and longitude
function findState(record, stateGeo) {
  const lat = +record.dec_lat_va;
  const lon = +record.dec_long_va;
  for (const [state, geo] of stateGeo.entries()) {
    if (d3.geoContains(geo, [lon, lat])) return state;
  }
  return null;
}

// Create the map
function createMap(processedData, geojson) {
  console.log("Creating map...");

  const width = 960;
  const height = 600;
  const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoAlbersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Create a tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "5px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("visibility", "hidden");

  // Draw the map
  svg.selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#ccc")
    .attr("stroke", "#333")
    .on("mouseover", function (event, d) {
      const state = d.properties.NAME;
      const dropoff = processedData.get(state)?.get(currentDecade) ?? null;

      tooltip.style("visibility", "visible")
        .text(`${state}: ${dropoff !== null ? dropoff.toFixed(2) : "No data"}`);
    })
    .on("mousemove", function (event) {
      tooltip.style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  // Create radio buttons for decades
  const controls = d3.select("#controls");
  const decades = Array.from(
  new Set(Array.from(processedData.values()).flatMap(d => Array.from(d.keys())))
    ).sort().filter(d => d !== 1910 && d !== 1920); // Filter out 1910 and 1920

  const radioButtons = controls.selectAll("div")
    .data(decades)
    .join("div")
    .style("display", "inline-block")
    .style("margin-right", "10px");

  radioButtons.append("input")
    .attr("type", "radio")
    .attr("name", "decade")
    .attr("value", d => d)
    .on("change", function () {
      currentDecade = +this.value;
      updateMap(currentDecade, processedData, svg, path, geojson);
    });

  radioButtons.append("label")
    .text(d => d)
    .attr("for", d => d);

  // Initialize map with the first decade
  let currentDecade = decades[0];
  updateMap(currentDecade, processedData, svg, path, geojson);
}

// Update the map with data for a specific decade
function updateMap(selectedDecade, processedData, svg, path, geojson) {
  console.log(`Updating map for decade: ${selectedDecade}`);

  svg.selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const state = d.properties.NAME;
      const dropoff = processedData.get(state)?.get(selectedDecade) ?? null;

      if (dropoff === null) return "#ccc";
      return colorScale(dropoff); // Apply diverging color scale
    })
    .attr("stroke", "#333");
}
