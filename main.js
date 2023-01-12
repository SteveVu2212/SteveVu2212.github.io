import { drawCumReturns_ } from "./modules/cumReturn.js";
import { drawAvgReturn_ } from "./modules/avgReturn.js";
import { drawExcessReturn_ } from "./modules/excessReturn.js";
import { drawAvgExcessReturn_ } from "./modules/avgExcessReturn.js";

async function draw() {
  // 1. Access data
  const df_avgReturn_15Yr_253 = await d3.csv("data/avgReturn_15Yr_253.csv");
  const df_cumReturn_15Yr_253 = await d3.csv("data/cumReturn_15Yr_253.csv");

  const df_avgReturn_10Yr_253 = await d3.csv("data/avgReturn_10Yr_253.csv");
  const df_cumReturn_10Yr_253 = await d3.csv("data/cumReturn_10Yr_253.csv");

  const defaultPlan = "Alabama ERS";
  const defaultBenchmarkType = "Optimal benchmark";
  const defaultPeriod = "10 years";

  let allPlanNames = new Array();
  df_avgReturn_15Yr_253.forEach((d) => allPlanNames.push(d.plan_name));

  const periodSelection = ["10 years", "15 years"];
  const benchmarkTypeSelection = [
    "Optimal benchmark",
    "NonUSEquity(20%)-USEquity(50%)-USBond(30%)",
  ];
  const labels = ["Cumulative actual return", "Cumulative benchmark return"];

  const getWindowWidth = () => {
    return window.innerWidth;
  };
  // 2. Create chart dimensions
  const padding = 1;
  let dimensions = {
    width: 500,
    height: 300,
    margin: {
      top: 50,
      right: 20,
      bottom: 50,
      left: 50,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // Users' selection - Add dropdowns
  // const userSelection = d3.select("#userSelection")

  // d3.select("#pensionPlans")
  //     .selectAll("option")
  //     .data(allPlanNames)
  //     .join("option")
  //     .text(d => d)
  //     .attr("value", d => d)

  $(document).ready(function () {
    $("#planDropdown").selectpicker({
      noneSelectedText: "Select a plan",
    });

    d3.select("#planDropdown")
      .selectAll("option")
      .data(allPlanNames)
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d);
    $("#planDropdown").selectpicker("refresh");
  });

  // d3.select("#planDropdown")
  //     .selectAll("option")
  //     .data(allPlanNames)
  //     .join("option")
  //     .text(d => d)
  //     .attr("value", d => d)

  $(document).ready(function () {
    $("#benchmarkDropdown").selectpicker({
      noneSelectedText: "Select a benchmark",
    });

    d3.select("#benchmarkDropdown")
      .selectAll("option")
      .data(benchmarkTypeSelection)
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d);
    $("#benchmarkDropdown").selectpicker("refresh");
  });

  //   d3.select("#pensionBenchmarks")
  //     .selectAll("option")
  //     .data(benchmarkTypeSelection)
  //     .join("option")
  //     .text((d) => d)
  //     .attr("value", (d) => d);

  $(document).ready(function () {
    $("#periodDropdown").selectpicker({
      noneSelectedText: "Select a period",
    });

    d3.select("#periodDropdown")
      .selectAll("option")
      .data(periodSelection)
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d);
    $("#periodDropdown").selectpicker("refresh");
  });

  //   d3.select("#pensionPeriods")
  //     .selectAll("option")
  //     .data(periodSelection)
  //     .join("option")
  //     .text((d) => d)
  //     .attr("value", (d) => d);

  // Initial options
  let planSelected = defaultPlan;
  let benchmarkSelected = defaultBenchmarkType;
  let periodSelected = defaultPeriod;

  let df_avgReturn =
    periodSelected == "10 years"
      ? df_avgReturn_10Yr_253
      : df_avgReturn_15Yr_253;
  let df_cumReturn =
    periodSelected == "10 years"
      ? df_cumReturn_10Yr_253
      : df_cumReturn_15Yr_253;
  // Draw the frame of the cummulative return chart

  const wrapper_cummulativeReturn = d3
    .select("#wrapper-cummulativeReturn")
    .append("svg")
    .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  const bounds_cummulativeReturn = wrapper_cummulativeReturn
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  bounds_cummulativeReturn
    .append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  bounds_cummulativeReturn.append("g").attr("class", "y-axis");

  bounds_cummulativeReturn.append("g").attr("class", "pathActualReturn");

  bounds_cummulativeReturn.append("g").attr("class", "pathBenchmarkReturn");

  bounds_cummulativeReturn.append("g").attr("class", "legend");

