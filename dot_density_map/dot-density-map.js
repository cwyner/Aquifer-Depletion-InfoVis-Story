const width = 960;
const height = 600;

const hist_width = 500;
const hist_height = 500;

const padding = 50; // Padding on all sides

// Define SVG canvas
const svg = d3.select("#dot-density-map");
const histogram_svg = d3.select("#histogram");

// Add a light blue background
svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "#add8e6"); // Light blue color

// Define a projection and path generator
const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1200);
const path = d3.geoPath().projection(projection);

// Define a diverging color scale
const colorScale = d3.scaleDiverging(["green", "yellow", "red"])
  .domain([-10, 0, 10])
  .clamp(true)

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
  svg.append("g")
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
  svg.append("g")
    .selectAll("circle")
    .data(validWells)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => projection([d.dec_long_va, d.dec_lat_va])[0])
    .attr("cy", d => projection([d.dec_long_va, d.dec_lat_va])[1])
    .attr("r", 3)
    .attr("fill", d => colorScale(d.depth_change))
    .attr("opacity", 0.8)
    .append("title")
    .text(d => `${d.station_nm}: ${d.depth_change}`);
  
  // Add brushing functionality
  const brush = d3.brush()
    .extent([[0, 0], [width, height]]) // Brush area
    .on("end", updateSelectedWells);

  svg.append("g")
    .attr("class", "brush")
    .call(brush);

  // Scales for x and y axes
  let xScale = d3.scaleLinear()
  .domain([-30, 30]) // Match histogram domain
  .range([padding, hist_width - padding]); // Match SVG width with padding

  let yScale = d3.scaleLinear()
    .domain([0, 50]) // Bin counts
    .range([hist_height - padding, padding]); // Inverted range for SVG height
  
  // Add x-axis
  let xAxis = d3.axisBottom(xScale).ticks(10);
  histogram_svg.append("g")
    .attr("transform", `translate(0, ${hist_height - padding})`) // Bottom of the histogram
    .call(xAxis);

  // Add y-axis
  let yAxis = d3.axisLeft(yScale).ticks(5);
  const yAxisGroup = histogram_svg.append("g")
    .attr("transform", `translate(${padding}, 0)`); // Left of the histogram
  yAxisGroup.call(yAxis);

  // Display average depth change
  const avgText = histogram_svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", hist_width / 2)
    .attr("y", 20)
    .style("font-size", "14px")
    .text("Average Depth Change:");
  
  // Add x-axis label
  histogram_svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", hist_width / 2) // Centered horizontally
    .attr("y", hist_height - 10) // Below the x-axis
    .style("font-size", "14px")
    .text("Depth Change (ft)");

  // Add y-axis label
  histogram_svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", -(hist_height / 2)) // Centered vertically
    .attr("y", 20) // To the left of the y-axis
    .attr("transform", "rotate(-90)") // Rotate the text
    .style("font-size", "14px")
    .text("Number of Wells");

  // Update selected wells and calculate average depth change
  function updateSelectedWells(event) {
    const selection = event.selection;
    if (!selection) {
      // Reset if no area is selected
      avgText.text("Average Depth Change: N/A");
      return;
    }

    const [[x0, y0], [x1, y1]] = selection;

    // Filter wells within the brush selection
    const selectedWells = validWells.filter(d => {
      const [x, y] = projection([d.dec_long_va, d.dec_lat_va]);
      return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    });

    // Calculate average depth change
    const avgDepthChange =
      selectedWells.reduce((sum, d) => sum + d.depth_change, 0) /
      selectedWells.length;

    // Update the display text
    avgText.text(
      `Average Depth Change: ${
        selectedWells.length > 0 ? avgDepthChange.toFixed(2) : "N/A"
      }`
    );

    function updateHistogram(selectedWells) {
      const histogram = d3.histogram()
        .value(d => Math.min(Math.max(d.depth_change, -30), 30)) // Clamp values
        .domain([-30, 30]) // Match the data range
        .thresholds(d3.range(-30, 31, 10)); // Bin size
    
      const bins = histogram(selectedWells);

      yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)]) // Bin counts
        .range([hist_height - padding, padding]); // Inverted range for SVG height
    
      // Clear old bins and axes
      histogram_svg.selectAll("rect").remove();
    
      // Draw histogram bars
      histogram_svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1) // Subtract 1 for spacing
        .attr("height", d => hist_height - padding - yScale(d.length)) // Inverted height
        .attr("fill", "#69b3a2");
    
      // Update y-axis
      yAxis = d3.axisLeft(yScale).ticks(5);
      yAxisGroup.call(yAxis)
    }          
    updateHistogram(selectedWells);
  }
}).catch(err => console.error("Error loading data:", err));
