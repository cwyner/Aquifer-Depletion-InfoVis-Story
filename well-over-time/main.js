(() => {
    // Initial configuration
    let selectedStation = "";
    let selectedYear = "";
    const well_svg = d3.select("svg#well-drawing");
    const svgWidth = +well_svg.attr("width");
    const svgHeight = +well_svg.attr("height") + 550; // extra space to the SVG for the image
    well_svg.attr("height", svgHeight);
    const padding = { top: 290, right: 77, bottom: 125, left: 80 }; // Padding for graph
    const graphYOffset = 70; // Adjust based on the image height + spacing

    const axisGroup = well_svg.append("g").attr("class", "axis-group");
    const lineGroup = well_svg.append("g").attr("class", "line-group");
    const ticksGroup = well_svg.append("g").attr("class", "ticks-group");

    async function loadData() {
        const data = await d3.csv("well-over-time/well_depth.csv", d => ({
            station_nm: d.station_nm,
            year_datetime: d.year_datetime,
            avg_water_depth_ft: +d.avg_water_depth_ft,
        }));

        // Populate station options
        const stationOptions = Array.from(new Set(data.map(d => d.station_nm))).sort();

        d3.select("#station-select")
            .selectAll("option")
            .data(stationOptions)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        // default station selection
        selectedStation = stationOptions[0];

        // populate year dropdown dynamically based on the selected station
        updateYearOptions(data, selectedStation);

        // event listeners
        d3.select("#station-select").on("change", function () {
            selectedStation = this.value;
            updateYearOptions(data, selectedStation);
            updateChart(data);
        });

        d3.select("#year-select").on("change", function () {
            selectedYear = this.value;
            updateChart(data);
        });

        // chart initialization
        updateChart(data);

    }

    // update the chart based on filters
    function updateChart(data) {
        // filter data based on station and year
        const filteredData = data.filter(
            d => d.station_nm === selectedStation && d.year_datetime === selectedYear
        );

        // maximum depth calculation for the selected station across all years
        const maxDepth = d3.max(data.filter(d => d.station_nm === selectedStation), d => d.avg_water_depth_ft);
        const paddedMaxDepth = maxDepth * 1.1; // Add padding to the maximum value as to not reach the top of the chart

        // scales
        const xScale = d3.scaleBand() // Year
            .domain(filteredData.map(d => d.year_datetime))
            .range([padding.left, svgWidth - padding.right])
            .padding(0.1);

        const yScale = d3.scaleLinear() // Depth
            .domain([paddedMaxDepth, 0])
            .range([svgHeight - padding.bottom, padding.top]);

        // axes
        axisGroup.selectAll("*").remove();
        axisGroup.append("g")
            .attr("transform", `translate(0, ${svgHeight - padding.bottom})`)
            .call(d3.axisBottom(xScale));
        axisGroup.append("g")
            .attr("transform", `translate(${padding.left}, 0)`)
            .call(d3.axisLeft(yScale));

        // Y Gridlines
        const yGrid = d3.axisLeft(yScale)
            .tickSize(-(svgWidth - padding.left - padding.right))
            .tickFormat(""); // Remove tick labels for gridlines

        axisGroup.append("g")
            .attr("class", "y-grid")
            .attr("transform", `translate(${padding.left}, 0)`)
            .call(yGrid);

        const tickOffset = 35; // move the ticks down

        // tick lines on both sides of the bar
        datum = filteredData[0]
        const xleft = xScale(datum.year_datetime) + xScale.bandwidth() * .25;
        const xright = xScale(datum.year_datetime) + xScale.bandwidth() * .75;
        const ytop = padding.top + tickOffset
        console.log(svgHeight - padding.bottom)
        const ybottom = svgHeight - padding.bottom + graphYOffset;

        // left side lines
        ticksGroup.selectAll(".left-tick")
            .data(filteredData)
            .enter()
            .append("line")
            .attr("class", "left-tick")
            .attr("x1", xleft)
            .attr("y1", ytop)
            .attr("x2", xleft)
            .attr("y2", ybottom)
            .attr("stroke", "grey")
            .attr("stroke-width", 1);

        // right side lines
        ticksGroup.selectAll(".right-tick")
            .data(filteredData)
            .enter()
            .append("line")
            .attr("class", "right-tick")
            .attr("x1", xright)
            .attr("y1", ytop)
            .attr("x2", xright)
            .attr("y2", ybottom)
            .attr("stroke", "grey")
            .attr("stroke-width", 1);

        // image
        well_svg.append("image")
            .attr("xlink:href", "well-over-time/well-image.png") 
            .attr("x", (svgWidth - 715) / 2) // center horizontally
            .attr("y", padding.top - 250) 
            .attr("width", 650)
            .attr("height", 350);

        d3.select(".axis-group")
            .attr("transform", `translate(0, ${graphYOffset})`);
        d3.select(".line-group")
                .attr("transform", `translate(0, ${graphYOffset})`);

        // X-axis title
        well_svg.append("text")
            .attr("class", "x-axis-title")
            .attr("x", svgWidth / 2)
            .attr("y", svgHeight - 5)
            .attr("text-anchor", "middle")
            .text("Year");

        // Y-axis title
        well_svg.append("text")
            .attr("class", "y-axis-title")
            .attr("x", -svgHeight / 2 - 100)
            .attr("y", padding.left - 40)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Average Depth to Water (ft)");

        // bar
        const bars = lineGroup.selectAll("rect").data(filteredData);

        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("x", d => xScale(d.year_datetime) + xScale.bandwidth() * 0.25)
            .attr("y", d => yScale(d.avg_water_depth_ft))
            .attr("width", xScale.bandwidth() * 0.5)
            .attr("height", d => svgHeight - padding.bottom - yScale(d.avg_water_depth_ft))
            .attr("fill", "steelblue");

        bars.exit().remove();
    }

    // update the year dropdown based on the selected station
    function updateYearOptions(data, station) {
        const yearsForStation = Array.from(
            new Set(data.filter(d => d.station_nm === station).map(d => d.year_datetime))
        ).sort();

        const yearSelect = d3.select("#year-select");
        yearSelect.selectAll("option").remove();
        yearSelect
            .selectAll("option")
            .data(yearsForStation)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        // initialize the default year based on the station selection
        selectedYear = yearsForStation[0];
    }

    loadData();
})();