//   bounds_cummulativeReturn.append("text").attr("class", "title");

  //   bounds_cummulativeReturn.append("g").attr("class", "tip-area")
  //         .append('svg:rect')
  //         .attr('width', dimensions.boundedWidth)
  //         .attr('height', dimensions.boundedHeight)
  //         .attr('pointer-events', 'all')
  //         .style('opacity', 0.5)

  bounds_cummulativeReturn
    .append("line")
    .attr("class", "y-highlight")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", dimensions.boundedHeight)
    .style("opacity", 0)
    .style("stroke", "#d3d3d3")
    .style("stroke-width", "2px");

  //   const tooltip_cummulativeReturn = d3.select('body')
  //     .append("div")
  //     .attr("class", "tooltip")
  //     .style("opacity", 0)

  const tooltip_cummulativeReturn = wrapper_cummulativeReturn
    .append("rect")
    .attr("x", 100)
    .attr("y", 100)
    .attr("width", 100)
    .attr("height", 50)
    // .style("stroke", "red")
    .style("fill", "none")
    .style("opacity", 0);

  wrapper_cummulativeReturn
    .append("text")
    .attr("class", "tooltiptext-actualReturn")
    .style("font-size", "10px")
    .style("fill", "#f63")
    .style("opacity", 1);

  wrapper_cummulativeReturn
    .append("text")
    .attr("class", "tooltiptext-becnhmarkReturn")
    .style("font-size", "10px")
    .style("fill", "#2879cb")
    .style("opacity", 1);

//   const dot_cummulativeReturn = bounds_cummulativeReturn
//     .append("g")
//     .attr("class", "dot")
//     .style("display", "none");

//   dot_cummulativeReturn.append("circle").attr("r", 2.5);

  // Add legend
  const colorScale = d3
    .scaleOrdinal()
    .domain(labels)
    .range(["#f63", "#2879CB"]);

//   const labelDots = bounds_cummulativeReturn
//     .append("g")
//     .attr("class", "labeldots");

  const legend_cummulativeReturn = bounds_cummulativeReturn.select(".legend");

  legend_cummulativeReturn
    .selectAll("circle")
    .data(labels)
    .join("circle")
    // .attr("cx", dimensions.boundedWidth * 0.1)
    // .attr("cy", (d, i) => (dimensions.boundedHeight * (i + 1)) / 10)
    .attr("cx", (d, i) => (dimensions.boundedWidth/2 * (i + 0.1)) - 7)
    .attr("cy", -15)
    .attr("r", 4)
    .style("fill", (d) => colorScale(d));

  legend_cummulativeReturn
    .selectAll("text")
    .data(labels)
    .join("text")
    // .attr("x", dimensions.margin.left)
    // .attr("y", (d, i) => (dimensions.boundedHeight * (i + 1)) / 9)
    .attr("x", (d,i) => (dimensions.boundedWidth/2 * (i + 0.1)))
    .attr("y", -10)
    .style("fill", "black")
    .text((d) => d);

  // Draw the frame of the average return chart

  // const wrapper_avgReturn = d3.select("#wrapper-avgReturn")
  //     .append("svg")
  //     .attr("width", dimensions.width / 2)
  //     .attr("height", dimensions.height)

  // const bounds_avgReturn = wrapper_avgReturn.append("g")
  //     .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)

  // bounds_avgReturn.append("g")
  //     .attr("class", "circleAvgReturn")

  // bounds_avgReturn.append("g")
  //     .attr("class", "y-axis")
  //     .style("transform", `translateX(${dimensions.width/4}px)`)

  // Draw the frame of the excess return chart

  const wrapper_excessReturn = d3
    .select("#wrapper-excessReturn")
    .append("svg")
    .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  const bounds_excessReturn = wrapper_excessReturn
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
    );

  bounds_excessReturn
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${dimensions.boundedHeight})`);

  bounds_excessReturn.append("g").attr("class", "y-axis");

  bounds_excessReturn.append("g").attr("class", "pathExcessReturn");

  bounds_excessReturn.append("line").attr("class", "zeroLineExcessReturn");


  const dot_excessReturn = bounds_excessReturn
    .append("g")
    .attr("class", "dot")
    .attr("display", "none");

  dot_excessReturn.append("circle").attr("r", 2.5);

  dot_excessReturn
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", -8);

  // Draw the frame of the average excess return chart

  const avgReturn_dimensions = {
    width: dimensions.width * 2,
    height: dimensions.height * 1.5,
    margin: {
      top: 30,
      right: 20,
      bottom: 50,
      left: 50,
    },
    padding: 1,
  };

  avgReturn_dimensions.boundedWidth =
    avgReturn_dimensions.width -
    avgReturn_dimensions.margin.left -
    avgReturn_dimensions.margin.right;
  avgReturn_dimensions.boundedHeight =
    avgReturn_dimensions.height -
    avgReturn_dimensions.margin.top -
    avgReturn_dimensions.margin.bottom;

  const wrapper_avgExcessReturn = d3
    .select("#wrapper-avgExcessReturn")
    .append("svg")
    .attr(
      "viewBox",
      `0 0 ${avgReturn_dimensions.width} ${avgReturn_dimensions.height}`
    );

  const bounds_avgExcessReturn = wrapper_avgExcessReturn
    .append("g")
    .style(
      "transform",
      `translate(${avgReturn_dimensions.margin.left * 2.0}px, ${
        avgReturn_dimensions.margin.top
      }px)`
    );

  bounds_avgExcessReturn
    .append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${avgReturn_dimensions.boundedHeight}px)`);

  bounds_avgExcessReturn.append("g").attr("class", "bubbleAvgExcessReturn");

  bounds_avgExcessReturn.append("line").attr("class", "zeroLine");

