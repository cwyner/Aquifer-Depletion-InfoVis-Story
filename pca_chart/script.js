(() => {
	// Dimensions for line plots
	const plotWidth = 800, plotHeight = 50, plotMargin = { top: 10, right: 10, bottom: 10, left: 50 };

	// Map dimensions
	const mapWidth = 800, mapHeight = 400;

	// Load CSV data
	Promise.all([
	  d3.csv("pca_chart/pca_scores.csv"),
	  d3.csv("pca_chart/pca_loadings.csv"),
	  d3.json("States_Dropoff/us-states-simple.json")
	]).then(([scores, loadings, geojson]) => {

	  // Parse data
	  scores.forEach(d => {
		d.lat = +d.lat;
		d.lon = +d.lon;
		for (let i = 1; i <= 10; i++) d[`PC${i}`] = +d[`PC${i}`];
	  });

	  loadings.forEach(d => {
		for (let i = 1; i <= 10; i++) d[`PC${i}`] = +d[`PC${i}`];
	  });

	  // Line plots for PCs
	  const linePlots = d3.select("#line-plots")
		.selectAll(".line-plot")
		.data(d3.range(1, 11))
		.join("svg")
		.attr("class", "line-plot")
		.attr("width", plotWidth)
		.attr("height", plotHeight)
		.on("click", (_, i) => updateMap(i)); // Update map on click

	  linePlots.each(function(pci) {
		const svg = d3.select(this);
		const xScale = d3.scaleLinear()
		  .domain([0, loadings.length - 1])
		  .range([plotMargin.left, plotWidth - plotMargin.right]);

		const yScale = d3.scaleLinear()
		  .domain(d3.extent(loadings, d => d[`PC${pci}`]))
		  .range([plotHeight - plotMargin.bottom, plotMargin.top]);

		const line = d3.line()
		  .x((_, i) => xScale(i))
		  .y(d => yScale(d[`PC${pci}`]));

		svg.append("path")
		  .datum(loadings)
		  .attr("fill", "none")
		  .attr("stroke", "steelblue")
		  .attr("stroke-width", 1.5)
		  .attr("d", line);

		svg.append("text")
		  .attr("x", plotMargin.left)
		  .attr("y", plotMargin.top)
		  .text(`PC${pci}`)
		  .attr("font-size", "12px")
		  .attr("fill", "black");
	  });

	  // Map for geospatial PCA scores
	  const mapSvg = d3.select("#pcamap")
		.append("svg")
		.attr("width", mapWidth)
		.attr("height", mapHeight);

	  const projection = d3.geoAlbersUsa()
		.scale(1000) // Adjust as necessary
		.translate([mapWidth / 2, mapHeight / 2]);

	  const colorScale = d3.scaleDiverging(d3.interpolateRdBu);

	  const path = d3.geoPath().projection(projection);
		mapSvg.append("g")
		  .selectAll("path")
		  .data(geojson.features) // Use GeoJSON features directly
		  .join("path")
		  .attr("fill", "#e0e0e0")
		  .attr("stroke", "#999")
		  .attr("d", path);

	  function updateMap(pc) {
		const extent = d3.extent(scores, d => d[`PC${pc}`]);
		colorScale.domain([extent[1], 0, extent[0]]);

		scores = scores.filter(d => projection([d.lon, d.lat]))

		const circles = mapSvg.selectAll("circle")
		  .data(scores)
		  .join("circle")
		  .attr("cx", d => projection([d.lon, d.lat])[0])
		  .attr("cy", d => projection([d.lon, d.lat])[1])
		  .attr("r", 5)
		  .attr("fill", d => colorScale(d[`PC${pc}`]))
		  .attr("opacity", 0.7);

		mapSvg.selectAll("text")
		  .data([`Displaying PC${pc}`])
		  .join("text")
		  .attr("x", 20)
		  .attr("y", 20)
		  .text(d => d)
		  .attr("font-size", "16px")
		  .attr("fill", "black");
	  }

	  // Initialize with PC1
	  updateMap(1);
	});
})();
