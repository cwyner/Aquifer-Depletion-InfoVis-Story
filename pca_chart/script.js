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
	  loadings.forEach(d => {
      for (let i = 1; i <= 10; i++) d[`PC${i}`] = +d[`PC${i}`];
	  });
    maxval_of_pc = Array(11);
    for (let i = 1; i <= 10; i++) {
      pc = `PC${i}`;
      maxval_of_pc[i] = d3.max(loadings.map(a => Math.abs(a[pc])))
    }
	  scores.forEach(d => {
      d.lat = +d.lat;
      d.lon = +d.lon;
      for (let i = 1; i <= 10; i++) d[`PC${i}`] = +d[`PC${i}`];
      for (let i = 1; i <= 10; i++) d[`PC${i}`] = d[`PC${i}`] * maxval_of_pc[i];
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
		  .domain([Math.min(0, d3.min(loadings, d => d[`PC${pci}`])), d3.max(loadings, d => d[`PC${pci}`])])
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

    svg.append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(366))
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', 'red')
      .attr('stroke-width', 1);

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
		.scale(800)
		.translate([mapWidth / 2, mapHeight / 2]);

    scores = scores.filter(d => projection([d.lon, d.lat]))

	  const colorScale = d3.scaleDiverging(d3.interpolateRdBu);

	  const path = d3.geoPath().projection(projection);
		mapSvg.append("g")
		  .selectAll("path")
		  .data(geojson.features) // Use GeoJSON features directly
		  .join("path")
		  .attr("fill", "#e0e0e0")
		  .attr("stroke", "#999")
		  .attr("d", path);

	  // Legend setup
	  const defs = mapSvg.append("defs");
	  const linearGradient = defs.append("linearGradient")
		.attr("id", "legend-gradient")
		.attr("x1", "0%")
		.attr("x2", "0%")
		.attr("y1", "0%")
		.attr("y2", "100%");

	  mapSvg.append("rect")
		.attr("x", 60)
		.attr("y", 60)
		.attr("width", 20)
		.attr("height", 220)
		.style("fill", "url(#legend-gradient)");

    mapSvg.append('g').attr('class', 'legendaxis');

	  // Axis ticks

	  function updateMap(pc) {
      pc = `PC${pc}`;

      scores = scores.sort((a,b) => Math.abs(a[pc]) - Math.abs(b[pc]));

      const extent = d3.extent(scores, d => d[pc]);
      colorScale.domain([extent[1], 0, extent[0]]);

      const circles = mapSvg.selectAll("circle")
        .data(scores)
        .join("circle")
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", 3)
        .attr("fill", d => colorScale(d[pc]))
        .attr("opacity", 0.7);

      mapSvg.selectAll("text.label")
        .data([`Displaying ${pc}`])
        .join("text")
          .attr("class", "label")
        .attr("x", 20)
        .attr("y", 20)
        .text(d => d)
        .attr("font-size", "16px")
        .attr("fill", "black")

      linearGradient.selectAll("stop")
        .data(colorScale.ticks(100).map((t, i, nodes) => ({
          offset: `${(100 * i) / (nodes.length - 1)}%`,
          color: colorScale(t),
        })))
        .join("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

      const dom = colorScale.domain()
      const range = [dom[0], dom[dom.length-1]]
      const legendScale = d3.scaleLinear()
        .domain(range)
        .range([0, 220]);

      function arange(start, end, n) {
        const step = (end-start)/n
        return d3.range(start, end+step+1, (end-start)/n)
      }

      const axisLeft = d3.axisLeft(legendScale)
        .ticks(5);

      mapSvg.select("g.legendaxis")
        .attr("transform", `translate(60, 60)`)
        .call(axisLeft);
	  }

	  // Initialize with PC1
	  updateMap(1);
	});
})();
