// Define diverging color scale
const minDropoff = -20; // Define the minimum dropoff value
const maxDropoff = 40; // Adjust the maximum dropoff value to cover Ohio's 36.68

const colorScale = d3.scaleLinear()
  .domain([minDropoff, 0, maxDropoff]) // Ensure domain spans actual data range
  .range(["red", "white", "green"]); // Diverging color scheme
  
// Load the processed data CSV and GeoJSON
Promise.all([
  d3.csv("States_Dropoff/processed_water_depth_data.csv"),
  d3.json("States_Dropoff/us-states-simple.json")
]).then(([data, geojson]) => {
  console.log("Data and GeoJSON loaded");

  // Normalize state names to lowercase for matching
  const stateGeo = new Map(
    geojson.features.map(f => [f.properties.NAME.toLowerCase(), f]) // Convert GeoJSON state names to lowercase
  );

  // Preprocess the data to match GeoJSON state names
  const processedData = preprocessData(data);
  console.log("Processed Data:", processedData);

  // Create the map
  createMap(processedData, geojson);
}).catch(error => {
  console.error("Error loading or processing data:", error);
});

// Preprocess the data to match GeoJSON and prepare for the map
function preprocessData(data) {
  console.log("Starting preprocessing...");
  
  // Normalize state names in CSV to lowercase for matching
  const normalizedData = data.map(d => ({
    state: d.state.toLowerCase(),  // Convert state names to lowercase
    decade: +d.decade,
    average_dropoff: +d.average_dropoff  // Make sure dropoff is a number
  }));

  // Group data by state and decade
  const groupedData = d3.rollup(normalizedData, v => {
    const sumDropoff = d3.sum(v, d => d.average_dropoff);
    const count = v.length;
    return sumDropoff / count;  // Calculate the average dropoff
  }, d => d.state, d => d.decade);

  console.log("Preprocessing completed");
  return groupedData;
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

  // Create radio buttons for decades, excluding 1910 and 1920
  const controls = d3.select("#controls");
  const decades = Array.from(
    new Set(Array.from(processedData.values()).flatMap(d => Array.from(d.keys())))
  )
  .filter(d => d !== 1910 && d !== 1920)  // Exclude 1910 and 1920
  .sort();

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
      updateMap(currentDecade, processedData, svg, path, geojson, colorScale);
    });

  radioButtons.append("label")
    .text(d => d)
    .attr("for", d => d);

  // Initialize currentDecade with the first decade from the dataset
  let currentDecade = decades[0];  // Set initial value for currentDecade
  updateMap(currentDecade, processedData, svg, path, geojson, colorScale);

  // Draw the map
  svg.selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("d", path)
    .attr("fill", function (d) {
      const state = d.properties.NAME.toLowerCase();  // Normalize GeoJSON state names to lowercase
      const dropoff = processedData.get(state)?.get(currentDecade) ?? null;
      if (dropoff === null) return "#ccc";  // No data available
      return colorScale(dropoff);  // Use the color scale based on dropoff
    })
    .attr("stroke", "#333")
    .on("mouseover", function (event, d) {
      const state = d.properties.NAME;
      const dropoff = processedData.get(state.toLowerCase())?.get(currentDecade) ?? null;

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
}

// Update the map with data for a specific decade
function updateMap(selectedDecade, processedData, svg, path, geojson, colorScale) {
  console.log(`Updating map for decade: ${selectedDecade}`);

  svg.selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("d", path)
    .attr("fill", function (d) {
      const state = d.properties.NAME.toLowerCase();  // Normalize GeoJSON state names to lowercase
      const dropoff = processedData.get(state)?.get(selectedDecade) ?? null;
      if (dropoff === null) return "#ccc";  // No data
      return colorScale(dropoff);  // Apply the color scale
    })
    .attr("stroke", "#333");
}
