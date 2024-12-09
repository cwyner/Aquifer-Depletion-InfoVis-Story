// Dimensions
const svg_width = 800;
const svg_height = 600;

// Padding
const chart_padding = { top: 5, bottom: 175, left: 75, right: 20 };

// Create SVG canvas
const chart_svg = d3.select("#top-depth-changes")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .append("g")
    .attr("transform", `translate(${chart_padding.left}, ${chart_padding.top})`); // Add padding

// Load CSV data
d3.csv("preprocessed_data/top_depth_changes.csv").then(data => {
    // Parse depth_change as numbers
    data.forEach(d => d.depth_change = +d.depth_change);

    // Adjust the usable width and height based on padding
    const usableWidth = svg_width - chart_padding.left - chart_padding.right;
    const usableHeight = svg_height - chart_padding.top - chart_padding.bottom;

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.station_nm)) // Well station_nms
      .range([0, usableWidth]) // Use padded width
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.depth_change)]) // Include negatives
      .nice() // Extend to nice round numbers
      .range([usableHeight, 0]); // Use padded height

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Append x-axis
    chart_svg.append("g")
      .attr("transform", `translate(0, ${usableHeight})`) // Align with bottom of padded area
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em")
      .attr("transform", "rotate(-45)");

    // Append y-axis
    chart_svg.append("g")
      .call(yAxis);

    // Bars
    chart_svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.station_nm)) // Use adjusted scale
      .attr("y", d => yScale(d.depth_change)) // Use adjusted scale
      .attr("width", xScale.bandwidth())
      .attr("height", d => Math.abs(yScale(d.depth_change) - yScale(0))) // Absolute difference for height
      .attr("fill", "#69b3a2"); // Bar color
}).catch(error => console.error(error));
