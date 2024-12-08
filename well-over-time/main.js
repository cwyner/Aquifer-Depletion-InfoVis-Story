// Initial configuration
let selectedStation = "";
let selectedYear = "";

async function loadData() {
    const well_svg = d3.select("svg#well-drawing");
    const svgWidth = +well_svg.attr("width");
    const svgHeight = +well_svg.attr("height") + 550; // Add extra space to the SVG for the image
    well_svg.attr("height", svgHeight);
    const padding = { top: 290, right: 77, bottom: 125, left: 80 }; // Increased left padding
    const graphYOffset = 70; // Adjust based on the image height + spacing

    const axisGroup = well_svg.append("g").attr("class", "axis-group");
    const lineGroup = well_svg.append("g").attr("class", "line-group");
    const ticksGroup = well_svg.append("g").attr("class", "ticks-group");

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

    // Initialize default station selection
    selectedStation = stationOptions[0];

    // Populate the year dropdown dynamically based on the selected station
    updateYearOptions(data, selectedStation);

    // Add event listeners
    d3.select("#station-select").on("change", function () {
        selectedStation = this.value;
        updateYearOptions(data, selectedStation);
        updateChart(data);
    });

    d3.select("#year-select").on("change", function () {
        selectedYear = this.value;
        updateChart(data);
    });

    // Initialize chart
    updateChart(data, padding);

    // Function to update the chart based on selected filters
    function updateChart(data, padding) {
        // Filter data based on selected station and year
        const filteredData = data.filter(
            d => d.station_nm === selectedStation && d.year_datetime === selectedYear
        );

        // Calculate the maximum depth for the selected station across all years
        const maxDepth = d3.max(data.filter(d => d.station_nm === selectedStation), d => d.avg_water_depth_ft);
        const paddedMaxDepth = maxDepth * 1.1; // Add 10% padding to the maximum value

        // Scales
        const xScale = d3.scaleBand() // Year on the x-axis (band scale)
            .domain(filteredData.map(d => d.year_datetime))
            .range([padding.left, svgWidth - padding.right])
            .padding(0.1);

        const yScale = d3.scaleLinear() // Depth on the y-axis (linear scale)
            .domain([paddedMaxDepth, 0]) // Set the max depth for the y-axis across all years
            .range([svgHeight - padding.bottom, padding.top]);

        // Axes
        axisGroup.selectAll("*").remove();
        axisGroup.append("g")
            .attr("transform", `translate(0, ${svgHeight - padding.bottom})`)
            .call(d3.axisBottom(xScale));
        axisGroup.append("g")
            .attr("transform", `translate(${padding.left}, 0)`)
            .call(d3.axisLeft(yScale));

        // Add Y Gridlines
        const yGrid = d3.axisLeft(yScale)
            .tickSize(-(svgWidth - padding.left - padding.right))
            .tickFormat(""); // Remove tick labels for gridlines

        axisGroup.append("g")
            .attr("class", "y-grid")
            .attr("transform", `translate(${padding.left}, 0)`)
            .call(yGrid);

        const tickOffset = 35; // Offset to move the ticks down 100px
        const tickLength = 350; // Length of the tick lines

        // Add tick lines on both sides of the bars

        datum = filteredData[0]
        const xleft = xScale(datum.year_datetime) + xScale.bandwidth() * .25;
        const xright = xScale(datum.year_datetime) + xScale.bandwidth() * .75;
        const ytop = padding.top + tickOffset
        console.log(svgHeight - padding.bottom)
        const ybottom = svgHeight - padding.bottom + graphYOffset;

        // Left side ticks
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

        // Right side ticks
        ticksGroup.selectAll(".right-tick")
            .data(filteredData)
            .enter()
            .append("line")
            .attr("class", "right-tick")
            .attr("x1", xright) // Right side of the bar
            .attr("y1", ytop) // Start from the top of the chart + offset
            .attr("x2", xright) // Same x position for vertical line
            .attr("y2", ybottom) // Extend 400px down from the bar height + offset
            .attr("stroke", "grey")
            .attr("stroke-width", 1);

        // Chart Title

        const titlePadding = 270; // Add extra padding for the title

        well_svg.append("text")
            .attr("class", "chart-title")
            .attr("x", (padding.left + svgWidth - padding.right) / 2)
            .attr("y", padding.top - titlePadding) // Add the additional padding here
            .attr("text-anchor", "middle")
            .text("Average Depth to Water Over Time by Site");


        //Image
        well_svg.append("image")
            .attr("xlink:href", "well-over-time/well-image.png") // Path to your image
            .attr("x", (svgWidth - 715) / 2) // Center the image horizontally
            .attr("y", padding.top - 250) // Position the image
            .attr("width", 650) // Image width
            .attr("height", 350); // Image height

        d3.select(".axis-group")
            .attr("transform", `translate(0, ${graphYOffset})`);
        d3.select(".line-group")
                .attr("transform", `translate(0, ${graphYOffset})`);


        // X-axis Title
        well_svg.append("text")
            .attr("class", "x-axis-title")
            .attr("x", svgWidth / 2)
            .attr("y", svgHeight - 5)
            .attr("text-anchor", "middle")
            .text("Year");

        // Y-axis Title
        well_svg.append("text")
            .attr("class", "y-axis-title")
            .attr("x", -svgHeight / 2 - 100)
            .attr("y", padding.left - 40)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Average Depth to Water (ft)");

        // Bars
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
}

// Function to update the year dropdown based on the selected station
function updateYearOptions(data, station) {
    const yearsForStation = Array.from(
        new Set(data.filter(d => d.station_nm === station).map(d => d.year_datetime))
    ).sort();

    // Update the year dropdown
    const yearSelect = d3.select("#year-select");
    yearSelect.selectAll("option").remove();
    yearSelect
        .selectAll("option")
        .data(yearsForStation)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Initialize the default year based on the station selection
    selectedYear = yearsForStation[0];
}



loadData();
