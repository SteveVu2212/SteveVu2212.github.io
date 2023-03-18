import { drawCumReturns_ } from "./modules/cumReturn.js";
import { drawAvgReturn_ } from "./modules/avgReturn.js";
import { drawExcessReturn_ } from "./modules/excessReturn.js";
import { drawAvgExcessReturn_ } from "./modules/avgExcessReturn.js";

async function draw() {
  // 1. Access data

  const df_avgReturn_20Yr = await d3.csv("data/20 years/avgReturn_20Yr.csv");
  const df_cumReturn_20Yr = await d3.csv("data/20 years/cumReturn_20Yr.csv");

  const df_avgReturn_15Yr = await d3.csv("data/15 years/avgReturn_15Yr.csv");
  const df_cumReturn_15Yr = await d3.csv("data/15 years/cumReturn_15Yr.csv");

  const df_avgReturn_10Yr = await d3.csv("data/10 years/avgReturn_10Yr.csv");
  const df_cumReturn_10Yr = await d3.csv("data/10 years/cumReturn_10Yr.csv");

  // console.log(df_avgReturn_10Yr);
  // console.log(df_cumReturn_10Yr);

  const defaultPlan = "Alabama ERS";
  const defaultBenchmarkType = "Empirical portfolio";
  const defaultPeriod = "10 years";

  let allPlanNames = new Array();
  df_avgReturn_10Yr.forEach((d) => allPlanNames.push(d.plan_name));

  const periodSelection = ["10 years", "15 years", "20 years"];
  const benchmarkTypeSelection = [
    "Empirical portfolio",
    "Standard portfolio",
    "Moderate portfolio",
    "Aggressive portfolio",
    "Conservative portfolio",
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

  $(document).ready(function () {
    $("#planDropdown").selectpicker({
      noneSelectedText: defaultPlan
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


  $(document).ready(function () {
    $("#benchmarkDropdown").selectpicker({
      noneSelectedText: defaultBenchmarkType,
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


  $(document).ready(function () {
    $("#periodDropdown").selectpicker({
      noneSelectedText: defaultPeriod,
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


  // Initial options
  let planSelected = defaultPlan;
  let benchmarkSelected = defaultBenchmarkType;
  let periodSelected = defaultPeriod;

  let df_avgReturn;
  let df_cumReturn;

  if (periodSelected == "10 years") {
    df_avgReturn = df_avgReturn_10Yr;
    df_cumReturn = df_cumReturn_10Yr;
  } else if (periodSelected == "15 years") {
    df_avgReturn = df_avgReturn_15Yr;
    df_cumReturn = df_cumReturn_15Yr;
  } else {
    df_avgReturn = df_avgReturn_20Yr;
    df_cumReturn = df_cumReturn_20Yr;
  }

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


  bounds_cummulativeReturn
    .append("line")
    .attr("class", "y-highlight")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", dimensions.boundedHeight)
    .style("opacity", 0)
    .style("stroke", "#d3d3d3")
    .style("stroke-width", "2px")
    .style("font-family", "inherit")


  const tooltip_cummulativeReturn = wrapper_cummulativeReturn
    .append("rect")
    .attr("x", 100)
    .attr("y", 100)
    .attr("width", 100)
    .attr("height", 50)
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

  wrapper_cummulativeReturn
    .append("line")
    .attr("class", "tooltip-blackline")
    .style("stroke", "black")
    .style("opacity", 1);

  wrapper_cummulativeReturn
    .append("text")
    .attr("class", "tooltiptext-year")
    .style("font-size", "10px")
    .style("fill", "black")
    .style("opacity", 1);


  // Add legend
  const colorScale = d3
    .scaleOrdinal()
    .domain(labels)
    .range(["#f63", "#2879CB"]);


  const legend_cummulativeReturn = bounds_cummulativeReturn.select(".legend");

  legend_cummulativeReturn
    .selectAll("circle")
    .data(labels)
    .join("circle")
    // .attr("cx", dimensions.boundedWidth * 0.1)
    // .attr("cy", (d, i) => (dimensions.boundedHeight * (i + 1)) / 10)
    .attr("cx", (d, i) => (dimensions.boundedWidth / 2) * (i + 0.1) - 7)
    .attr("cy", -15)
    .attr("r", 4)
    .style("fill", (d) => colorScale(d));

  legend_cummulativeReturn
    .selectAll("text")
    .data(labels)
    .join("text")
    // .attr("x", dimensions.margin.left)
    // .attr("y", (d, i) => (dimensions.boundedHeight * (i + 1)) / 9)
    .attr("x", (d, i) => (dimensions.boundedWidth / 2) * (i + 0.1))
    .attr("y", -10)
    .style("fill", "black")
    .text((d) => d);

  // Draw the frame of the average return chart

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
    .attr("class", "plan-name")
    // .attr("text-anchor", "middle")
    .attr("y", -20)
    .style("font-size", "10px")

  dot_excessReturn
    .append("text")
    .attr("class", "plan-excess-return")
    .attr("text-anchor", "middle")
    .attr("y", -5)
    .style("font-size", "10px")

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
    .style("font-family", "inherit")
    .text("Accrued Liability");

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
    .style("font-family", "inherit")
    .style("width", "300px")
    .text("");

  // Update charts with users' selection

  d3.select("#periodDropdown").on("change", function (e) {
    e.preventDefault();
    periodSelected = this.value;

    if (periodSelected == "10 years") {
      df_avgReturn = df_avgReturn_10Yr;
      df_cumReturn = df_cumReturn_10Yr;
    } else if (periodSelected == "15 years") {
      df_avgReturn = df_avgReturn_15Yr;
      df_cumReturn = df_cumReturn_15Yr;
    } else {
      df_avgReturn = df_avgReturn_20Yr;
      df_cumReturn = df_cumReturn_20Yr;
    }

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
