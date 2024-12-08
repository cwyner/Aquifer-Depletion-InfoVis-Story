const width = 960;
const height = 600;

// Define SVG canvas
const dot_svg = d3.select("svg#dot-density-map");

// Define a projection and path generator
const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1200);
const path = d3.geoPath().projection(projection);

// Load GeoJSON and well CSV data
Promise.all([
  d3.json("dot_density_map/usa_map.json"), // Adjust this path if needed
  d3.csv("preprocessed_data/depth_change.csv"), // Replace with your wells CSV file path
]).then(([geoData, wells]) => {
  // Convert CSV data to numeric types
  wells.forEach(d => {
    d.dec_lat_va = +d.dec_lat_va;
    d.dec_long_va = +d.dec_long_va;
    d.depth_change = +d.depth_change;
  });

  // Draw the map
  dot_svg.append("g")
    .selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#ddd") // Fill for states
    .attr("stroke", "#000") // Outline for state borders
    .attr("stroke-width", 0.5);

  // Filter wells with valid coordinates
  const validWells = wells.filter(d => {
    const coords = projection([d.dec_long_va, d.dec_lat_va]);
    return coords !== null;
  });

  // Add wells as dots
  dot_svg.append("g")
    .selectAll("circle")
    .data(validWells)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => projection([d.dec_long_va, d.dec_lat_va])[0])
    .attr("cy", d => projection([d.dec_long_va, d.dec_lat_va])[1])
    .attr("r", 3)
    .attr("fill", "#69b3a2")
    .attr("opacity", 0.8)
    .append("title")
    .text(d => `${d.station_nm}: ${d.depth_change}`);
})
