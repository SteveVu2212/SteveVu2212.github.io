function drawCumReturns_(
  data,
  dimensions,
  plan,
  benchmark,
  bound,
  wrapper,
  tooltip
) {
  // Access data
  const subDataset = data.filter((d) => d.plan_name === plan);

  const actualReturnAccessor = (d) => parseFloat(d.cum_return);
  const yearAccessor = (d) => parseInt(d.fy);

  // const xtickValues = d3.range(
  //   d3.min(subDataset, yearAccessor),
  //   d3.max(subDataset, yearAccessor) + 1,
  //   1
  // );

  let benchmarkReturnAccessor;
  if (benchmark === "Empirical portfolio") {
    benchmarkReturnAccessor = (d) => parseFloat(d.cum_opt_benchmark_return);
  } else if (benchmark == "Standard portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.cum_standard_pension_benchmark_return);
  } else if (benchmark == "Moderate portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.cum_moderate_benchmark_return);
  } else if (benchmark == "Aggressive portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.cum_aggressive_benchmark_return);
  } else if (benchmark == "Conservative portfolio") {
    benchmarkReturnAccessor = (d) =>
      parseFloat(d.cum_conservative_benchmark_return);
  }

  const yearValue = d3.map(subDataset, yearAccessor);
  const actualReturnValue = d3.map(subDataset, actualReturnAccessor);
  const benchmarkReturnValue = d3.map(subDataset, benchmarkReturnAccessor);
  const I = d3.map(subDataset, (_, i) => i);
  const O = d3.map(subDataset, (d) => d);

  // Create scales
  const xDomain = d3.extent(subDataset, yearAccessor);
  //   const yDomain = [
  //     d3.min(actualReturnValue.concat(benchmarkReturnValue)),
  //     d3.max(actualReturnValue.concat(benchmarkReturnValue)),
  //   ];
  const yDomain = [0.9, 5.05];

  const xTickValues = d3.range(
    d3.min(subDataset, yearAccessor),
    d3.max(subDataset, yearAccessor) + 1,
    1
  );

  const yTickValues = d3.range(1, 5.05, 0.5);

  const xType = d3.scaleLinear;
  const xRange = [0, dimensions.boundedWidth];
  const yType = d3.scaleLinear;
  const yRange = [dimensions.boundedHeight, 0];

  const yFormat = d3.format(`.0%`);
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);

  // Draw canvas
  const curve = d3.curveCardinal;
  const line_actualReturn = d3
    .line()
    .curve(curve)
    .x((i) => xScale(yearValue[i]))
    .y((i) => yScale(actualReturnValue[i]));

  const line_benchmarkReturn = d3
    .line()
    .curve(curve)
    .x((i) => xScale(yearValue[i]))
    .y((i) => yScale(benchmarkReturnValue[i]));

  //   const color = "steelblue";
  const strokeWidth = 3;
  const strokeLinejoin = "round";
  const strokeLinecap = "round";

  bound
    .select(".pathActualReturn")
    .selectAll("path")
    .data([I])
    .join("path")
    .transition()
    .duration(500)
    .attr("fill", "none")
    .attr("stroke", "#f63")
    .attr("stroke-width", strokeWidth)
    .attr("stroke-linejoin", strokeLinejoin)
    .attr("stroke-linecap", strokeLinecap)
    .attr("d", line_actualReturn);

  bound
    .select(".pathBenchmarkReturn")
    .selectAll("path")
    .data([I])
    .join("path")
    .transition()
    .duration(500)
    .attr("fill", "none")
    .attr("stroke", "#2879CB")
    .attr("stroke-width", strokeWidth)
    .attr("stroke-linejoin", strokeLinejoin)
    .attr("stroke-linecap", strokeLinecap)
    .attr("d", line_benchmarkReturn);

  // Draw peripherals
  const xAxis = d3
    .axisBottom(xScale)
    // .tickValues(xTickValues)
    .tickFormat(d3.format(".0f"))
    .tickSize(5);
  const yAxis = d3
    .axisLeft(yScale)
    .tickValues(yTickValues)
    .tickFormat((d) => d3.format(`.0%`)(d));
  bound
    .select(".x-axis")
    .call(xAxis)
    .call((g) => g.selectAll(".domain").remove())
    .style("color", "rgb(129, 129, 129)")
    .style("font-size", "10px")
    .style("font-weight", 500)
    .style("font-family", "'Open Sans', sans-serif")
    .attr("stroke-opacity", 0.5);

  bound
    .select(".y-axis")
    .call(yAxis)
    .call((g) => g.select(".domain").remove());

  bound
    .select(".y-axis")
    .selectAll(".tick line")
    .attr("x2", dimensions.boundedWidth + 50)
    .attr("transform", `translate(-40, 7)`)
    .attr("stroke-opacity", 0.2);

  bound
    .select(".y-axis")
    .selectAll(".tick text")
    .style("font-size", "10px")
    .style("font-weight", 500)
    .attr("fill", "rgb(129, 129, 129)");
  // .attr("transform", `translate(0, 0)`);

  // Set up interaction

  const y_highlight = bound.select(".y-highlight");

  const tipArea = bound.select(".tip-area");

  const tooltiptext_actualReturn = d3.select(".tooltiptext-actualReturn");
  const tooltiptext_benchmarkReturn = d3.select(".tooltiptext-becnhmarkReturn");
  const tooltip_blackline = d3.select(".tooltip-blackline");
  const tooltiptext_year = d3.select(".tooltiptext-year");

  const closest = (arr, num) => {
    return (
      arr.reduce((acc, val) => {
        if (Math.abs(val - num) < Math.abs(acc)) {
          return val - num;
        } else {
          return acc;
        }
      }, Infinity) + num
    );
  };

  wrapper
    .on("mouseover mousemove", (event) => {
      const xInvert = xScale.invert(
        d3.pointer(event)[0] - dimensions.margin.left
      );
      const closestX = closest(yearValue, xInvert);

      const actualReturn = yFormat(
        actualReturnValue[yearValue.indexOf(closestX)]
      );
      const benchmarkReturn = yFormat(
        benchmarkReturnValue[yearValue.indexOf(closestX)]
      );

      const yInvert = yScale.invert(
        Math.min(
          Math.max(
            d3.pointer(event)[1] - dimensions.margin.top,
            dimensions.margin.top
          ),
          dimensions.boundedHeight
        )
      );

      tooltip
        .attr(
          "x",
          xScale(closestX) < dimensions.boundedWidth / 2
            ? xScale(closestX) + 50
            : xScale(closestX) - 50
        )
        .attr("y", yScale(yInvert))
        .style("opacity", 1);

      tooltiptext_actualReturn
        .attr(
          "x",
          xScale(closestX) < dimensions.boundedWidth / 2
            ? xScale(closestX) + 50
            : xScale(closestX) - 125
        )
        .attr("y", yScale(yInvert) + 10)
        .style("opacity", 1)
        .text(`Cumulative actual return: ${actualReturn}`);

      tooltiptext_benchmarkReturn
        .attr(
          "x",
          xScale(closestX) < dimensions.boundedWidth / 2
            ? xScale(closestX) + 50
            : xScale(closestX) - 125
        )
        .attr("y", yScale(yInvert) + 30)
        .style("opacity", 1)
        .text(`Cumulative benchmark return: ${benchmarkReturn}`);

      tooltiptext_year
        .attr(
          "x",
          xScale(closestX) < dimensions.boundedWidth / 2
            ? xScale(closestX) + 50
            : xScale(closestX) - 125
        )
        .attr("y", yScale(yInvert) - 15)
        .style("opacity", 1)
        .text(`Year: ${closestX}`);

      tooltip_blackline
        .attr(
          "x1",
          xScale(closestX) < dimensions.boundedWidth / 2
            ? xScale(closestX) + 50
            : xScale(closestX) - 125
        )
        .attr("y1", yScale(yInvert) - 10)
        .attr(
          "x2",
          xScale(closestX) < dimensions.boundedWidth / 2
            ? xScale(closestX) + 220
            : xScale(closestX) + 50
        )
        .attr("y2", yScale(yInvert) - 10)
        .style("opacity", 1);

      y_highlight
        .attr("x1", xScale(closestX) + "px")
        .attr("x2", xScale(closestX) + "px")
        .style("opacity", 1);
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
      tooltiptext_actualReturn.style("opacity", 0);
      tooltiptext_benchmarkReturn.style("opacity", 0);
      tooltip_blackline.style("opacity", 0);
      tooltiptext_year.style("opacity", 0);
      y_highlight.style("opacity", 0);
    });
}

export { drawCumReturns_ };
