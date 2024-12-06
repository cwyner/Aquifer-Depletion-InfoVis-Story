const svg = d3.select("svg");
const svgWidth = +svg.attr("width");
const svgHeight = +svg.attr("height");
const padding = { top: 20, right: 30, bottom: 50, left: 50 };

const axisGroup = svg.append("g").attr("class", "axis-group");
const lineGroup = svg.append("g").attr("class", "line-group");

// Initial configuration
let selectedStation = "";
let selectedYear = "";

async function loadData() {
    const data = await d3.csv("well_depth.csv", d => ({
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
    updateChart(data);
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

// Function to update the chart based on selected filters
function updateChart(data) {
    // Filter data based on selected station and year (no depth range filter)
    const filteredData = data.filter(
        d => d.station_nm === selectedStation && d.year_datetime === selectedYear
    );

    // Calculate the maximum depth for the selected station across all years
    const maxDepth = d3.max(data.filter(d => d.station_nm === selectedStation), d => d.avg_water_depth_ft);

    // Scales
    const xScale = d3.scaleBand()  // Year on the x-axis (band scale)
        .domain(filteredData.map(d => d.year_datetime))
        .range([padding.left, svgWidth - padding.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()  // Depth on the y-axis (linear scale)
        .domain([0, maxDepth])  // Set the max depth for the y-axis across all years
        .range([svgHeight - padding.bottom, padding.top]);

    // Axes
    axisGroup.selectAll("*").remove();
    axisGroup.append("g")
        .attr("transform", `translate(0, ${svgHeight - padding.bottom})`)
        .call(d3.axisBottom(xScale));
    axisGroup.append("g")
        .attr("transform", `translate(${padding.left}, 0)`)
        .call(d3.axisLeft(yScale));

    // Bars
    const bars = lineGroup.selectAll("rect").data(filteredData);

    bars.enter()
        .append("rect")
        .merge(bars)
        .attr("x", d => xScale(d.year_datetime))
        .attr("y", d => yScale(d.avg_water_depth_ft))
        .attr("width", xScale.bandwidth())
        .attr("height", d => svgHeight - padding.bottom - yScale(d.avg_water_depth_ft))
        .attr("fill", "steelblue");

    bars.exit().remove();
}

loadData();