//   bounds_avgExcessReturn.append("text").attr("class", "title");

  let legend = wrapper_avgExcessReturn
    .append("g")
    .attr("id", "legend")
    .style(
      "transform",
      `translate(${avgReturn_dimensions.margin.left}px, ${avgReturn_dimensions.margin.top}px)`
    );

  legend
    .append("text")
    .attr("class", "axistitle")
    .attr("x", 80)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .text("Actuarial Accrued Liability");

  const tooltip_avgExcessReturn = d3
    .select("#wrapper-avgExcessReturn")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("color", "white")
    .style("padding", "8px")
    .style("background-color", "#626D71")
    .style("border-radius", "6px")
    .style("text-align", "center")
    .style("font-family", "monospace")
    .style("width", "400px")
    .text("");

  // Update charts with users' selection

  d3.select("#periodDropdown").on("change", function (e) {
    e.preventDefault();
    periodSelected = this.value;
    df_avgReturn =
      periodSelected == "10 years"
        ? df_avgReturn_10Yr_253
        : df_avgReturn_15Yr_253;
    df_cumReturn =
      periodSelected == "10 years"
        ? df_cumReturn_10Yr_253
        : df_cumReturn_15Yr_253;
    drawCumReturns_(
      df_cumReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      bounds_cummulativeReturn,
      wrapper_cummulativeReturn,
      tooltip_cummulativeReturn
    );
    drawAvgReturn_(
      df_avgReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      periodSelected
    );
    drawExcessReturn_(
      df_cumReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      bounds_excessReturn,
      wrapper_excessReturn,
      dot_excessReturn
    );
    drawAvgExcessReturn_(
      df_avgReturn,
      avgReturn_dimensions,
      planSelected,
      benchmarkSelected,
      bounds_avgExcessReturn,
      legend,
      tooltip_avgExcessReturn
    );
  });

  d3.select("#benchmarkDropdown").on("change", function (e) {
    e.preventDefault();
    benchmarkSelected = this.value;
    drawCumReturns_(
      df_cumReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      bounds_cummulativeReturn,
      wrapper_cummulativeReturn,
      tooltip_cummulativeReturn
    );
    drawAvgReturn_(
      df_avgReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      periodSelected
    );
    drawExcessReturn_(
      df_cumReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      bounds_excessReturn,
      wrapper_excessReturn,
      dot_excessReturn
    );
    drawAvgExcessReturn_(
      df_avgReturn,
      avgReturn_dimensions,
      planSelected,
      benchmarkSelected,
      bounds_avgExcessReturn,
      legend,
      tooltip_avgExcessReturn
    );
  });

  // d3.select("#planSelection")
  d3.select("#planDropdown").on("change", function (e) {
    e.preventDefault();
    planSelected = this.value;
    drawCumReturns_(
      df_cumReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      bounds_cummulativeReturn,
      wrapper_cummulativeReturn,
      tooltip_cummulativeReturn
    );
    drawAvgReturn_(
      df_avgReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      periodSelected
    );
    drawExcessReturn_(
      df_cumReturn,
      dimensions,
      planSelected,
      benchmarkSelected,
      bounds_excessReturn,
      wrapper_excessReturn,
      dot_excessReturn
    );
    drawAvgExcessReturn_(
      df_avgReturn,
      avgReturn_dimensions,
      planSelected,
      benchmarkSelected,
      bounds_avgExcessReturn,
      legend,
      tooltip_avgExcessReturn
    );
  });

  drawCumReturns_(
    df_cumReturn,
    dimensions,
    planSelected,
    benchmarkSelected,
    bounds_cummulativeReturn,
    wrapper_cummulativeReturn,
    tooltip_cummulativeReturn
  );
  drawAvgReturn_(
    df_avgReturn,
    dimensions,
    planSelected,
    benchmarkSelected,
    periodSelected
  );
  drawExcessReturn_(
    df_cumReturn,
    dimensions,
    planSelected,
    benchmarkSelected,
    bounds_excessReturn,
    wrapper_excessReturn,
    dot_excessReturn
  );
  drawAvgExcessReturn_(
    df_avgReturn,
    avgReturn_dimensions,
    planSelected,
    benchmarkSelected,
    bounds_avgExcessReturn,
    legend,
    tooltip_avgExcessReturn
  );
}

draw();
